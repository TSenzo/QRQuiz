import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MultiplayerService, wsConnection } from "@/lib/multiplayer-service";
import { useToast } from "@/hooks/use-toast";
import { GameSession, Quiz } from "@shared/schema";
import { Trophy, Home, Users, RefreshCw, Star, Zap, Award, PartyPopper, Crown } from "lucide-react";
import ResultsPodium from "@/components/results-podium";
import PlayerAvatar from "@/components/player-avatar";
import PlayerList from "@/components/player-list";
import confetti from "canvas-confetti";

// Animation pour les entrées du classement
const staggerItems = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const listItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function MultiplayerResults() {
  const { id: sessionId } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Récupérer les informations du joueur depuis le localStorage
  const playerId = localStorage.getItem("playerId") || "";
  const playerName = localStorage.getItem("playerName") || "";
  
  // Récupérer les informations de la session
  const { 
    data: session, 
    isLoading: isLoadingSession,
    isError: isErrorSession,
    error: errorSession
  } = useQuery<GameSession>({
    queryKey: ["/api/sessions", sessionId],
    queryFn: () => MultiplayerService.getSession(sessionId),
  });
  
  // Récupérer les informations du quiz
  const { 
    data: quiz, 
    isLoading: isLoadingQuiz 
  } = useQuery<Quiz>({
    queryKey: ["/api/quizzes", session?.quizId],
    queryFn: () => fetch(`/api/quizzes/${session?.quizId}`).then(res => res.json()),
    enabled: !!session?.quizId,
  });
  
  // Déconnecter le WebSocket à la destruction du composant
  useEffect(() => {
    return () => {
      wsConnection.disconnect();
    };
  }, []);
  
  // Effet pour lancer des confettis si le joueur est le gagnant
  useEffect(() => {
    if (session && playerId) {
      // Trouver le joueur actuel et sa position
      const sortedPlayers = [...session.players].sort((a, b) => b.currentScore - a.currentScore);
      const playerPosition = sortedPlayers.findIndex(p => p.id === playerId) + 1;
      
      // Lancer des confettis pour le gagnant
      if (playerPosition === 1) {
        const duration = 3000;
        const end = Date.now() + duration;
        
        const shootConfetti = () => {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0.1, y: 0.5 },
            colors: ['#ffd700', '#ffb900', '#ffffff']
          });
          
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 0.9, y: 0.5 },
            colors: ['#ffd700', '#ffb900', '#ffffff']
          });
          
          if (Date.now() < end) {
            requestAnimationFrame(shootConfetti);
          }
        };
        
        // Retarder le lancement pour s'assurer que le composant est monté
        setTimeout(() => {
          shootConfetti();
        }, 500);
      }
    }
  }, [session, playerId]);

  // Si la page est en cours de chargement
  if (isLoadingSession || isLoadingQuiz) {
    return (
      <div className="animated-gradient min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-4"
          >
            <Trophy className="h-16 w-16 text-yellow-400" />
          </motion.div>
          <p className="text-xl text-white">Chargement des résultats...</p>
        </div>
      </div>
    );
  }
  
  // Si une erreur s'est produite
  if (isErrorSession) {
    return (
      <div className="animated-gradient min-h-screen p-8">
        <Card className="max-w-2xl mx-auto glass-card border-red-400/20">
          <CardHeader>
            <CardTitle className="text-red-400">Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/80">Impossible de charger les résultats : {(errorSession as Error).message}</p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigate("/multiplayer")}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 border-0"
            >
              Retour
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Si le quiz n'est pas terminé
  if (session?.status !== "finished") {
    return (
      <div className="animated-gradient min-h-screen p-8">
        <Card className="max-w-2xl mx-auto glass-card border-orange-400/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <RefreshCw className="h-5 w-5 mr-2 text-orange-400" />
              Quiz en cours
            </CardTitle>
            <CardDescription className="text-white/70">
              Le quiz n'est pas encore terminé
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-white/80">Vous devez terminer le quiz avant de voir les résultats.</p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigate(`/multiplayer-game/${sessionId}`)}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:opacity-90 border-0"
            >
              Retourner au quiz
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Trier les joueurs par score décroissant
  const sortedPlayers = [...session.players].sort((a, b) => b.currentScore - a.currentScore);
  
  // Trouver le joueur actuel
  const currentPlayer = sortedPlayers.find(p => p.id === playerId);
  const currentPlayerRank = currentPlayer 
    ? sortedPlayers.findIndex(p => p.id === playerId) + 1
    : -1;
  
  // Message de félicitations basé sur la position
  const getPositionMessage = (position: number, totalPlayers: number) => {
    if (position === 1) return "Félicitations ! Vous êtes le grand gagnant !";
    if (position === 2) return "Excellent travail ! Vous êtes sur le podium !";
    if (position === 3 && totalPlayers > 3) return "Bravo ! Vous êtes sur le podium !";
    if (position <= totalPlayers / 2) return "Bien joué ! Vous êtes dans la première moitié du classement !";
    if (position === totalPlayers) return "Ne vous découragez pas, continuez à apprendre !";
    return "Continuez vos efforts, vous pouvez vous améliorer !";
  };

  return (
    <div className="animated-gradient min-h-screen pb-16">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center">
            <PartyPopper className="h-8 w-8 mr-3 text-yellow-400" />
            Résultats du Quiz
            <PartyPopper className="h-8 w-8 ml-3 text-yellow-400" />
          </h1>
          <p className="text-xl text-white/80">{quiz?.title}</p>
          
          {/* Message personnalisé en fonction de la position */}
          {currentPlayer && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-4"
            >
              <Badge className="text-base px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600">
                {getPositionMessage(currentPlayerRank, sortedPlayers.length)}
              </Badge>
            </motion.div>
          )}
        </motion.div>
        
        {/* Podium principal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <ResultsPodium players={sortedPlayers} />
        </motion.div>
        
        {/* Cartes des résultats et classement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Carte des statistiques personnelles */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Card className="glass-card border-purple-400/20 overflow-hidden h-full">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-xl text-white flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-400" />
                  Votre résultat
                </CardTitle>
                <CardDescription className="text-white/70">
                  Vos statistiques personnelles
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                {currentPlayer ? (
                  <>
                    <div className="flex items-center justify-center mb-6">
                      <PlayerAvatar 
                        name={currentPlayer.name}
                        isHost={currentPlayer.isHost}
                        size="lg"
                        position={currentPlayerRank}
                        showScore
                        score={currentPlayer.currentScore}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 mt-6">
                      <div className="bg-white/5 p-4 rounded-lg text-center">
                        <p className="text-white/70 text-sm mb-1">Votre score</p>
                        <p className="text-3xl font-bold text-white flex items-center justify-center">
                          <Zap className="h-5 w-5 mr-2 text-yellow-400" />
                          {currentPlayer.currentScore}
                          <span className="text-lg ml-1 text-white/70">pts</span>
                        </p>
                      </div>
                      
                      <div className="bg-white/5 p-4 rounded-lg text-center">
                        <p className="text-white/70 text-sm mb-1">Position</p>
                        <p className="text-3xl font-bold text-white flex items-center justify-center">
                          <Award className="h-5 w-5 mr-2 text-yellow-400" />
                          {currentPlayerRank}
                          <span className="text-lg ml-1 text-white/70">/{sortedPlayers.length}</span>
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-white/70 py-8">
                    Vous n'êtes plus dans cette session
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Carte du classement complet */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Card className="glass-card border-blue-400/20 overflow-hidden h-full">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-xl text-white flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-amber-400" />
                  Classement complet
                </CardTitle>
                <CardDescription className="text-white/70">
                  Tous les participants classés
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                <PlayerList 
                  players={sortedPlayers}
                  showScore={true}
                  showStatus={false}
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Boutons d'action */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="max-w-2xl mx-auto mt-12 flex flex-col md:flex-row gap-4 justify-center"
        >
          <Button 
            onClick={() => navigate("/")} 
            variant="outline" 
            className="flex gap-2 w-full md:w-auto bg-white/10 text-white hover:bg-white/20 border-white/20"
          >
            <Home className="h-4 w-4" />
            <span>Accueil</span>
          </Button>
          
          <Button 
            onClick={() => navigate("/multiplayer")} 
            variant="outline" 
            className="flex gap-2 w-full md:w-auto bg-white/10 text-white hover:bg-white/20 border-white/20"
          >
            <Users className="h-4 w-4" />
            <span>Autre partie</span>
          </Button>
          
          {currentPlayer?.isHost && (
            <Button 
              onClick={() => navigate(`/multiplayer-lobby/${sessionId}`)} 
              className="flex gap-2 w-full md:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 border-0"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Rejouer</span>
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}