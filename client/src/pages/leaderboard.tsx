import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScoreCard from "@/components/score-card";
import { Score, Quiz } from "@shared/schema";
import { Home } from "lucide-react";

export default function Leaderboard() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  
  // Fetch all quizzes
  const { 
    data: quizzes = [], 
    isLoading: isLoadingQuizzes 
  } = useQuery<Quiz[]>({
    queryKey: ['/api/quizzes'],
  });
  
  // Fetch global leaderboard
  const { 
    data: globalLeaderboard = [], 
    isLoading: isLoadingGlobalLeaderboard 
  } = useQuery<Score[]>({
    queryKey: ['/api/leaderboard'],
  });
  
  // Fetch quiz-specific leaderboard when a quiz is selected
  const { 
    data: quizLeaderboard = [], 
    isLoading: isLoadingQuizLeaderboard 
  } = useQuery<Score[]>({
    queryKey: [selectedQuizId ? `/api/quizzes/${selectedQuizId}/leaderboard` : null],
    enabled: !!selectedQuizId,
  });
  
  // Determine which leaderboard to display
  const leaderboard = selectedQuizId ? quizLeaderboard : globalLeaderboard;
  const isLoadingLeaderboard = selectedQuizId ? isLoadingQuizLeaderboard : isLoadingGlobalLeaderboard;
  
  // Display top 3 and the rest separately
  const topThree = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);
  
  // Get quiz title by id
  const getQuizTitle = (quizId: number) => {
    const quiz = quizzes.find(q => q.id === quizId);
    return quiz ? quiz.title : `Quiz #${quizId}`;
  };
  
  return (
    <div className="screen p-6 bg-neutral-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Classement</h1>
        <p className="text-neutral-600 mt-1">Meilleurs scores de tous les quiz</p>
      </div>
      
      {/* Quiz filter tabs */}
      <div className="mb-6">
        <Tabs defaultValue="all" onValueChange={(value) => setSelectedQuizId(value === "all" ? null : value)}>
          <TabsList className="flex border-b border-neutral-200 bg-transparent w-full overflow-x-auto">
            <TabsTrigger 
              value="all" 
              className="px-6 py-3 font-medium data-[state=active]:text-primary-500 data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=inactive]:text-neutral-500 rounded-none"
            >
              Tous
            </TabsTrigger>
            
            {quizzes.map(quiz => (
              <TabsTrigger 
                key={quiz.id} 
                value={quiz.id.toString()}
                className="px-6 py-3 font-medium data-[state=active]:text-primary-500 data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=inactive]:text-neutral-500 rounded-none whitespace-nowrap"
              >
                {quiz.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      
      {isLoadingLeaderboard || isLoadingQuizzes ? (
        <div className="py-8 text-center text-neutral-500">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Chargement du classement...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="py-8 text-center text-neutral-500">
          <p className="mb-4">Aucun score enregistré pour le moment</p>
        </div>
      ) : (
        <>
          {/* Top Three */}
          {topThree.length > 0 && (
            <div className="flex justify-between items-end mb-8">
              {/* Make sure we have 3 positions, even if we don't have 3 scores */}
              {[0, 1, 2].map(index => {
                const position = index + 1;
                const score = topThree[index];
                
                if (!score && position !== 2) {
                  // Empty placeholder for positions 1 and 3
                  return (
                    <div key={`empty-${position}`} className="flex-1"></div>
                  );
                }
                
                if (!score && position === 2) {
                  // Special case for position 2 which should be the middle one (for aesthetics)
                  return (
                    <div key="empty-2" className="flex-1"></div>
                  );
                }
                
                const sizeClass = position === 1 ? "w-20 h-20" : "w-16 h-16";
                const borderColorClass = 
                  position === 1 ? "border-primary-500" : 
                  position === 2 ? "border-secondary-500" : "border-accent-500";
                const textColorClass = 
                  position === 1 ? "text-primary-500" : 
                  position === 2 ? "text-secondary-500" : "text-accent-500";
                
                const percentage = Math.round((score.score / score.totalQuestions) * 100);
                
                return (
                  <div key={score.id} className="flex flex-col items-center">
                    <div className={`${sizeClass} rounded-full bg-neutral-100 flex items-center justify-center mb-2 border-2 ${borderColorClass}`}>
                      <span className={`text-xl font-bold ${textColorClass}`}>{position}</span>
                    </div>
                    <p className="font-medium text-neutral-800">{score.username}</p>
                    <p className={`text-sm font-medium ${textColorClass}`}>{percentage}%</p>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Leaderboard Table */}
          <Card className="bg-white rounded-xl shadow-sm overflow-hidden border border-neutral-200 mb-6">
            <div className="p-4 bg-neutral-50 font-medium text-neutral-600 border-b border-neutral-200 flex">
              <span className="w-10 text-center">#</span>
              <span className="flex-1">Utilisateur</span>
              <span className="w-20 text-center">Quiz</span>
              <span className="w-16 text-right">Score</span>
            </div>
            
            <div className="divide-y divide-neutral-100">
              {restOfLeaderboard.map((score, index) => {
                const position = topThree.length + index + 1;
                const percentage = Math.round((score.score / score.totalQuestions) * 100);
                
                return (
                  <div key={score.id} className="p-4 flex items-center">
                    <span className="w-10 text-center font-medium text-neutral-500">{position}</span>
                    <span className="flex-1 font-medium text-neutral-800">{score.username}</span>
                    <span className="w-20 text-center text-xs bg-neutral-100 text-neutral-600 rounded-full px-2 py-1 truncate">
                      {getQuizTitle(score.quizId).slice(0, 10)}
                    </span>
                    <span className="w-16 text-right font-medium text-neutral-800">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
      
      <Button
        className="w-full py-3 px-4 bg-primary-500 text-white rounded-lg font-medium shadow-sm hover:bg-primary-600 transition flex items-center justify-center"
        onClick={() => navigate('/')}
      >
        <Home className="h-4 w-4 mr-1.5" /> Retour à l'accueil
      </Button>
    </div>
  );
}
