import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { QuizCard } from "@/components/quiz-card";
import { MultiplayerService } from "@/lib/multiplayer-service";
import { useToast } from "@/hooks/use-toast";
import { Quiz } from "@shared/schema";
import { QRScanner } from "@/components/ui/qr-scanner";

export default function Multiplayer() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [playerName, setPlayerName] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState("join");

  // Récupérer les quiz disponibles pour créer une session
  const { data: quizzes, isLoading: isLoadingQuizzes } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
  });

  // Rejoindre une session existante
  const handleJoinSession = async () => {
    if (!playerName || !sessionId) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez entrer votre nom et l'identifiant de la session.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Générer un ID de joueur unique
      const playerId = MultiplayerService.generatePlayerId();
      
      // Sauvegarder les informations du joueur dans le localStorage
      localStorage.setItem("playerName", playerName);
      localStorage.setItem("playerId", playerId);

      // Rejoindre la session
      await MultiplayerService.joinSession(sessionId, {
        id: playerId,
        name: playerName
      });

      // Rediriger vers la page de la session
      navigate(`/multiplayer-lobby/${sessionId}`);
    } catch (error) {
      console.error("Failed to join session:", error);
      toast({
        title: "Erreur",
        description: `Impossible de rejoindre la session: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  // Créer une nouvelle session
  const handleCreateSession = async (quizId: number) => {
    if (!playerName) {
      toast({
        title: "Nom requis",
        description: "Veuillez entrer votre nom pour créer une session.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Générer un ID de joueur unique
      const playerId = MultiplayerService.generatePlayerId();
      
      // Sauvegarder les informations du joueur dans le localStorage
      localStorage.setItem("playerName", playerName);
      localStorage.setItem("playerId", playerId);

      // Créer la session
      const session = await MultiplayerService.createSession(
        quizId,
        playerId,
        playerName,
        30 // 30 secondes par question par défaut
      );

      // Rediriger vers la page de la session
      navigate(`/multiplayer-lobby/${session.id}`);
    } catch (error) {
      console.error("Failed to create session:", error);
      toast({
        title: "Erreur",
        description: `Impossible de créer la session: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  // Gérer le scan d'un QR code de session
  const handleScanResult = (data: string) => {
    setShowScanner(false);
    
    try {
      // Le format attendu est http://host/multiplayer?sessionId=XXX
      const url = new URL(data);
      const params = new URLSearchParams(url.search);
      const scannedSessionId = params.get("sessionId");
      
      if (scannedSessionId) {
        setSessionId(scannedSessionId);
        toast({
          title: "QR Code scanné",
          description: `Session trouvée : ${scannedSessionId}`,
        });
      } else {
        toast({
          title: "QR Code invalide",
          description: "Le QR code ne contient pas d'identifiant de session valide.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Invalid QR code URL:", error);
      toast({
        title: "QR Code invalide",
        description: "Impossible de lire l'URL du QR code.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Mode Multijoueur</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Qui êtes-vous ?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="playerName">Votre nom</Label>
              <Input
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Entrez votre nom"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="join" className="flex-1">Rejoindre une partie</TabsTrigger>
            <TabsTrigger value="create" className="flex-1">Créer une partie</TabsTrigger>
          </TabsList>

          <TabsContent value="join">
            <Card>
              <CardHeader>
                <CardTitle>Rejoindre une session existante</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionId">ID de la session</Label>
                    <div className="flex gap-2">
                      <Input
                        id="sessionId"
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                        placeholder="Exemple: ABC123"
                        className="uppercase"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => setShowScanner(true)}
                        title="Scanner un QR code"
                      >
                        Scanner
                      </Button>
                    </div>
                  </div>
                  
                  {showScanner && (
                    <div className="mt-4">
                      <div className="relative aspect-square max-w-sm mx-auto border-2 border-primary rounded-lg overflow-hidden">
                        <QRScanner 
                          onScan={handleScanResult} 
                          onClose={() => setShowScanner(false)} 
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        onClick={() => setShowScanner(false)}
                        className="mt-2 mx-auto block"
                      >
                        Annuler
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleJoinSession}
                  disabled={!sessionId || !playerName}
                  className="w-full"
                >
                  Rejoindre la partie
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Créer une nouvelle session</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingQuizzes ? (
                  <div className="text-center py-8">Chargement des quiz...</div>
                ) : quizzes && quizzes.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Sélectionnez un quiz pour commencer une partie multijoueur :
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      {quizzes.map((quiz) => (
                        <QuizCard
                          key={quiz.id}
                          quiz={quiz}
                          onDeleteQuiz={undefined}
                          onShareQuiz={undefined}
                          className="h-full cursor-pointer transition-all hover:ring-2 hover:ring-primary"
                          onClick={() => handleCreateSession(quiz.id)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="mb-4">Aucun quiz disponible.</p>
                    <Link href="/create-quiz">
                      <Button>Créer un quiz</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="ghost">Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}