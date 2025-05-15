import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the Answer schema
export const answerSchema = z.object({
  id: z.number(),
  text: z.string(),
  isCorrect: z.boolean()
});

export type Answer = z.infer<typeof answerSchema>;

// Define the Question schema
export const questionSchema = z.object({
  id: z.number(),
  text: z.string(),
  answers: z.array(answerSchema)
});

export type Question = z.infer<typeof questionSchema>;

// Quiz table
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  questions: jsonb("questions").notNull().$type<Question[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Quiz insert schema
export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true
});

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

// Score table
export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  username: text("username").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Score insert schema
export const insertScoreSchema = createInsertSchema(scores).omit({
  id: true,
  createdAt: true
});

export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scores.$inferSelect;

// The current user's quiz responses
export const answerResponseSchema = z.object({
  questionId: z.number(),
  answerId: z.number(),
  isCorrect: z.boolean(),
  responseTime: z.number().optional() // Temps de réponse en millisecondes
});

export type AnswerResponse = z.infer<typeof answerResponseSchema>;

// Session multijoueur
export const gameSessionSchema = z.object({
  id: z.string(),
  hostId: z.string(),
  quizId: z.number(),
  status: z.enum(["waiting", "playing", "finished"]),
  players: z.array(z.object({
    id: z.string(),
    name: z.string(),
    isHost: z.boolean(),
    isReady: z.boolean(),
    currentScore: z.number(),
    answers: z.array(answerResponseSchema).optional()
  })),
  currentQuestionIndex: z.number(),
  questionStartTime: z.number().optional(), // Timestamp de début de la question actuelle
  timePerQuestion: z.number(), // Temps par question en secondes
  createdAt: z.date()
});

export type GameSession = z.infer<typeof gameSessionSchema>;

export const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  isHost: z.boolean(),
  isReady: z.boolean(),
  currentScore: z.number(),
  answers: z.array(answerResponseSchema).optional()
});

export type Player = z.infer<typeof playerSchema>;

// Mock quiz for type references
export const mockQuizType = {
  id: 1,
  title: "Test Quiz",
  description: "A test quiz",
  questions: [
    {
      id: 1,
      text: "Test question",
      answers: [
        { id: 1, text: "Answer 1", isCorrect: true },
        { id: 2, text: "Answer 2", isCorrect: false }
      ]
    }
  ],
  createdAt: new Date()
};

export type MockQuizType = typeof mockQuizType;

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
