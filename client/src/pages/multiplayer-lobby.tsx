import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { MultiplayerService, wsConnection } from "@/lib/multiplayer-service";
import { useToast } from "@/hooks/use-toast";
import { GameSession, Quiz } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function MultiplayerLobby() {
  const { id: sessionId } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Récupérer les informations du joueur depuis le localStorage
  const playerId = localStorage.getItem("playerId") || "";
  const playerName = localStorage.getItem("playerName") || "";
  
  // États pour le lobby
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Récupérer les informations de la session
  const { 
    data: session, 
    isLoading: isLoadingSession,
    isError: isErrorSession,
    error: errorSession
  } = useQuery<GameSession>({
    queryKey: ["/api/sessions", sessionId],
    queryFn: () => MultiplayerService.getSession(sessionId),
    refetchInterval: 3000, // Rafraîchir toutes les 3 secondes
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
  
  // Récupérer l'URL pour le QR code (pour rejoindre la session)
  const sessionUrl = `${window.location.origin}/multiplayer?sessionId=${sessionId}`;
  
  // Gérer les événements WebSocket
  useEffect(() => {
    // Configurer les gestionnaires WebSocket
    const handleConnection = () => {
      setIsConnected(true);
      wsConnection.joinSession(sessionId, playerId);
    };
    
    const handleDisconnection = () => {
      setIsConnected(false);
    };
    
    const handleSessionUpdate = (data: any) => {
      // Mettre à jour les données de la session dans le cache React Query
      queryClient.setQueryData(["/api/sessions", sessionId], data.session);
      
      // Si le statut de la session est "playing", rediriger vers la page de jeu
      if (data.type === "game_started" || data.session.status === "playing") {
        navigate(`/multiplayer-game/${sessionId}`);
      }
    };
    
    // S'abonner aux événements
    wsConnection.on("connection", handleConnection);
    wsConnection.on("disconnection", handleDisconnection);
    wsConnection.on("joined_session", handleSessionUpdate);
    wsConnection.on("player_joined", handleSessionUpdate);
    wsConnection.on("player_left", handleSessionUpdate);
    wsConnection.on("player_ready", handleSessionUpdate);
    wsConnection.on("game_started", handleSessionUpdate);
    
    // Se connecter au WebSocket
    wsConnection.connect();
    wsConnection.joinSession(sessionId, playerId);
    
    // Nettoyage à la destruction du composant
    return () => {
      wsConnection.off("connection", handleConnection);
      wsConnection.off("disconnection", handleDisconnection);
      wsConnection.off("joined_session", handleSessionUpdate);
      wsConnection.off("player_joined", handleSessionUpdate);
      wsConnection.off("player_left", handleSessionUpdate);
      wsConnection.off("player_ready", handleSessionUpdate);
      wsConnection.off("game_started", handleSessionUpdate);
    };
  }, [sessionId, playerId, queryClient, navigate]);
  
  // Marquer le joueur comme prêt/pas prêt
  const handleToggleReady = async () => {
    try {
      const newReadyState = !isReady;
      await MultiplayerService.setPlayerReady(sessionId, playerId, newReadyState);
      setIsReady(newReadyState);
    } catch (error) {
      console.error("Failed to set ready state:", error);
      toast({
        title: "Erreur",
        description: `Impossible de changer votre état de préparation: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };
  
  // Démarrer la partie (réservé à l'hôte)
  const handleStartGame = async () => {
    try {
      await MultiplayerService.startSession(sessionId);
    } catch (error) {
      console.error("Failed to start game:", error);
      toast({
        title: "Erreur",
        description: `Impossible de démarrer la partie: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };
  
  // Quitter la session
  const handleLeaveSession = async () => {
    try {
      await MultiplayerService.leaveSession(sessionId, playerId);
      navigate("/multiplayer");
    } catch (error) {
      console.error("Failed to leave session:", error);
    }
  };
  
  // Si la page est en cours de chargement
  if (isLoadingSession || isLoadingQuiz) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Chargement de la session...</p>
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
  
  // Joueurs prêts / total
  const readyPlayers = session.players.filter(p => p.isReady).length;
  const totalPlayers = session.players.length;
  const allReady = readyPlayers === totalPlayers;
  
  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Salle d'attente</h1>
          {quiz && (
            <p className="text-xl">Quiz: {quiz.title}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            ID de session: <span className="font-mono">{sessionId}</span>
          </p>
          
          {isHost && (
            <div className="mt-4">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Connecté" : "Déconnecté"}
              </Badge>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* QR Code pour rejoindre (visible seulement pour l'hôte) */}
          {isHost && (
            <Card>
              <CardHeader>
                <CardTitle>Inviter des joueurs</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="bg-white p-3 rounded-lg mb-4">
                  <QRCodeSVG 
                    value={sessionUrl}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Les autres joueurs peuvent scanner ce QR code ou utiliser l'ID de session pour rejoindre.
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Liste des joueurs */}
          <Card className={isHost ? "" : "col-span-full"}>
            <CardHeader>
              <CardTitle>Joueurs ({readyPlayers}/{totalPlayers} prêts)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {session.players.map(player => (
                  <li 
                    key={player.id} 
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{player.name}</span>
                      {player.isHost && (
                        <Badge variant="outline">Hôte</Badge>
                      )}
                    </div>
                    <Badge 
                      variant={player.isReady ? "success" : "secondary"}
                      className={player.isReady ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {player.isReady ? "Prêt" : "En attente"}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          {/* Bouton pour se marquer comme prêt/pas prêt */}
          <Button 
            onClick={handleToggleReady}
            variant={isReady ? "outline" : "default"}
            className={isReady ? "border-green-500 text-green-500" : ""}
          >
            {isReady ? "Je ne suis plus prêt" : "Je suis prêt !"}
          </Button>
          
          {/* Bouton pour démarrer la partie (visible seulement pour l'hôte) */}
          {isHost && (
            <Button 
              onClick={handleStartGame}
              disabled={!allReady}
              className="bg-green-500 hover:bg-green-600"
            >
              Démarrer la partie
            </Button>
          )}
          
          {/* Bouton pour quitter la session */}
          <Button 
            onClick={handleLeaveSession}
            variant="destructive"
          >
            Quitter la session
          </Button>
        </div>
        
        {isHost && !allReady && (
          <p className="text-sm text-center text-muted-foreground mt-4">
            Tous les joueurs doivent être prêts pour démarrer la partie.
          </p>
        )}
      </div>
    </div>
  );
}