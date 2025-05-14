import { Card } from "@/components/ui/card";
import { Score, Quiz } from "@shared/schema";

interface ScoreCardProps {
  score: Score;
  quiz?: Quiz;
  position: number;
}

export default function ScoreCard({ score, quiz, position }: ScoreCardProps) {
  // Calculate percentage score
  const percentage = Math.round((score.score / score.totalQuestions) * 100);
  
  return (
    <div className="flex items-center border-b border-neutral-100 p-4">
      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center mr-3 font-medium text-neutral-800">
        {position}
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-neutral-800">{score.username}</h3>
        <p className="text-sm text-neutral-500">
          {quiz ? quiz.title : `Quiz #${score.quizId}`}
        </p>
      </div>
      <div className="bg-primary-50 text-primary-600 font-medium px-3 py-1 rounded-full">
        {percentage}%
      </div>
    </div>
  );
}
