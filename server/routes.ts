import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertQuizSchema, insertScoreSchema, playerSchema, gameSessionSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handler for validation errors
  const handleValidationError = (err: unknown) => {
    if (err instanceof ZodError) {
      return { message: "Validation error", errors: err.errors };
    }
    return { message: String(err) };
  };

  // API endpoints for quizzes
  app.get("/api/quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getQuizzes();
      res.json(quizzes);
    } catch (err) {
      res.status(500).json({ message: "Failed to retrieve quizzes" });
    }
  });

  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid quiz ID" });
      }

      const quiz = await storage.getQuiz(id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      res.json(quiz);
    } catch (err) {
      res.status(500).json({ message: "Failed to retrieve quiz" });
    }
  });

  app.post("/api/quizzes", async (req, res) => {
    try {
      const quizData = insertQuizSchema.parse(req.body);
      const quiz = await storage.createQuiz(quizData);
      res.status(201).json(quiz);
    } catch (err) {
      res.status(400).json(handleValidationError(err));
    }
  });

  app.delete("/api/quizzes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid quiz ID" });
      }

      const deleted = await storage.deleteQuiz(id);
      if (!deleted) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete quiz" });
    }
  });

  // API endpoints for scores
  app.get("/api/scores", async (req, res) => {
    try {
      const scores = await storage.getScores();
      res.json(scores);
    } catch (err) {
      res.status(500).json({ message: "Failed to retrieve scores" });
    }
  });

  app.get("/api/scores/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid score ID" });
      }

      const score = await storage.getScore(id);
      if (!score) {
        return res.status(404).json({ message: "Score not found" });
      }

      res.json(score);
    } catch (err) {
      res.status(500).json({ message: "Failed to retrieve score" });
    }
  });

  app.get("/api/quizzes/:quizId/scores", async (req, res) => {
    try {
      const quizId = parseInt(req.params.quizId);
      if (isNaN(quizId)) {
        return res.status(400).json({ message: "Invalid quiz ID" });
      }

      const scores = await storage.getScoresByQuiz(quizId);
      res.json(scores);
    } catch (err) {
      res.status(500).json({ message: "Failed to retrieve scores for quiz" });
    }
  });

  app.post("/api/scores", async (req, res) => {
    try {
      const scoreData = insertScoreSchema.parse(req.body);
      const score = await storage.createScore(scoreData);
      res.status(201).json(score);
    } catch (err) {
      res.status(400).json(handleValidationError(err));
    }
  });

  app.get("/api/leaderboard", async (req, res) => {
    try {
      let limit: number | undefined;
      if (req.query.limit) {
        limit = parseInt(req.query.limit as string);
        if (isNaN(limit)) {
          return res.status(400).json({ message: "Invalid limit parameter" });
        }
      }

      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (err) {
      res.status(500).json({ message: "Failed to retrieve leaderboard" });
    }
  });

  app.get("/api/quizzes/:quizId/leaderboard", async (req, res) => {
    try {
      const quizId = parseInt(req.params.quizId);
      if (isNaN(quizId)) {
        return res.status(400).json({ message: "Invalid quiz ID" });
      }

      let limit: number | undefined;
      if (req.query.limit) {
        limit = parseInt(req.query.limit as string);
        if (isNaN(limit)) {
          return res.status(400).json({ message: "Invalid limit parameter" });
        }
      }

      const leaderboard = await storage.getLeaderboardByQuiz(quizId, limit);
      res.json(leaderboard);
    } catch (err) {
      res.status(500).json({ message: "Failed to retrieve quiz leaderboard" });
    }
  });

  app.delete("/api/scores", async (req, res) => {
    try {
      let quizId: number | undefined;
      if (req.query.quizId) {
        quizId = parseInt(req.query.quizId as string);
        if (isNaN(quizId)) {
          return res.status(400).json({ message: "Invalid quiz ID" });
        }
      }

      await storage.deleteScores(quizId);
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete scores" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
