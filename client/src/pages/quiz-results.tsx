import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Share, Home } from "lucide-react";
import QuestionReview from "@/components/question-review";
import { Quiz, AnswerResponse, insertScoreSchema } from "@shared/schema";

export default function QuizResults() {
  const { id, score: scoreParam } = useParams<{ id: string, score: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  const [username, setUsername] = useState("");
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [answers, setAnswers] = useState<AnswerResponse[]>([]);
  const [position, setPosition] = useState<number | null>(null);
  
  // Parse score from URL
  const score = parseInt(scoreParam);
  
  // Fetch quiz data
  const { 
    data: quiz, 
    isLoading, 
    isError 
  } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${id}`],
  });
  
  // Create score submission mutation
  const submitScoreMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/scores', data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Score enregistré !",
        description: "Votre score a été enregistré dans le classement.",
      });
      setScoreSubmitted(true);
      setPosition(2); // Simulated position, in a real app we'd get this from the API
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer votre score.",
        variant: "destructive",
      });
    }
  });
  
  useEffect(() => {
    // If we have a quiz, initialize the answers for display purposes
    if (quiz) {
      // This would normally come from the previous screen's state
      // For now, we'll simulate random answers based on the score
      const correctCount = score;
      const simulatedAnswers = quiz.questions.map((question, index) => {
        const isCorrect = index < correctCount;
        const correctAnswer = question.answers.find(a => a.isCorrect);
        const incorrectAnswer = question.answers.find(a => !a.isCorrect);
        
        return {
          questionId: question.id,
          answerId: isCorrect ? correctAnswer?.id || 0 : incorrectAnswer?.id || 0,
          isCorrect
        };
      });
      
      setAnswers(simulatedAnswers);
    }
  }, [quiz, score]);
  
  const handleSubmitScore = () => {
    if (!username.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez entrer votre nom pour enregistrer votre score.",
        variant: "destructive",
      });
      return;
    }
    
    if (!quiz) return;
    
    const scoreData = {
      quizId: parseInt(id),
      username: username.trim(),
      score,
      totalQuestions: quiz.questions.length
    };
    
    submitScoreMutation.mutate(scoreData);
  };
  
  const handleShareResults = () => {
    if (!quiz) return;
    
    // Calculate percentage
    const percentage = Math.round((score / quiz.questions.length) * 100);
    
    // Create share text
    const shareText = `J'ai obtenu ${score}/${quiz.questions.length} (${percentage}%) au quiz "${quiz.title}" sur QRQuiz !`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Mes résultats QRQuiz',
        text: shareText,
      }).catch(error => console.log('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(shareText).then(() => {
        toast({
          title: "Copié !",
          description: "Le résultat a été copié dans le presse-papier.",
        });
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-neutral-600">Chargement des résultats...</p>
        </div>
      </div>
    );
  }
  
  if (isError || !quiz) {
    return (
      <div className="screen p-6">
        <div className="text-center py-10">
          <div className="text-red-500 text-2xl mb-2">
            <i className="ri-error-warning-line"></i>
          </div>
          <h1 className="text-xl font-bold mb-2">Résultats non disponibles</h1>
          <p className="text-neutral-600 mb-6">
            Les résultats que vous recherchez ne sont pas disponibles.
          </p>
          <Button onClick={() => navigate('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }
  
  // Calculate percentage score
  const percentage = Math.round((score / quiz.questions.length) * 100);
  
  return (
    <div className="screen p-6 bg-neutral-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Résultats du quiz</h1>
        <p className="text-neutral-600 mt-1">{quiz.title}</p>
      </div>
      
      {/* Score summary */}
      <Card className="bg-white rounded-xl shadow-sm p-6 text-center mb-8">
        {/* Circular progress indicator */}
        <div className="inline-flex items-center justify-center relative mb-4">
          <svg className="w-32 h-32" viewBox="0 0 36 36">
            <path className="stroke-neutral-200" strokeWidth="3.8" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            <path 
              className="stroke-primary-500" 
              strokeWidth="3.8" 
              fill="none" 
              strokeLinecap="round" 
              strokeDasharray={`${percentage}, 100`} 
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <text x="18" y="20.5" className="text-3xl font-semibold" textAnchor="middle" fill="#1F2937">{percentage}%</text>
          </svg>
        </div>
        
        <h2 className="text-xl font-medium text-neutral-800 mb-1">
          {percentage >= 80 ? 'Excellent travail!' : 
           percentage >= 60 ? 'Bien joué!' : 
           percentage >= 40 ? 'Pas mal!' : 'Continuez vos efforts!'}
        </h2>
        <p className="text-neutral-600 mb-4">
          Vous avez répondu correctement à {score} questions sur {quiz.questions.length}
        </p>
        
        {!scoreSubmitted ? (
          <div className="mb-4">
            <p className="text-sm text-neutral-600 mb-2">Entrez votre nom pour enregistrer votre score</p>
            <div className="flex max-w-xs mx-auto">
              <input
                type="text"
                placeholder="Votre nom"
                className="flex-1 px-3 py-2 border border-neutral-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Button 
                onClick={handleSubmitScore}
                className="bg-primary-500 hover:bg-primary-600 text-white rounded-r-lg"
                disabled={submitScoreMutation.isPending}
              >
                {submitScoreMutation.isPending ? 'Envoi...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-primary-50 rounded-lg p-3">
              <p className="text-primary-600 font-medium text-sm">Score</p>
              <p className="text-neutral-800 font-semibold">{percentage}%</p>
            </div>
            <div className="bg-primary-50 rounded-lg p-3">
              <p className="text-primary-600 font-medium text-sm">Position</p>
              <p className="text-neutral-800 font-semibold">#{position || '?'}</p>
            </div>
          </div>
        )}
      </Card>
      
      {/* Question review */}
      <h2 className="text-xl font-bold text-neutral-800 mb-4">Vos réponses</h2>
      
      <div className="space-y-4 mb-8">
        {quiz.questions.map((question, index) => (
          <QuestionReview 
            key={question.id} 
            question={question} 
            userAnswer={answers[index]} 
          />
        ))}
      </div>
      
      <div className="flex space-x-3">
        <Button
          variant="outline"
          className="flex-1 py-3 px-4 bg-white border border-neutral-300 rounded-lg font-medium text-neutral-600 shadow-sm hover:bg-neutral-50 transition flex items-center justify-center"
          onClick={handleShareResults}
        >
          <Share className="h-4 w-4 mr-1.5" /> Partager
        </Button>
        <Button
          className="flex-1 py-3 px-4 bg-primary-500 text-white rounded-lg font-medium shadow-sm hover:bg-primary-600 transition flex items-center justify-center"
          onClick={() => navigate('/')}
        >
          <Home className="h-4 w-4 mr-1.5" /> Accueil
        </Button>
      </div>
    </div>
  );
}
