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
  
  // Map pour stocker les connexions WebSocket par sessionId
  const sessionConnections = new Map<string, Set<any>>();

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

  // API endpoints pour le multijoueur
  app.post("/api/sessions", async (req, res) => {
    try {
      const { quizId, hostId, hostName, timePerQuestion } = req.body;
      
      if (!quizId || !hostId || !hostName) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      const parsedQuizId = parseInt(quizId);
      if (isNaN(parsedQuizId)) {
        return res.status(400).json({ message: "Invalid quiz ID" });
      }
      
      const session = await storage.createGameSession(
        parsedQuizId, 
        hostId, 
        hostName, 
        timePerQuestion
      );
      
      res.status(201).json(session);
    } catch (err) {
      console.error("Error creating session:", err);
      res.status(500).json({ message: String(err) });
    }
  });
  
  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const sessionId = req.params.id;
      const session = await storage.getGameSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(session);
    } catch (err) {
      res.status(500).json({ message: "Failed to retrieve session" });
    }
  });
  
  app.post("/api/sessions/:id/join", async (req, res) => {
    try {
      const sessionId = req.params.id;
      const playerData = playerSchema.parse({
        ...req.body,
        isHost: false,
        isReady: false,
        currentScore: 0,
        answers: []
      });
      
      const session = await storage.addPlayerToSession(sessionId, playerData);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Notifier les autres joueurs via WebSocket
      if (sessionConnections.has(sessionId)) {
        const connections = sessionConnections.get(sessionId)!;
        for (const conn of connections) {
          if (conn.readyState === 1) { // OPEN
            conn.send(JSON.stringify({ 
              type: "player_joined", 
              session,
              player: playerData
            }));
          }
        }
      }
      
      res.json(session);
    } catch (err) {
      console.error("Error joining session:", err);
      if (err instanceof ZodError) {
        return res.status(400).json(handleValidationError(err));
      }
      res.status(500).json({ message: String(err) });
    }
  });
  
  app.delete("/api/sessions/:id/players/:playerId", async (req, res) => {
    try {
      const { id: sessionId, playerId } = req.params;
      
      const session = await storage.removePlayerFromSession(sessionId, playerId);
      
      if (!session) {
        // Si la session est supprimée (l'hôte est parti), on renvoie un 204
        return res.status(204).end();
      }
      
      // Notifier les autres joueurs via WebSocket
      if (sessionConnections.has(sessionId)) {
        const connections = sessionConnections.get(sessionId)!;
        for (const conn of connections) {
          if (conn.readyState === 1) { // OPEN
            conn.send(JSON.stringify({ 
              type: "player_left", 
              session,
              playerId
            }));
          }
        }
      }
      
      res.json(session);
    } catch (err) {
      console.error("Error removing player:", err);
      res.status(500).json({ message: String(err) });
    }
  });
  
  app.patch("/api/sessions/:id/players/:playerId/ready", async (req, res) => {
    try {
      const { id: sessionId, playerId } = req.params;
      const { isReady } = req.body;
      
      if (typeof isReady !== 'boolean') {
        return res.status(400).json({ message: "isReady must be a boolean" });
      }
      
      const session = await storage.setPlayerReady(sessionId, playerId, isReady);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Notifier les autres joueurs via WebSocket
      if (sessionConnections.has(sessionId)) {
        const connections = sessionConnections.get(sessionId)!;
        for (const conn of connections) {
          if (conn.readyState === 1) { // OPEN
            conn.send(JSON.stringify({ 
              type: "player_ready", 
              session,
              playerId,
              isReady
            }));
          }
        }
      }
      
      res.json(session);
    } catch (err) {
      console.error("Error setting player ready:", err);
      res.status(500).json({ message: String(err) });
    }
  });
  
  app.post("/api/sessions/:id/start", async (req, res) => {
    try {
      const sessionId = req.params.id;
      
      const session = await storage.startGameSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Notifier tous les joueurs via WebSocket
      if (sessionConnections.has(sessionId)) {
        const connections = sessionConnections.get(sessionId)!;
        for (const conn of connections) {
          if (conn.readyState === 1) { // OPEN
            conn.send(JSON.stringify({ 
              type: "game_started", 
              session
            }));
          }
        }
      }
      
      res.json(session);
    } catch (err) {
      console.error("Error starting session:", err);
      res.status(500).json({ message: String(err) });
    }
  });
  
  app.post("/api/sessions/:id/next-question", async (req, res) => {
    try {
      const sessionId = req.params.id;
      
      const session = await storage.nextQuestion(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Notifier tous les joueurs via WebSocket
      if (sessionConnections.has(sessionId)) {
        const connections = sessionConnections.get(sessionId)!;
        for (const conn of connections) {
          if (conn.readyState === 1) { // OPEN
            conn.send(JSON.stringify({ 
              type: session.status === "finished" ? "game_finished" : "next_question", 
              session
            }));
          }
        }
      }
      
      res.json(session);
    } catch (err) {
      console.error("Error moving to next question:", err);
      res.status(500).json({ message: String(err) });
    }
  });
  
  app.post("/api/sessions/:id/answer", async (req, res) => {
    try {
      const sessionId = req.params.id;
      const { playerId, questionId, answerId, responseTime } = req.body;
      
      // Récupérer la session
      const session = await storage.getGameSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Récupérer le quiz
      const quiz = await storage.getQuiz(session.quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Trouver le joueur dans la session
      const player = session.players.find(p => p.id === playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found in session" });
      }
      
      // Trouver la question actuelle
      const currentQuestion = quiz.questions[session.currentQuestionIndex];
      if (!currentQuestion || currentQuestion.id !== questionId) {
        return res.status(400).json({ message: "Invalid question ID" });
      }
      
      // Vérifier si la réponse est correcte
      const selectedAnswer = currentQuestion.answers.find(a => a.id === answerId);
      if (!selectedAnswer) {
        return res.status(400).json({ message: "Invalid answer ID" });
      }
      
      const isCorrect = selectedAnswer.isCorrect;
      
      // Initialiser le tableau des réponses du joueur si nécessaire
      if (!player.answers) {
        player.answers = [];
      }
      
      // Ajouter la réponse
      player.answers.push({
        questionId,
        answerId,
        isCorrect,
        responseTime
      });
      
      // Calculer le score en fonction du temps de réponse
      if (isCorrect) {
        // Score de base pour une bonne réponse
        let points = 10;
        
        // Bonus pour une réponse rapide (max 10 points supplémentaires)
        if (responseTime !== undefined && session.questionStartTime !== undefined) {
          const maxTimeBonus = 10;
          const maxTimeAllowed = session.timePerQuestion * 1000; // en ms
          const timeTaken = responseTime;
          
          // Plus le temps est court, plus le bonus est grand
          const timeBonus = Math.round((1 - (timeTaken / maxTimeAllowed)) * maxTimeBonus);
          points += Math.max(0, timeBonus);
        }
        
        player.currentScore += points;
      }
      
      // Mettre à jour la session
      await storage.updateGameSession(session);
      
      // Notifier tous les joueurs via WebSocket
      if (sessionConnections.has(sessionId)) {
        const connections = sessionConnections.get(sessionId)!;
        for (const conn of connections) {
          if (conn.readyState === 1) { // OPEN
            conn.send(JSON.stringify({ 
              type: "player_answered", 
              session,
              playerId,
              questionId,
              isCorrect
            }));
          }
        }
      }
      
      res.json({ 
        isCorrect, 
        score: player.currentScore,
        sessionStatus: session.status
      });
    } catch (err) {
      console.error("Error processing answer:", err);
      res.status(500).json({ message: String(err) });
    }
  });

  const httpServer = createServer(app);
  
  // Configurer le serveur WebSocket
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    let clientSessionId: string | null = null;
    let clientPlayerId: string | null = null;
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Gérer la connexion à une session
        if (data.type === 'join_session') {
          const { sessionId, playerId } = data;
          
          // Vérifier que la session existe
          const session = await storage.getGameSession(sessionId);
          if (!session) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Session not found' 
            }));
            return;
          }
          
          // Vérifier que le joueur est dans la session
          const player = session.players.find(p => p.id === playerId);
          if (!player) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Player not in session' 
            }));
            return;
          }
          
          // Stocker les identifiants du client
          clientSessionId = sessionId;
          clientPlayerId = playerId;
          
          // Ajouter la connexion à la session
          if (!sessionConnections.has(sessionId)) {
            sessionConnections.set(sessionId, new Set());
          }
          sessionConnections.get(sessionId)!.add(ws);
          
          // Informer le client qu'il a rejoint la session
          ws.send(JSON.stringify({ 
            type: 'joined_session', 
            session,
            playerId
          }));
          
          console.log(`Player ${playerId} joined session ${sessionId}`);
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });
    
    ws.on('close', async () => {
      console.log('WebSocket client disconnected');
      
      // Si le client était dans une session, le retirer
      if (clientSessionId && clientPlayerId) {
        const sessions = sessionConnections.get(clientSessionId);
        if (sessions) {
          sessions.delete(ws);
          
          // Si la session est vide, la supprimer de la map
          if (sessions.size === 0) {
            sessionConnections.delete(clientSessionId);
          }
        }
        
        // Si le client était un joueur, le retirer de la session
        try {
          await storage.removePlayerFromSession(clientSessionId, clientPlayerId);
          
          // Notifier les autres joueurs
          const sessions = sessionConnections.get(clientSessionId);
          if (sessions) {
            for (const conn of sessions) {
              if (conn !== ws && conn.readyState === 1) { // OPEN
                conn.send(JSON.stringify({ 
                  type: 'player_disconnected', 
                  playerId: clientPlayerId 
                }));
              }
            }
          }
        } catch (err) {
          console.error('Error removing player on disconnect:', err);
        }
      }
    });
  });
  
  return httpServer;
}
