import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MultiplayerService, wsConnection } from "@/lib/multiplayer-service";
import { useToast } from "@/hooks/use-toast";
import { GameSession, Quiz, Question } from "@shared/schema";
import { Loader2, Clock, UserCheck } from "lucide-react";
import TimerProgress from "@/components/timer-progress";
import AnswerFeedback from "@/components/answer-feedback";

export default function MultiplayerGame() {
  const { id: sessionId } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Récupérer les informations du joueur depuis le localStorage
  const playerId = localStorage.getItem("playerId") || "";
  const playerName = localStorage.getItem("playerName") || "";
  
  // États pour le jeu
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<"correct" | "incorrect" | null>(null);
  
  // Récupérer les informations de la session
  const { 
    data: session, 
    isLoading: isLoadingSession,
    isError: isErrorSession,
    error: errorSession
  } = useQuery<GameSession>({
    queryKey: ["/api/sessions", sessionId],
    queryFn: () => MultiplayerService.getSession(sessionId),
    refetchInterval: 1000, // Rafraîchir toutes les secondes
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
  
  // Vérifier que le joueur est dans la session
  const currentPlayer = session?.players.find(p => p.id === playerId);
  const isHost = currentPlayer?.isHost || false;
  
  // Déterminer la question actuelle
  const currentQuestion = quiz?.questions[session?.currentQuestionIndex || 0];
  
  // Mettre à jour le temps restant
  useEffect(() => {
    if (!session || !session.questionStartTime || session.status !== "playing") {
      setRemainingTime(0);
      return;
    }
    
    const timePerQuestion = session.timePerQuestion * 1000; // en ms
    const startTime = session.questionStartTime;
    const endTime = startTime + timePerQuestion;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = endTime - now;
      
      if (remaining <= 0) {
        setRemainingTime(0);
        clearInterval(interval);
      } else {
        setRemainingTime(remaining);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [session]);
  
  // Fonction pour passer à la question suivante (réservé à l'hôte)
  const goToNextQuestion = useCallback(async () => {
    try {
      if (!isHost) return;
      
      await MultiplayerService.nextQuestion(sessionId);
      
      // Réinitialiser l'état
      setSelectedAnswerId(null);
      setHasAnswered(false);
      setIsCorrect(null);
      setShowAnimation(false);
      setAnimationType(null);
    } catch (error) {
      console.error("Failed to go to next question:", error);
      toast({
        title: "Erreur",
        description: `Impossible de passer à la question suivante: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  }, [sessionId, isHost, toast]);
  
  // Gérer les événements WebSocket
  useEffect(() => {
    // Configurer les gestionnaires WebSocket
    const handleSessionUpdate = (data: any) => {
      // Mettre à jour les données de la session dans le cache React Query
      queryClient.setQueryData(["/api/sessions", sessionId], data.session);
      
      // Si le statut de la session est "finished", rediriger vers la page de résultats
      if (data.type === "game_finished" || data.session.status === "finished") {
        navigate(`/multiplayer-results/${sessionId}`);
      }
      
      // Si on passe à la question suivante, réinitialiser l'état
      if (data.type === "next_question") {
        setSelectedAnswerId(null);
        setHasAnswered(false);
        setIsCorrect(null);
        setShowAnimation(false);
        setAnimationType(null);
      }
    };
    
    // S'abonner aux événements
    wsConnection.on("next_question", handleSessionUpdate);
    wsConnection.on("game_finished", handleSessionUpdate);
    wsConnection.on("player_answered", handleSessionUpdate);
    
    // Se connecter au WebSocket si ce n'est pas déjà fait
    wsConnection.connect();
    
    // Nettoyage à la destruction du composant
    return () => {
      wsConnection.off("next_question", handleSessionUpdate);
      wsConnection.off("game_finished", handleSessionUpdate);
      wsConnection.off("player_answered", handleSessionUpdate);
    };
  }, [sessionId, queryClient, navigate]);
  
  // Passer automatiquement à la question suivante quand le temps est écoulé
  useEffect(() => {
    if (
      session?.status === "playing" && 
      remainingTime === 0 && 
      session.questionStartTime && 
      isHost &&
      !isSubmitting
    ) {
      const timeNow = Date.now();
      const timeElapsed = timeNow - session.questionStartTime;
      const timePerQuestion = session.timePerQuestion * 1000;
      
      // Si le temps est bien écoulé (avec une marge de 1 seconde)
      if (timeElapsed > timePerQuestion + 1000) {
        goToNextQuestion();
      }
    }
  }, [remainingTime, session, isHost, goToNextQuestion, isSubmitting]);
  
  // Soumettre une réponse
  const handleSubmitAnswer = async (answerId: number) => {
    if (hasAnswered || !currentQuestion || !session || session.status !== "playing") return;
    
    setSelectedAnswerId(answerId);
    setIsSubmitting(true);
    setHasAnswered(true);
    
    try {
      // Calculer le temps de réponse
      const responseTime = session.questionStartTime 
        ? Date.now() - session.questionStartTime
        : 0;
      
      // Soumettre la réponse
      const result = await MultiplayerService.submitAnswer(
        sessionId,
        playerId,
        currentQuestion.id,
        answerId,
        responseTime
      );
      
      // Afficher l'animation
      setIsCorrect(result.isCorrect);
      setAnimationType(result.isCorrect ? "correct" : "incorrect");
      setShowAnimation(true);
      
      // Faire vibrer l'appareil si disponible
      if (navigator.vibrate) {
        navigator.vibrate(result.isCorrect ? [100] : [100, 50, 100]);
      }
      
      // Masquer l'animation après un délai
      setTimeout(() => {
        setShowAnimation(false);
      }, 1500);
      
    } catch (error) {
      console.error("Failed to submit answer:", error);
      toast({
        title: "Erreur",
        description: `Impossible de soumettre votre réponse: ${(error as Error).message}`,
        variant: "destructive",
      });
      setHasAnswered(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Si la page est en cours de chargement
  if (isLoadingSession || isLoadingQuiz) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Chargement du quiz...</p>
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
            <p>Impossible de charger la session : {(errorSession as Error).message}</p>
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
  
  // Si le joueur n'est pas dans la session
  if (!currentPlayer) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive">Accès refusé</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Vous n'êtes pas inscrit dans cette session.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/multiplayer")}>
              Rejoindre une session
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Si la session est terminée
  if (session?.status === "finished") {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">Quiz terminé !</h1>
        <p className="mb-6">Redirection vers les résultats...</p>
        <Button onClick={() => navigate(`/multiplayer-results/${sessionId}`)}>
          Voir les résultats
        </Button>
      </div>
    );
  }
  
  // Si la session est en attente
  if (session?.status === "waiting") {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">En attente de démarrage</h1>
        <p className="mb-6">La partie va bientôt commencer...</p>
        <Button onClick={() => navigate(`/multiplayer-lobby/${sessionId}`)}>
          Retour au lobby
        </Button>
      </div>
    );
  }
  
  // Calculer le temps restant pour la question
  const timeProgress = session?.questionStartTime && session?.timePerQuestion
    ? Math.max(0, Math.min(100, (remainingTime / (session.timePerQuestion * 1000)) * 100))
    : 0;
  
  // Nombres de joueurs ayant répondu
  const answeredPlayers = session?.players.filter(p => {
    const playerAnswers = p.answers || [];
    return playerAnswers.some(a => a.questionId === currentQuestion?.id);
  }).length || 0;
  
  return (
    <div className="container mx-auto p-4 relative">
      {/* Animation de réponse avec effets visuels */}
      <AnswerFeedback 
        isVisible={showAnimation}
        isCorrect={isCorrect}
        onAnimationComplete={() => setShowAnimation(false)}
        duration={1500}
      />
      
      <div className="max-w-4xl mx-auto">
        {/* En-tête avec informations de jeu */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Question {(session?.currentQuestionIndex || 0) + 1}/{quiz?.questions.length || 0}
            </h1>
            <p className="text-sm text-muted-foreground">
              {quiz?.title}
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              <span>{answeredPlayers}/{session?.players.length || 0}</span>
            </div>
            
            <Badge>
              Score: {currentPlayer.currentScore}
            </Badge>
          </div>
        </div>
        
        {/* Chronomètre interactif */}
        <div className="mb-8">
          <TimerProgress
            duration={session?.timePerQuestion ? session.timePerQuestion * 1000 : 30000}
            remainingTime={remainingTime}
            size="lg"
            pulseWhenLow={true}
            lowTimeThreshold={5}
          />
        </div>
        
        {/* Question et réponses */}
        {currentQuestion ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{currentQuestion.text}</CardTitle>
              </CardHeader>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.answers.map((answer) => (
                <motion.div
                  key={answer.id}
                  whileHover={{ scale: hasAnswered ? 1 : 1.02 }}
                  whileTap={{ scale: hasAnswered ? 1 : 0.98 }}
                >
                  <Button
                    variant={selectedAnswerId === answer.id ? "default" : "outline"}
                    className={`w-full h-auto p-4 text-left justify-start items-start text-base font-normal ${
                      hasAnswered && selectedAnswerId === answer.id
                        ? isCorrect
                          ? "bg-green-500 hover:bg-green-500 border-green-500"
                          : "bg-red-500 hover:bg-red-500 border-red-500"
                        : ""
                    }`}
                    disabled={hasAnswered || isSubmitting}
                    onClick={() => handleSubmitAnswer(answer.id)}
                  >
                    <span>{answer.text}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center p-8">
            <p>Question en cours de chargement...</p>
          </div>
        )}
        
        {/* Bouton pour passer à la question suivante (visible seulement pour l'hôte) */}
        {isHost && (
          <div className="mt-8 text-center">
            <Button 
              onClick={goToNextQuestion}
              disabled={isSubmitting}
            >
              {(session?.currentQuestionIndex || 0) >= (quiz?.questions.length || 0) - 1
                ? "Terminer le quiz"
                : "Question suivante"}
            </Button>
            
            <p className="text-sm text-muted-foreground mt-2">
              En tant qu'hôte, vous pouvez passer à la question suivante à tout moment.
              <br />
              La question passera automatiquement quand le temps sera écoulé.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}