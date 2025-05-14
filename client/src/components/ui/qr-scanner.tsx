import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useToast } from "@/hooks/use-toast";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const [hasCamera, setHasCamera] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivRef = useRef<HTMLDivElement>(null);
  
  // Check if camera is available
  useEffect(() => {
    const checkCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoInput = devices.some(device => device.kind === 'videoinput');
        setHasCamera(hasVideoInput);
        
        if (!hasVideoInput) {
          toast({
            title: "Caméra non disponible",
            description: "Aucune caméra n'a été détectée sur votre appareil.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error checking camera:", error);
        setHasCamera(false);
        toast({
          title: "Accès caméra impossible",
          description: "L'application n'a pas pu accéder à votre caméra.",
          variant: "destructive"
        });
      }
    };

    checkCamera();
  }, [toast]);

  // Initialize scanner
  useEffect(() => {
    if (!hasCamera || !scannerDivRef.current) return;

    const scannerId = "qr-scanner-container";
    scannerRef.current = new Html5Qrcode(scannerId);

    // Start scanning
    const startScanner = async () => {
      try {
        setScanning(true);
        
        await scannerRef.current?.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: 250,
            aspectRatio: 1.0,
            disableFlip: false
          },
          (decodedText) => {
            // Success callback
            onScan(decodedText);
            stopScanner();
          },
          (errorMessage) => {
            // Error callback - we'll ignore this as it fires frequently during scanning
            // console.error(errorMessage);
          }
        );
      } catch (err) {
        console.error("Error starting scanner:", err);
        toast({
          title: "Erreur de la caméra",
          description: "Impossible d'initialiser la caméra. Veuillez réessayer.",
          variant: "destructive"
        });
        setScanning(false);
      }
    };

    startScanner();

    // Cleanup function
    return () => {
      stopScanner();
    };
  }, [hasCamera, onScan, toast]);

  const stopScanner = async () => {
    if (scannerRef.current && scanning) {
      try {
        await scannerRef.current.stop();
        setScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };
  
  const toggleFlash = async () => {
    if (!scannerRef.current || !scanning) return;
    
    try {
      if (!flashOn) {
        // La fonction flash n'est pas supportée dans tous les navigateurs
        try {
          // @ts-ignore - torch n'est pas dans les types standard mais est supporté par certains appareils
          await scannerRef.current.applyVideoConstraints({ 
            advanced: [{ torch: true }] 
          });
        } catch (e) {
          console.log("Flash non supporté", e);
        }
      } else {
        try {
          // @ts-ignore - torch n'est pas dans les types standard mais est supporté par certains appareils
          await scannerRef.current.applyVideoConstraints({ 
            advanced: [{ torch: false }] 
          });
        } catch (e) {
          console.log("Flash non supporté", e);
        }
      }
      setFlashOn(!flashOn);
    } catch (err) {
      console.error("Error toggling flash:", err);
      toast({
        title: "Flash non disponible",
        description: "Impossible d'activer le flash sur cet appareil.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && scannerRef.current) {
      // Stop the camera scanner first
      stopScanner();
      
      scannerRef.current.scanFile(file, true)
        .then(decodedText => {
          onScan(decodedText);
        })
        .catch(err => {
          console.error("Error scanning file:", err);
          toast({
            title: "Erreur de lecture",
            description: "Impossible de détecter un QR code dans cette image.",
            variant: "destructive"
          });
          // Restart camera scanner
          if (hasCamera && scannerRef.current) {
            scannerRef.current.start(
              { facingMode: "environment" },
              {
                fps: 10,
                qrbox: 250,
                aspectRatio: 1.0
              },
              (decodedText) => onScan(decodedText),
              () => {}
            );
            setScanning(true);
          }
        });
    }
  };

  return (
    <div className="relative h-full bg-black">
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4">
        <button 
          onClick={onClose}
          className="p-2 text-white bg-black bg-opacity-50 rounded-full"
        >
          <i className="ri-arrow-left-line text-xl"></i>
        </button>
        <button 
          onClick={toggleFlash}
          className="p-2 text-white bg-black bg-opacity-50 rounded-full"
        >
          <i className={`ri-flashlight-${flashOn ? 'fill' : 'line'} text-xl`}></i>
        </button>
      </div>
      
      <div 
        id="qr-scanner-container" 
        ref={scannerDivRef} 
        className="w-full h-full"
      >
        {!hasCamera && (
          <div className="flex items-center justify-center h-full">
            <p className="text-white text-center">Caméra non disponible</p>
          </div>
        )}
      </div>
      
      {/* QR Viewfinder */}
      <div className="qr-viewfinder">
        <div className="qr-corner-bl"></div>
        <div className="qr-corner-br"></div>
        <div className="qr-scanner-line"></div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6 text-center text-white">
        <p className="mb-4 font-medium">Placez le QR code dans le cadre</p>
        
        {/* Gallery upload option */}
        <label className="bg-white text-neutral-800 font-medium rounded-full px-4 py-2.5 inline-flex items-center cursor-pointer">
          <i className="ri-image-line mr-2"></i> Importer depuis la galerie
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileUpload}
          />
        </label>
      </div>
    </div>
  );
};

export default QRScanner;
