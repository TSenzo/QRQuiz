import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Crown, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerAvatarProps {
  name: string;
  isHost?: boolean;
  isActive?: boolean;
  score?: number;
  position?: number;
  showScore?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function PlayerAvatar({ 
  name, 
  isHost = false, 
  isActive = false,
  score, 
  position,
  showScore = false,
  className = "",
  size = 'md'
}: PlayerAvatarProps) {
  // Générer une couleur unique basée sur le nom du joueur
  const getColorFromName = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 
      'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-orange-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  // Obtenir les initiales du joueur
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };
  
  // Déterminer la taille de l'avatar
  const sizeClass = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-lg'
  }[size];
  
  // Classe de bordure pour le joueur actif
  const activeBorder = isActive ? 'ring-2 ring-offset-2 ring-white' : '';
  
  // Badge pour le score
  const scoreBadge = showScore && score !== undefined ? (
    <div className="absolute -bottom-2 -right-2 bg-white text-black font-bold rounded-full px-2 py-0.5 text-xs shadow-md">
      {score}
    </div>
  ) : null;
  
  // Badge de position
  const positionBadge = position !== undefined ? (
    <div className={cn(
      "absolute -top-2 -right-2 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold shadow-md",
      position === 1 ? "bg-yellow-400 text-black" : 
      position === 2 ? "bg-gray-300 text-black" :
      position === 3 ? "bg-amber-700 text-white" :
      "bg-gray-600 text-white"
    )}>
      {position}
    </div>
  ) : null;
  
  return (
    <div className={cn("avatar-container", className)}>
      <Avatar className={cn(sizeClass, getColorFromName(name), activeBorder)}>
        <AvatarFallback className="text-white">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      
      {isHost && (
        <div className="avatar-badge host-badge">
          <Crown className="h-3 w-3" />
        </div>
      )}
      
      {scoreBadge}
      {positionBadge}
    </div>
  );
}