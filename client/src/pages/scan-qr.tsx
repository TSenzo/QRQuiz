import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import QRScanner from "@/components/ui/qr-scanner";

export default function ScanQR() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  const handleScan = (data: string) => {
    try {
      // Check if the data is a URL
      let url: URL;
      
      try {
        url = new URL(data);
      } catch (error) {
        throw new Error("QR code invalide. Pas une URL valide.");
      }
      
      // Extract the quiz ID from the URL path
      const pathSegments = url.pathname.split('/');
      const quizIdStr = pathSegments[pathSegments.length - 1];
      const quizId = parseInt(quizIdStr);
      
      if (isNaN(quizId)) {
        throw new Error("QR code invalide. ID de quiz non trouvé.");
      }
      
      // Navigate to the quiz page
      toast({
        title: "QR Code scanné avec succès",
        description: "Chargement du quiz...",
      });
      
      navigate(`/take-quiz/${quizId}`);
    } catch (error) {
      console.error("Error scanning QR code:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "QR code invalide ou corrompu.",
        variant: "destructive"
      });
    }
  };
  
  const handleClose = () => {
    navigate('/');
  };
  
  return (
    <div className="screen h-screen bg-black">
      <QRScanner onScan={handleScan} onClose={handleClose} />
    </div>
  );
}
