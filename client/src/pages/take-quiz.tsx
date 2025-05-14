import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import AnswerOption from "@/components/answer-option";
import { Quiz, AnswerResponse } from "@shared/schema";

export default function TakeQuiz() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<AnswerResponse[]>([]);
  const [startTime, setStartTime] = useState<Date>(new Date());
  
  // Fetch quiz data
  const { 
    data: quiz, 
    isLoading, 
    isError 
  } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${id}`],
  });
  
  // Set start time when quiz loads
  useEffect(() => {
    if (quiz) {
      setStartTime(new Date());
      
      // Initialize selected answers array with empty values
      const initialAnswers = quiz.questions.map(question => ({
        questionId: question.id,
        answerId: -1,
        isCorrect: false
      }));
      
      setSelectedAnswers(initialAnswers);
    }
  }, [quiz]);
  
  if (isLoading) {
    return (
      <div className="screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-neutral-600">Chargement du quiz...</p>
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
          <h1 className="text-xl font-bold mb-2">Quiz non trouvé</h1>
          <p className="text-neutral-600 mb-6">
            Le quiz que vous recherchez n'existe pas ou n'est plus disponible.
          </p>
          <Button onClick={() => navigate('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }
  
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  
  const handleSelectAnswer = (answerId: number) => {
    const updatedAnswers = [...selectedAnswers];
    const currentAnswer = updatedAnswers[currentQuestionIndex];
    
    // Find if the selected answer is correct
    const isCorrect = currentQuestion.answers.find(a => a.id === answerId)?.isCorrect || false;
    
    updatedAnswers[currentQuestionIndex] = {
      ...currentAnswer,
      answerId,
      isCorrect
    };
    
    setSelectedAnswers(updatedAnswers);
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // End of quiz, calculate the score
      const correctAnswers = selectedAnswers.filter(answer => answer.isCorrect);
      const score = correctAnswers.length;
      
      // Calculate time elapsed
      const endTime = new Date();
      const timeElapsed = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      // Navigate to results page
      navigate(`/quiz-results/${quiz.id}/${score}`);
    }
  };
  
  const isAnswerSelected = selectedAnswers[currentQuestionIndex]?.answerId !== -1;
  
  return (
    <div className="screen p-6 bg-neutral-50">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            className="p-2 -ml-2 text-neutral-600" 
            onClick={() => {
              if (confirm("Êtes-vous sûr de vouloir quitter ce quiz ? Votre progression sera perdue.")) {
                navigate('/');
              }
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-neutral-800 ml-2">{quiz.title}</h1>
        </div>
        <div className="text-sm font-medium text-primary-500">
          {currentQuestionIndex + 1}/{quiz.questions.length}
        </div>
      </div>
      
      {/* Progress bar */}
      <Progress value={progress} className="w-full bg-neutral-200 rounded-full h-1.5 mb-6" />
      
      {/* Question Card */}
      <Card className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-medium text-neutral-800 mb-4">
          {currentQuestion.text}
        </h2>
        
        {/* Answer Options */}
        <div className="space-y-3">
          {currentQuestion.answers.map(answer => (
            <AnswerOption
              key={answer.id}
              id={answer.id}
              text={answer.text}
              selected={selectedAnswers[currentQuestionIndex]?.answerId === answer.id}
              onSelect={handleSelectAnswer}
            />
          ))}
        </div>
      </Card>
      
      <div className="flex space-x-3">
        <Button
          variant="outline"
          className="flex-1 py-3 px-4 bg-white border border-neutral-300 rounded-lg font-medium text-neutral-600 shadow-sm hover:bg-neutral-50 transition flex items-center justify-center"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Précédent
        </Button>
        <Button
          className="flex-1 py-3 px-4 bg-primary-500 text-white rounded-lg font-medium shadow-sm hover:bg-primary-600 transition flex items-center justify-center"
          onClick={handleNext}
          disabled={!isAnswerSelected}
        >
          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <>Suivant <ArrowRight className="h-4 w-4 ml-1" /></>
          ) : (
            'Terminer'
          )}
        </Button>
      </div>
    </div>
  );
}
