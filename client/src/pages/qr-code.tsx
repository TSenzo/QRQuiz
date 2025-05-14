import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Quiz } from "@shared/schema";

export default function QRCode() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [qrValue, setQrValue] = useState('');
  
  // Fetch quiz data
  const { 
    data: quiz, 
    isLoading, 
    isError 
  } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${id}`],
  });
  
  // Set QR code value based on the current URL
  useEffect(() => {
    const baseUrl = window.location.origin;
    const quizUrl = `${baseUrl}/take-quiz/${id}`;
    setQrValue(quizUrl);
  }, [id]);
  
  const handleDownloadQR = () => {
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');
    
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `qrquiz-${quiz?.title || id}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    toast({
      title: "QR Code téléchargé",
      description: "Votre QR code a été téléchargé avec succès.",
    });
  };
  
  const handleShareQR = () => {
    const shareUrl = qrValue;
    const shareTitle = `Quiz: ${quiz?.title || 'QRQuiz'}`;
    const shareText = `Scannez ce QR code pour répondre au quiz "${quiz?.title || 'QRQuiz'}"`;
    
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      }).catch(error => console.log('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast({
          title: "Lien copié !",
          description: "Le lien du quiz a été copié dans le presse-papier.",
        });
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-neutral-600">Génération du QR code...</p>
        </div>
      </div>
    );
  }
  
  if (isError || !quiz) {
    return (
      <div className="screen p-6">
        <div className="text-center py-10">
          <div className="text-red-500 text-2xl mb-2">
            <i className="ri-error-warning-line"></i>
          </div>
          <h1 className="text-xl font-bold mb-2">Quiz non trouvé</h1>
          <p className="text-neutral-600 mb-6">
            Le quiz que vous recherchez n'existe pas ou n'est plus disponible.
          </p>
          <Button onClick={() => navigate('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="screen p-6 bg-neutral-50">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          className="p-2 -ml-2 text-neutral-600" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-neutral-800 ml-2">QR Code du quiz</h1>
      </div>
      
      <Card className="bg-white rounded-xl shadow-sm p-6 text-center mb-6">
        <p className="text-neutral-600 mb-6">{quiz.title}</p>
        
        {/* QR Code display */}
        <div className="bg-neutral-100 w-56 h-56 mx-auto rounded-lg relative overflow-hidden flex items-center justify-center">
          <canvas id="qr-code-canvas" className="hidden"></canvas>
          <QRCodeSVG
            value={qrValue}
            size={224}
            bgColor="#f5f5f5"
            fgColor="#000000"
            level="H"
            includeMargin={false}
            imageSettings={{
              src: "https://cdn-icons-png.flaticon.com/512/2991/2991152.png",
              x: undefined,
              y: undefined,
              height: 40,
              width: 40,
              excavate: true,
            }}
          />
        </div>
        
        <p className="text-sm text-neutral-500 mt-6">Scannez ce code QR pour accéder au quiz</p>
      </Card>
      
      <div className="space-y-3">
        <Button
          className="w-full py-3 px-4 bg-primary-500 text-white rounded-lg font-medium shadow-sm hover:bg-primary-600 transition flex items-center justify-center"
          onClick={handleDownloadQR}
        >
          <Download className="h-4 w-4 mr-1.5" /> Télécharger le code QR
        </Button>
        <Button
          variant="outline"
          className="w-full py-3 px-4 bg-white border border-neutral-300 rounded-lg font-medium text-neutral-600 shadow-sm hover:bg-neutral-50 transition flex items-center justify-center"
          onClick={handleShareQR}
        >
          <Share2 className="h-4 w-4 mr-1.5" /> Partager le code QR
        </Button>
      </div>
    </div>
  );
}
