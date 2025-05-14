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
  isCorrect: z.boolean()
});

export type AnswerResponse = z.infer<typeof answerResponseSchema>;

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
