import React from 'react';
import { motion } from 'framer-motion';
import { Player } from '@shared/schema';
import PlayerAvatar from '@/components/player-avatar';
import { Card } from '@/components/ui/card';
import { Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerListProps {
  players: Player[];
  className?: string;
  showStatus?: boolean;
  showScore?: boolean;
}

export default function PlayerList({ 
  players, 
  className = "", 
  showStatus = true,
  showScore = false
}: PlayerListProps) {
  // Trier les joueurs : d'abord l'hôte, puis par ordre alphabétique
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.isHost && !b.isHost) return -1;
    if (!a.isHost && b.isHost) return 1;
    
    if (showScore && a.currentScore !== b.currentScore) {
      return (b.currentScore || 0) - (a.currentScore || 0);
    }
    
    return a.name.localeCompare(b.name);
  });
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.div 
      className={cn("grid gap-3", className)} 
      variants={container}
      initial="hidden"
      animate="show"
    >
      {sortedPlayers.map((player, index) => (
        <motion.div key={player.id} variants={item}>
          <Card className="p-3 flex items-center justify-between glass-card backdrop-blur-md bg-white/5">
            <div className="flex items-center gap-3">
              <PlayerAvatar 
                name={player.name} 
                isHost={player.isHost} 
                size="sm"
                showScore={showScore}
                score={player.currentScore}
              />
              
              <div>
                <p className="font-medium text-white">
                  {player.name} {player.isHost && <span className="text-amber-400">(Hôte)</span>}
                </p>
                {showScore && (
                  <p className="text-xs text-white/70">
                    Score: {player.currentScore || 0} points
                  </p>
                )}
              </div>
            </div>
            
            {showStatus && (
              <div className="flex items-center gap-1">
                {player.isReady ? (
                  <div className="text-green-400 flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    <span className="text-sm">Prêt</span>
                  </div>
                ) : (
                  <div className="text-amber-400 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-sm">En attente</span>
                  </div>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}