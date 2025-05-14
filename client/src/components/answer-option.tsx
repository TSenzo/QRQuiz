import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AnswerOptionProps {
  id: number;
  text: string;
  selected: boolean;
  disabled?: boolean;
  correct?: boolean | null;
  onSelect: (id: number) => void;
}

export default function AnswerOption({ 
  id, 
  text, 
  selected, 
  disabled = false, 
  correct = null,
  onSelect 
}: AnswerOptionProps) {
  const handleClick = () => {
    if (!disabled) {
      onSelect(id);
    }
  };
  
  // Determine the styling based on state
  const getColorClasses = () => {
    if (disabled && correct !== null) {
      // Results view
      if (correct) {
        return 'border-accent-500 bg-accent-50 text-accent-700';
      } else if (selected) {
        return 'border-red-500 bg-red-50 text-red-700';
      }
    }
    
    if (selected) {
      return 'border-primary-300 bg-primary-50';
    }
    
    return 'border-neutral-200 hover:border-primary-300 hover:bg-primary-50';
  };
  
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "w-full text-left p-4 border rounded-xl transition focus:outline-none focus:ring-2 focus:ring-primary-300",
        getColorClasses(),
        disabled && !selected && !correct && "opacity-70"
      )}
    >
      <div className="flex items-center">
        <div 
          className={cn(
            "w-5 h-5 rounded-full border-2 mr-3 flex-shrink-0 flex items-center justify-center",
            selected ? "border-primary-500" : "border-neutral-300",
            correct === true && "border-accent-500 bg-accent-500 text-white",
            correct === false && selected && "border-red-500 bg-red-500 text-white"
          )}
        >
          {correct === true && <i className="ri-check-line text-xs"></i>}
          {correct === false && selected && <i className="ri-close-line text-xs"></i>}
          {selected && correct === null && <div className="w-2.5 h-2.5 rounded-full bg-primary-500"></div>}
        </div>
        <span>{text}</span>
      </div>
    </button>
  );
}
