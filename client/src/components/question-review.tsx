import { Card } from "@/components/ui/card";
import { AnswerResponse, Question } from "@shared/schema";
import { CheckCircle, XCircle } from "lucide-react";

interface QuestionReviewProps {
  question: Question;
  userAnswer: AnswerResponse;
}

export default function QuestionReview({ question, userAnswer }: QuestionReviewProps) {
  // Find the correct answer
  const correctAnswer = question.answers.find(answer => answer.isCorrect);
  
  // Find the user's selected answer
  const selectedAnswer = question.answers.find(answer => answer.id === userAnswer.answerId);
  
  return (
    <Card className="bg-white rounded-xl shadow-sm p-4 border border-neutral-200">
      <div className="flex items-start">
        <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center mr-3 flex-shrink-0 ${userAnswer.isCorrect ? 'bg-accent-500' : 'bg-red-500'}`}>
          {userAnswer.isCorrect ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
        </div>
        <div>
          <h3 className="font-medium text-neutral-800">{question.text}</h3>
          {correctAnswer && (
            <p className="text-sm text-accent-500 font-medium mt-1">
              Correct: {correctAnswer.text}
            </p>
          )}
          {selectedAnswer && !userAnswer.isCorrect && (
            <p className="text-sm text-red-500 mt-0.5">
              Votre réponse: {selectedAnswer.text}
            </p>
          )}
          {selectedAnswer && userAnswer.isCorrect && (
            <p className="text-sm text-neutral-500 mt-0.5">
              Votre réponse: {selectedAnswer.text}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
