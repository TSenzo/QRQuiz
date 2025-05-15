import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MultiplayerService, wsConnection } from "@/lib/multiplayer-service";
import { useToast } from "@/hooks/use-toast";
import { GameSession, Quiz } from "@shared/schema";
import { Loader2, Trophy, Medal, ChevronUp, Home } from "lucide-react";

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
  
  // Si la page est en cours de chargement
  if (isLoadingSession || isLoadingQuiz) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Chargement des résultats...</p>
      </div>
    );
  }
  
  // Si une erreur s'est produite
  if (isErrorSession) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive">Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Impossible de charger les résultats : {(errorSession as Error).message}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/multiplayer")}>
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
      <div className="container mx-auto p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Quiz en cours</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Le quiz n'est pas encore terminé.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate(`/multiplayer-game/${sessionId}`)}>
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
  
  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Résultats du Quiz</h1>
          {quiz && (
            <div className="mb-4">
              <p className="text-xl font-medium">{quiz.title}</p>
              <p className="text-sm text-muted-foreground">
                {quiz.questions.length} questions
              </p>
            </div>
          )}
          
          {currentPlayer && (
            <div className="mt-6">
              <p className="text-xl">
                Votre Score: <span className="font-bold">{currentPlayer.currentScore} points</span>
              </p>
              <p>
                Votre rang: <span className="font-bold">{currentPlayerRank}</span> sur {sortedPlayers.length}
              </p>
            </div>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Classement Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.ul 
              className="space-y-4"
              variants={staggerItems}
              initial="hidden"
              animate="show"
            >
              {sortedPlayers.map((player, index) => (
                <motion.li 
                  key={player.id}
                  variants={listItem}
                  className={`p-4 border rounded-lg flex items-center ${
                    player.id === playerId ? "bg-primary/10 border-primary" : ""
                  }`}
                >
                  <div className="flex-shrink-0 w-10 text-center">
                    {index === 0 ? (
                      <Trophy className="h-6 w-6 mx-auto text-yellow-500" />
                    ) : index === 1 ? (
                      <Medal className="h-6 w-6 mx-auto text-gray-400" />
                    ) : index === 2 ? (
                      <Medal className="h-6 w-6 mx-auto text-amber-700" />
                    ) : (
                      <span className="text-lg font-bold">{index + 1}</span>
                    )}
                  </div>
                  
                  <div className="ml-4 flex-grow">
                    <div className="font-medium">
                      {player.name}
                      {player.id === playerId && (
                        <Badge variant="outline" className="ml-2">Vous</Badge>
                      )}
                      {player.isHost && (
                        <Badge variant="secondary" className="ml-2">Hôte</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {(player.answers?.length || 0)} réponses
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xl font-bold">{player.currentScore}</div>
                    <div className="text-sm text-muted-foreground">points</div>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline" 
              onClick={() => navigate("/multiplayer")}
              className="w-full sm:w-auto"
            >
              Jouer un autre quiz
            </Button>
            
            <Button 
              onClick={() => navigate("/")}
              className="w-full sm:w-auto"
            >
              <Home className="h-4 w-4 mr-2" />
              Accueil
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}