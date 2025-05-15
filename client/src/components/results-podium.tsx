import React from 'react';
import { motion } from 'framer-motion';
import { Player } from '@shared/schema';
import PlayerAvatar from '@/components/player-avatar';
import { Trophy, Award, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface ResultsPodiumProps {
  players: Player[];
  className?: string;
}

export default function ResultsPodium({ players, className = "" }: ResultsPodiumProps) {
  // Trier les joueurs par score (du plus élevé au plus bas)
  const sortedPlayers = [...players].sort((a, b) => (b.currentScore || 0) - (a.currentScore || 0));
  
  // Limiter à 3 joueurs pour le podium
  const topPlayers = sortedPlayers.slice(0, 3);
  
  // Calculer le nombre de joueurs sur le podium
  const playerCount = topPlayers.length;
  
  // Lancer des confettis pour le gagnant
  React.useEffect(() => {
    if (playerCount > 0) {
      const end = Date.now() + 3000;
      
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0.3, y: 0.5 },
          colors: ['#ffd700', '#ffffff', '#eeeeee']
        });
        
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 0.7, y: 0.5 },
          colors: ['#ffd700', '#ffffff', '#eeeeee']
        });
        
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      
      // Retarder le lancement pour s'assurer que le composant est monté
      setTimeout(() => {
        frame();
      }, 500);
    }
  }, [playerCount]);
  
  // Messages de victoire
  const getVictoryMessage = (position: number) => {
    const messages = {
      1: ["Champion(ne) !", "Imbattable !", "Génie !"],
      2: ["Presque !", "Belle performance !", "Argenté(e) !"],
      3: ["Sur le podium !", "Bronze obtenu !", "Bien joué !"]
    };
    
    const options = messages[position as keyof typeof messages] || ["Bien joué !"];
    return options[Math.floor(Math.random() * options.length)];
  };
  
  const getIcon = (position: number) => {
    switch (position) {
      case 1: return <Trophy className="h-8 w-8 text-yellow-400" />;
      case 2: return <Award className="h-7 w-7 text-gray-300" />;
      case 3: return <Medal className="h-6 w-6 text-amber-700" />;
      default: return null;
    }
  };
  
  // Ordre d'affichage sur le podium (2e à gauche, 1er au milieu, 3e à droite)
  const podiumOrder = playerCount === 3 
    ? [topPlayers[1], topPlayers[0], topPlayers[2]] 
    : playerCount === 2
      ? [topPlayers[1], topPlayers[0], null]
      : playerCount === 1
        ? [null, topPlayers[0], null]
        : [null, null, null];
  
  const staggerDelay = 0.2;
  
  return (
    <div className={cn("podium-container", className)}>
      {podiumOrder.map((player, index) => {
        // Déterminer la position réelle du joueur
        const realPosition = player ? sortedPlayers.findIndex(p => p.id === player.id) + 1 : 0;
        const podiumPosition = index === 0 ? 2 : index === 1 ? 1 : 3;
        
        return (
          <motion.div
            key={player?.id || `empty-${index}`}
            className={`podium-place ${player ? `podium-${podiumPosition}` : "opacity-0"}`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: staggerDelay * index }}
          >
            {player && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 + (staggerDelay * index) }}
                  className="mb-3"
                >
                  <PlayerAvatar 
                    name={player.name} 
                    isHost={player.isHost}
                    score={player.currentScore} 
                    position={realPosition}
                    size="lg"
                  />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.7 + (staggerDelay * index) }}
                  className="text-center mb-2"
                >
                  <div className="flex items-center justify-center mb-1">
                    {getIcon(realPosition)}
                  </div>
                  <p className="font-bold text-white">{player.name}</p>
                  <p className="text-sm text-white/80">{player.currentScore} pts</p>
                  <p className="text-xs text-white/70 mt-1">{getVictoryMessage(realPosition)}</p>
                </motion.div>
                
                <motion.div 
                  className={`podium-base w-24`}
                  initial={{ height: 0 }}
                  animate={{ height: podiumPosition === 1 ? 100 : podiumPosition === 2 ? 70 : 40 }}
                  transition={{ duration: 0.5, delay: 0.3 + (staggerDelay * index) }}
                />
              </>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}