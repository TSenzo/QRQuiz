import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import QuizCard from "@/components/quiz-card";
import ScoreCard from "@/components/score-card";
import { Quiz, Score } from "@shared/schema";
import { ArrowRight } from "lucide-react";

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
  
  // Get only the most recent 2 quizzes
  const recentQuizzes = quizzes.slice(0, 2);
  
  return (
    <div className="screen p-6 bg-neutral-50">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-neutral-800 font-accent">QRQuiz</h1>
        <p className="text-neutral-600 mt-1">Créez, partagez et répondez aux quiz via QR codes</p>
      </div>
      
      {/* Quick Actions */}
      <div className="flex gap-4 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <button 
          onClick={handleScanQR}
          className="flex-1 bg-primary-500 text-white rounded-xl p-4 flex flex-col items-center justify-center shadow-md hover:bg-primary-600 transition-all"
        >
          <i className="ri-qr-scan-2-line text-3xl mb-2"></i>
          <span className="font-medium">Scanner</span>
        </button>
        <button 
          onClick={handleCreateQuiz}
          className="flex-1 bg-secondary-500 text-white rounded-xl p-4 flex flex-col items-center justify-center shadow-md hover:bg-secondary-600 transition-all"
        >
          <i className="ri-add-line text-3xl mb-2"></i>
          <span className="font-medium">Créer</span>
        </button>
      </div>

      {/* Recent Quizzes */}
      <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-neutral-800">Quiz récents</h2>
          <Link href="/create-quiz" className="text-primary-500 font-medium text-sm">
            Voir tout
          </Link>
        </div>
        
        <div className="space-y-4">
          {isLoadingQuizzes ? (
            <div className="py-8 text-center text-neutral-500">Chargement des quiz...</div>
          ) : isQuizzesError ? (
            <div className="py-8 text-center text-red-500">Erreur de chargement des quiz</div>
          ) : recentQuizzes.length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              <p className="mb-4">Vous n'avez pas encore créé de quiz</p>
              <Link href="/create-quiz">
                <Button className="bg-primary-500 text-white hover:bg-primary-600">
                  Créer mon premier quiz
                </Button>
              </Link>
            </div>
          ) : (
            recentQuizzes.map(quiz => (
              <QuizCard 
                key={quiz.id} 
                quiz={quiz} 
                onDeleteQuiz={handleDeleteQuiz}
                onShareQuiz={handleShareQuiz}
              />
            ))
          )}
        </div>
      </div>
      
      {/* Top Scores */}
      <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-neutral-800">Meilleurs scores</h2>
          <Link href="/leaderboard" className="text-primary-500 font-medium text-sm">
            Voir classement
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-neutral-200">
          {isLoadingLeaderboard ? (
            <div className="py-8 text-center text-neutral-500">Chargement du classement...</div>
          ) : isLeaderboardError ? (
            <div className="py-8 text-center text-red-500">Erreur de chargement du classement</div>
          ) : leaderboard.length === 0 ? (
            <div className="py-8 text-center text-neutral-500">Aucun score enregistré</div>
          ) : (
            leaderboard.map((score, index) => (
              <ScoreCard 
                key={score.id} 
                score={score} 
                position={index + 1} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
