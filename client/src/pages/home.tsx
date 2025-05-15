import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import QuizCard from "@/components/quiz-card";
import ScoreCard from "@/components/score-card";
import { Quiz, Score } from "@shared/schema";
import { Edit, QrCode, Scan, Award, Users, Brain, Trophy, PartyPopper, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // Fetch quizzes
  const { 
    data: quizzes = [], 
    isLoading: isLoadingQuizzes,
    isError: isQuizzesError
  } = useQuery<Quiz[]>({
    queryKey: ['/api/quizzes'],
  });
  
  // Fetch leaderboard
  const { 
    data: leaderboard = [], 
    isLoading: isLoadingLeaderboard,
    isError: isLeaderboardError
  } = useQuery<Score[]>({
    queryKey: ['/api/leaderboard', { limit: 3 }],
  });
  
  // Delete quiz mutation
  const deleteQuizMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/quizzes/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      toast({
        title: "Quiz supprimé",
        description: "Le quiz a été supprimé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le quiz.",
        variant: "destructive",
      });
    }
  });
  
  const handleDeleteQuiz = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce quiz ?")) {
      deleteQuizMutation.mutate(id);
    }
  };
  
  const handleShareQuiz = (id: number) => {
    navigate(`/qr-code/${id}`);
  };
  
  const handleScanQR = () => {
    navigate('/scan-qr');
  };
  
  const handleCreateQuiz = () => {
    navigate('/create-quiz');
  };
  
  const handleMultiplayer = () => {
    navigate('/multiplayer');
  };
  
  // Get only the most recent 2 quizzes
  const recentQuizzes = quizzes.slice(0, 2);
  
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
    <div className="animated-gradient min-h-screen pt-8 pb-16">
      <div className="container mx-auto px-4 py-4">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold mb-2 text-white flex items-center justify-center">
            <Sparkles className="h-10 w-10 mr-3 text-yellow-400" />
            QRQuiz
            <Sparkles className="h-10 w-10 ml-3 text-yellow-400" />
          </h1>
          <p className="text-xl text-white/80 max-w-lg mx-auto">
            Créez, partagez et jouez à des quiz interactifs avec vos amis !
          </p>
        </motion.div>
        
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
        >
          <motion.div variants={item}>
            <Card className="glass-card border-purple-400/20 overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/10">
                <CardTitle className="text-xl text-white">Actions rapides</CardTitle>
                <CardDescription className="text-white/70">
                  Commencez rapidement avec ces options
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={handleCreateQuiz}
                    className="h-28 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-violet-600 to-purple-700 hover:opacity-90 hover:scale-105 transition-all border-0 quiz-button"
                  >
                    <Edit className="h-6 w-6" />
                    <span>Créer un Quiz</span>
                  </Button>
                  
                  <Button 
                    onClick={handleScanQR}
                    variant="secondary"
                    className="h-28 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-600 to-indigo-700 hover:opacity-90 hover:scale-105 transition-all border-0 text-white quiz-button"
                  >
                    <Scan className="h-6 w-6" />
                    <span>Scanner un QR</span>
                  </Button>
                  
                  <Button 
                    onClick={handleMultiplayer}
                    variant="default"
                    className="h-28 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-pink-600 to-rose-700 hover:opacity-90 hover:scale-105 transition-all border-0 quiz-button"
                  >
                    <Users className="h-6 w-6" />
                    <span>Multijoueur</span>
                  </Button>
                  
                  <Button 
                    onClick={() => navigate('/leaderboard')}
                    variant="secondary"
                    className="h-28 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-600 to-yellow-700 hover:opacity-90 hover:scale-105 transition-all border-0 text-white quiz-button"
                  >
                    <Trophy className="h-6 w-6" />
                    <span>Classement</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={item}>
            <Card className="glass-card border-amber-400/20 h-full">
              <CardHeader className="pb-2 border-b border-white/10">
                <CardTitle className="text-xl text-white flex items-center">
                  <Award className="h-5 w-5 mr-2 text-yellow-400" />
                  Meilleurs scores
                </CardTitle>
                <CardDescription className="text-white/70">
                  Les champions du moment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {isLoadingLeaderboard ? (
                  <div className="text-center text-white/70 py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Trophy className="h-10 w-10 mx-auto mb-3 text-amber-400" />
                    </motion.div>
                    <p>Chargement des scores...</p>
                  </div>
                ) : isLeaderboardError ? (
                  <div className="text-center text-red-400 py-8">
                    Erreur de chargement des scores
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center text-white/70 py-8 border border-dashed border-white/20 rounded-lg">
                    <Trophy className="h-12 w-12 mx-auto mb-3 text-yellow-400 opacity-50" />
                    <p className="mb-2">
                      Aucun score pour le moment.
                    </p>
                    <p className="text-sm">
                      Jouez à un quiz pour apparaître ici !
                    </p>
                  </div>
                ) : (
                  leaderboard.map((score, index) => (
                    <ScoreCard 
                      key={score.id} 
                      score={score} 
                      position={index + 1}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card border-indigo-400/20 overflow-hidden mb-8">
            <CardHeader className="pb-2 border-b border-white/10">
              <CardTitle className="text-xl text-white flex items-center">
                <Brain className="h-5 w-5 mr-2 text-indigo-400" />
                Mes Quiz
              </CardTitle>
              <CardDescription className="text-white/70">
                Retrouvez tous vos quiz créés
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoadingQuizzes ? (
                  <div className="col-span-full text-center text-white/70 py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Edit className="h-10 w-10 mx-auto mb-3 text-purple-400" />
                    </motion.div>
                    <p>Chargement des quiz...</p>
                  </div>
                ) : isQuizzesError ? (
                  <div className="col-span-full text-center text-red-400 py-8">
                    Erreur de chargement des quiz
                  </div>
                ) : quizzes.length === 0 ? (
                  <div className="col-span-full text-center py-12 border border-dashed border-white/20 rounded-lg">
                    <PartyPopper className="h-12 w-12 mx-auto mb-4 text-pink-400 opacity-70" />
                    <p className="text-white/80 mb-4">
                      Vous n'avez pas encore créé de quiz.
                    </p>
                    <Button 
                      onClick={handleCreateQuiz}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 border-0"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Créer mon premier quiz
                    </Button>
                  </div>
                ) : (
                  quizzes.map(quiz => (
                    <QuizCard 
                      key={quiz.id} 
                      quiz={quiz} 
                      onDeleteQuiz={handleDeleteQuiz}
                      onShareQuiz={handleShareQuiz}
                      className="glass-card"
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-blue-400/20 overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/10">
              <CardTitle className="text-xl text-white flex items-center">
                <Zap className="h-5 w-5 mr-2 text-blue-400" />
                Scanner un QR Code
              </CardTitle>
              <CardDescription className="text-white/70">
                Rejoignez un quiz en scannant son code QR
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <QrCode className="h-16 w-16 mx-auto mb-4 text-blue-400" />
                <p className="text-white/80 mb-6 max-w-md mx-auto">
                  Pour répondre à un quiz, scannez un code QR généré par un créateur de quiz.
                </p>
                <Button 
                  onClick={handleScanQR}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 border-0"
                >
                  <Scan className="h-5 w-5" />
                  <span>Scanner un QR Code</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
