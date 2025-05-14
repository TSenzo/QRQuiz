import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, MoreVertical } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Quiz } from "@shared/schema";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface QuizCardProps {
  quiz: Quiz;
  onDeleteQuiz?: (id: number) => void;
  onShareQuiz?: (id: number) => void;
}

export default function QuizCard({ quiz, onDeleteQuiz, onShareQuiz }: QuizCardProps) {
  // Extract categories from quiz description (if any)
  const getCategories = () => {
    if (!quiz.description) return [];
    
    // Extract potential categories from the description
    // This is a simple implementation - you might want to add a proper categories field to the schema
    const words = quiz.description.split(/\s+/);
    return words
      .filter(word => word.length > 3)
      .slice(0, 2);
  };
  
  const categories = getCategories();
  
  // Format the date
  const formattedDate = formatDistanceToNow(new Date(quiz.createdAt), { 
    addSuffix: true,
    locale: fr
  });
  
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onShareQuiz) {
      onShareQuiz(quiz.id);
    }
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDeleteQuiz) {
      onDeleteQuiz(quiz.id);
    }
  };
  
  return (
    <Link href={`/qr-code/${quiz.id}`}>
      <Card className="bg-white rounded-xl shadow-sm p-4 border border-neutral-200 hover:border-primary-200 transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-neutral-800">{quiz.title}</h3>
            <p className="text-sm text-neutral-500">
              {quiz.questions.length} question{quiz.questions.length > 1 ? 's' : ''} • Créé {formattedDate}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={handleShare} className="text-neutral-400 hover:text-primary-500">
              <Share2 className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-primary-500">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/qr-code/${quiz.id}`}>
                    Voir le QR code
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/take-quiz/${quiz.id}`}>
                    Répondre au quiz
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-500" onClick={handleDelete}>
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {categories.length > 0 && (
          <div className="flex mt-3 space-x-2">
            {categories.map((category, index) => (
              <Badge key={index} variant="outline" className="bg-neutral-100 text-neutral-600 hover:bg-neutral-200">
                {category}
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </Link>
  );
}
