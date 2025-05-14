import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { insertQuizSchema, Question } from "@shared/schema";

const formSchema = insertQuizSchema.extend({
  questions: z.array(
    z.object({
      id: z.number(),
      text: z.string().min(1, "La question est requise"),
      answers: z.array(
        z.object({
          id: z.number(),
          text: z.string().min(1, "La réponse est requise"),
          isCorrect: z.boolean()
        })
      ).min(2, "Au moins 2 réponses sont requises")
    })
  ).min(1, "Au moins une question est requise")
});

interface QuizFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
}

export default function QuizForm({ onSubmit }: QuizFormProps) {
  const [nextQuestionId, setNextQuestionId] = useState(1);
  const [nextAnswerId, setNextAnswerId] = useState(1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      questions: [
        {
          id: 0,
          text: "",
          answers: [
            { id: 0, text: "", isCorrect: true },
            { id: -1, text: "", isCorrect: false },
          ]
        }
      ]
    },
  });

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = 
    useFieldArray({ control: form.control, name: "questions" });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit(data);
  };

  const addQuestion = () => {
    appendQuestion({
      id: nextQuestionId,
      text: "",
      answers: [
        { id: nextAnswerId, text: "", isCorrect: true },
        { id: nextAnswerId + 1, text: "", isCorrect: false },
      ]
    });
    setNextQuestionId(prev => prev + 1);
    setNextAnswerId(prev => prev + 2);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre du quiz</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Culture Générale" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optionnel)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Décrivez le contenu de votre quiz..." 
                  rows={3} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <div className="flex justify-between items-center mb-1">
            <FormLabel>Questions</FormLabel>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="text-primary font-medium"
              onClick={addQuestion}
            >
              <Plus className="w-4 h-4 mr-1" /> Ajouter
            </Button>
          </div>

          {questionFields.map((questionField, questionIndex) => (
            <div key={questionField.id} className="bg-white rounded-xl shadow-sm p-4 border border-neutral-200 mb-4">
              <div className="flex justify-between items-start mb-3">
                <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  Question {questionIndex + 1}
                </span>
                <div className="flex">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <GripVertical className="h-4 w-4 text-neutral-400" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 text-neutral-400 hover:text-red-500" 
                    onClick={() => removeQuestion(questionIndex)}
                    disabled={questionFields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <FormField
                control={form.control}
                name={`questions.${questionIndex}.text`}
                render={({ field }) => (
                  <FormItem className="mb-3">
                    <FormControl>
                      <Input placeholder="Votre question..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <AnswersFieldArray 
                nestIndex={questionIndex} 
                control={form.control} 
                nextAnswerId={nextAnswerId}
                setNextAnswerId={setNextAnswerId}
              />
            </div>
          ))}

          {/* Add another question placeholder */}
          <Button 
            type="button" 
            variant="outline" 
            className="w-full flex items-center justify-center px-4 py-4 border border-dashed border-neutral-300 rounded-xl text-neutral-500 hover:text-primary-500 hover:border-primary-300"
            onClick={addQuestion}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Ajouter une nouvelle question
          </Button>
        </div>

        <div className="pt-4">
          <Button 
            type="submit" 
            className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 px-4 rounded-lg font-medium shadow-sm flex items-center justify-center"
          >
            <i className="ri-qr-code-line mr-2"></i> Générer le QR code du quiz
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface AnswersFieldArrayProps {
  nestIndex: number;
  control: any;
  nextAnswerId: number;
  setNextAnswerId: React.Dispatch<React.SetStateAction<number>>;
}

function AnswersFieldArray({ nestIndex, control, nextAnswerId, setNextAnswerId }: AnswersFieldArrayProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${nestIndex}.answers`
  });

  const addAnswer = () => {
    append({ 
      id: nextAnswerId, 
      text: "", 
      isCorrect: false 
    });
    setNextAnswerId(prev => prev + 1);
  };

  return (
    <div className="space-y-2 mb-3">
      <Controller
        control={control}
        name={`questions.${nestIndex}.answers`}
        render={({ field }) => (
          <RadioGroup 
            defaultValue={field.value.findIndex(a => a.isCorrect).toString()} 
            onValueChange={(value) => {
              const updatedAnswers = [...field.value];
              updatedAnswers.forEach((answer, idx) => {
                answer.isCorrect = idx.toString() === value;
              });
              field.onChange(updatedAnswers);
            }}
            className="space-y-2"
          >
            {fields.map((answerField, answerIndex) => (
              <div key={answerField.id} className="flex items-center">
                <RadioGroupItem 
                  id={`answer_${nestIndex}_${answerIndex}`} 
                  value={answerIndex.toString()} 
                  className="mr-3 h-4 w-4 text-primary-500"
                />
                <FormField
                  control={control}
                  name={`questions.${nestIndex}.answers.${answerIndex}.text`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <div className="flex">
                          <Input 
                            placeholder={`Réponse ${answerIndex + 1}`} 
                            {...field} 
                            className="flex-1"
                          />
                          {fields.length > 2 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon"
                              className="ml-2 text-neutral-400 hover:text-red-500" 
                              onClick={() => remove(answerIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </RadioGroup>
        )}
      />

      {fields.length < 6 && (
        <Button 
          type="button" 
          variant="outline"
          className="w-full flex items-center justify-center px-4 py-2 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 transition text-sm font-medium"
          onClick={addAnswer}
        >
          <Plus className="w-4 h-4 mr-1.5" /> Ajouter une réponse
        </Button>
      )}
    </div>
  );
}
