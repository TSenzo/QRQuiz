import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AnswerFeedbackProps {
  isVisible: boolean;
  isCorrect: boolean | null;
  onAnimationComplete?: () => void;
  duration?: number; // Durée de l'animation en ms
}

export default function AnswerFeedback({
  isVisible,
  isCorrect,
  onAnimationComplete,
  duration = 1500
}: AnswerFeedbackProps) {
  // Effet pour faire vibrer l'appareil si la fonction est disponible
  useEffect(() => {
    if (isVisible && isCorrect !== null && navigator.vibrate) {
      // Vibration courte pour bonne réponse, plus longue pour mauvaise réponse
      navigator.vibrate(isCorrect ? [100] : [100, 50, 150]);
    }
  }, [isVisible, isCorrect]);
  
  // Lancer des confettis pour les bonnes réponses
  useEffect(() => {
    if (isVisible && isCorrect === true) {
      const end = Date.now() + 1000;
      
      // Créer une animation de confettis qui dure 1000ms
      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B']
        });
        
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B']
        });
        
        // Ajout de confettis depuis le haut pour un effet plus festif
        confetti({
          particleCount: 3,
          angle: 90,
          spread: 45,
          origin: { x: 0.5, y: 0.3 },
          colors: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B']
        });
        
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      
      frame();
    }
  }, [isVisible, isCorrect]);
  
  // Timer pour cacher l'animation et appeler le callback
  useEffect(() => {
    if (isVisible && onAnimationComplete) {
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onAnimationComplete, duration]);
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ 
              scale: [0.5, 1.2, 1],
              rotate: isCorrect ? [0, 10, -10, 0] : [0, -5, 5, -5, 0]
            }}
            exit={{ scale: 0 }}
            transition={{ 
              duration: 0.5,
              type: "spring",
              stiffness: 200
            }}
            className={`rounded-full p-8 ${
              isCorrect ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {isCorrect ? (
              <CheckCircle2 className="h-16 w-16 text-white" />
            ) : (
              <XCircle className="h-16 w-16 text-white" />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}