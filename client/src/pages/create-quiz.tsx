import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import QuizForm from "@/components/quiz-form";
import { insertQuizSchema, Question } from "@shared/schema";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CreateQuiz() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  const createQuizMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertQuizSchema>) => {
      const response = await apiRequest('POST', '/api/quizzes', data);
      return await response.json();
    },
    onSuccess: (quiz) => {
      toast({
        title: "Quiz créé !",
        description: "Votre quiz a été créé avec succès.",
      });
      navigate(`/qr-code/${quiz.id}`);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le quiz. Veuillez réessayer.",
        variant: "destructive",
      });
      console.error("Error creating quiz:", error);
    }
  });
  
  const handleSubmit = (data: z.infer<typeof insertQuizSchema>) => {
    createQuizMutation.mutate(data);
  };
  
  return (
    <div className="screen p-6 bg-neutral-50">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="p-2 -ml-2 text-neutral-600" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-neutral-800 ml-2">Créer un quiz</h1>
      </div>
      
      <QuizForm onSubmit={handleSubmit} />
    </div>
  );
}
