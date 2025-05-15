import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TimerProgressProps {
  duration: number; // Durée totale en millisecondes
  remainingTime: number; // Temps restant en millisecondes
  onComplete?: () => void; // Callback à la fin du timer
  size?: 'sm' | 'md' | 'lg'; // Taille du timer
  showText?: boolean; // Afficher le texte du temps restant
  pulseWhenLow?: boolean; // Faire une animation de pulsation quand le temps est bas
  lowTimeThreshold?: number; // Seuil en secondes pour considérer que le temps est bas
}

export default function TimerProgress({
  duration,
  remainingTime,
  onComplete,
  size = 'md',
  showText = true,
  pulseWhenLow = true,
  lowTimeThreshold = 5
}: TimerProgressProps) {
  const [isLowTime, setIsLowTime] = useState(false);
  
  // Calculer le pourcentage de temps restant
  const percentage = Math.max(0, Math.min(100, (remainingTime / duration) * 100));
  
  // Formater le temps restant en secondes
  const remainingSeconds = Math.ceil(remainingTime / 1000);
  
  // Déterminer la couleur en fonction du temps restant
  const getColor = () => {
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    if (percentage > 10) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  // Déterminer la taille en fonction de la propriété size
  const getSize = () => {
    switch (size) {
      case 'sm': return 'h-2';
      case 'lg': return 'h-5';
      default: return 'h-3';
    }
  };
  
  // Vérifier si le temps est bas
  useEffect(() => {
    setIsLowTime(remainingSeconds <= lowTimeThreshold);
    
    // Appeler le callback onComplete quand le temps est écoulé
    if (remainingTime <= 0 && onComplete) {
      onComplete();
    }
  }, [remainingTime, lowTimeThreshold, onComplete, remainingSeconds]);
  
  return (
    <div className="w-full space-y-1">
      {showText && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Temps restant</span>
          <span 
            className={cn(
              "text-sm font-bold", 
              isLowTime ? "text-red-500" : "text-gray-700"
            )}
          >
            {remainingSeconds}s
          </span>
        </div>
      )}
      
      <div className={cn("w-full bg-gray-200 rounded-full overflow-hidden", getSize())}>
        <motion.div
          className={cn("h-full rounded-full", getColor())}
          style={{ width: `${percentage}%` }}
          initial={{ width: '100%' }}
          animate={{ 
            width: `${percentage}%`,
            // Ajouter une animation de pulsation si le temps est bas et l'option activée
            scale: (isLowTime && pulseWhenLow) ? [1, 1.03, 1] : 1,
            opacity: isLowTime && pulseWhenLow ? [1, 0.9, 1] : 1
          }}
          transition={{ 
            duration: 0.3,
            // Répéter l'animation de pulsation
            repeat: (isLowTime && pulseWhenLow) ? Infinity : 0,
            repeatType: "reverse"
          }}
        />
      </div>
    </div>
  );
}