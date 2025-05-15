import { 
  Quiz, 
  InsertQuiz, 
  Score, 
  InsertScore, 
  User, 
  InsertUser, 
  quizzes, 
  scores, 
  users,
  GameSession,
  Player
} from "@shared/schema";

// Modify the interface with CRUD methods needed for the application
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Quiz methods
  getQuiz(id: number): Promise<Quiz | undefined>;
  getQuizzes(): Promise<Quiz[]>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  deleteQuiz(id: number): Promise<boolean>;
  
  // Score methods
  getScore(id: number): Promise<Score | undefined>;
  getScores(): Promise<Score[]>;
  getScoresByQuiz(quizId: number): Promise<Score[]>;
  createScore(score: InsertScore): Promise<Score>;
  getLeaderboard(limit?: number): Promise<Score[]>;
  getLeaderboardByQuiz(quizId: number, limit?: number): Promise<Score[]>;
  deleteScores(quizId?: number): Promise<boolean>;
  
  // Multiplayer methods
  createGameSession(quizId: number, hostId: string, hostName: string, timePerQuestion?: number): Promise<GameSession>;
  getGameSession(sessionId: string): Promise<GameSession | undefined>;
  updateGameSession(session: GameSession): Promise<GameSession>;
  addPlayerToSession(sessionId: string, player: Player): Promise<GameSession | undefined>;
  removePlayerFromSession(sessionId: string, playerId: string): Promise<GameSession | undefined>;
  setPlayerReady(sessionId: string, playerId: string, isReady: boolean): Promise<GameSession | undefined>;
  updatePlayerScore(sessionId: string, playerId: string, score: number): Promise<GameSession | undefined>;
  startGameSession(sessionId: string): Promise<GameSession | undefined>;
  nextQuestion(sessionId: string): Promise<GameSession | undefined>;
  endGameSession(sessionId: string): Promise<GameSession | undefined>;
  deleteGameSession(sessionId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private quizzes: Map<number, Quiz>;
  private scores: Map<number, Score>;
  private gameSessions: Map<string, GameSession>;
  private userCurrentId: number;
  private quizCurrentId: number;
  private scoreCurrentId: number;

  constructor() {
    this.users = new Map();
    this.quizzes = new Map();
    this.scores = new Map();
    this.gameSessions = new Map();
    this.userCurrentId = 1;
    this.quizCurrentId = 1;
    this.scoreCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Quiz methods
  async getQuiz(id: number): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async getQuizzes(): Promise<Quiz[]> {
    return Array.from(this.quizzes.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = this.quizCurrentId++;
    
    // Ensure questions is properly formatted as an array
    const questions = Array.isArray(insertQuiz.questions) 
      ? insertQuiz.questions 
      : [];
    
    const quiz: Quiz = { 
      id,
      title: insertQuiz.title, 
      description: insertQuiz.description || null,
      questions,
      createdAt: new Date() 
    };
    
    this.quizzes.set(id, quiz);
    return quiz;
  }

  async deleteQuiz(id: number): Promise<boolean> {
    return this.quizzes.delete(id);
  }

  // Score methods
  async getScore(id: number): Promise<Score | undefined> {
    return this.scores.get(id);
  }

  async getScores(): Promise<Score[]> {
    return Array.from(this.scores.values());
  }

  async getScoresByQuiz(quizId: number): Promise<Score[]> {
    return Array.from(this.scores.values())
      .filter(score => score.quizId === quizId)
      .sort((a, b) => b.score - a.score);
  }

  async createScore(insertScore: InsertScore): Promise<Score> {
    const id = this.scoreCurrentId++;
    const score: Score = {
      ...insertScore,
      id,
      createdAt: new Date()
    };
    this.scores.set(id, score);
    return score;
  }

  async getLeaderboard(limit: number = 10): Promise<Score[]> {
    return Array.from(this.scores.values())
      .sort((a, b) => {
        // Sort by percentage (score/totalQuestions)
        const percentA = (a.score / a.totalQuestions) * 100;
        const percentB = (b.score / b.totalQuestions) * 100;
        return percentB - percentA;
      })
      .slice(0, limit);
  }

  async getLeaderboardByQuiz(quizId: number, limit: number = 10): Promise<Score[]> {
    return Array.from(this.scores.values())
      .filter(score => score.quizId === quizId)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async deleteScores(quizId?: number): Promise<boolean> {
    if (quizId) {
      // Delete scores for a specific quiz
      Array.from(this.scores.entries())
        .filter(([_, score]) => score.quizId === quizId)
        .forEach(([id, _]) => this.scores.delete(id));
    } else {
      // Delete all scores
      this.scores.clear();
    }
    return true;
  }

  // Méthodes pour le multijoueur
  async createGameSession(quizId: number, hostId: string, hostName: string, timePerQuestion: number = 15): Promise<GameSession> {
    const quiz = await this.getQuiz(quizId);
    if (!quiz) {
      throw new Error(`Quiz with id ${quizId} not found`);
    }
    
    // Générer un ID de session unique (8 caractères aléatoires)
    const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const host: Player = {
      id: hostId,
      name: hostName,
      isHost: true,
      isReady: true, // L'hôte est toujours prêt
      currentScore: 0,
      answers: []
    };
    
    const session: GameSession = {
      id: sessionId,
      hostId,
      quizId,
      status: "waiting",
      players: [host],
      currentQuestionIndex: 0,
      timePerQuestion,
      createdAt: new Date()
    };
    
    this.gameSessions.set(sessionId, session);
    return session;
  }
  
  async getGameSession(sessionId: string): Promise<GameSession | undefined> {
    return this.gameSessions.get(sessionId);
  }
  
  async updateGameSession(session: GameSession): Promise<GameSession> {
    if (!this.gameSessions.has(session.id)) {
      throw new Error(`Session with id ${session.id} not found`);
    }
    
    this.gameSessions.set(session.id, session);
    return session;
  }
  
  async addPlayerToSession(sessionId: string, player: Player): Promise<GameSession | undefined> {
    const session = await this.getGameSession(sessionId);
    if (!session) {
      return undefined;
    }
    
    // Vérifier si le joueur est déjà dans la session
    if (session.players.some(p => p.id === player.id)) {
      throw new Error(`Player with id ${player.id} is already in the session`);
    }
    
    // Vérifier si la session est en phase d'attente
    if (session.status !== "waiting") {
      throw new Error(`Cannot join session ${sessionId} because it's already ${session.status}`);
    }
    
    session.players.push(player);
    return this.updateGameSession(session);
  }
  
  async removePlayerFromSession(sessionId: string, playerId: string): Promise<GameSession | undefined> {
    const session = await this.getGameSession(sessionId);
    if (!session) {
      return undefined;
    }
    
    // Trouver l'index du joueur
    const playerIndex = session.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      throw new Error(`Player with id ${playerId} not found in session ${sessionId}`);
    }
    
    // Si c'est l'hôte qui part, on termine la session
    if (session.players[playerIndex].isHost) {
      return this.deleteGameSession(sessionId).then(() => undefined);
    }
    
    // Supprimer le joueur
    session.players.splice(playerIndex, 1);
    return this.updateGameSession(session);
  }
  
  async setPlayerReady(sessionId: string, playerId: string, isReady: boolean): Promise<GameSession | undefined> {
    const session = await this.getGameSession(sessionId);
    if (!session) {
      return undefined;
    }
    
    // Trouver le joueur
    const player = session.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error(`Player with id ${playerId} not found in session ${sessionId}`);
    }
    
    player.isReady = isReady;
    return this.updateGameSession(session);
  }
  
  async updatePlayerScore(sessionId: string, playerId: string, score: number): Promise<GameSession | undefined> {
    const session = await this.getGameSession(sessionId);
    if (!session) {
      return undefined;
    }
    
    // Trouver le joueur
    const player = session.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error(`Player with id ${playerId} not found in session ${sessionId}`);
    }
    
    player.currentScore = score;
    return this.updateGameSession(session);
  }
  
  async startGameSession(sessionId: string): Promise<GameSession | undefined> {
    const session = await this.getGameSession(sessionId);
    if (!session) {
      return undefined;
    }
    
    // Vérifier si tous les joueurs sont prêts
    if (!session.players.every(p => p.isReady)) {
      throw new Error(`Cannot start session ${sessionId} because not all players are ready`);
    }
    
    session.status = "playing";
    session.currentQuestionIndex = 0;
    session.questionStartTime = Date.now();
    
    return this.updateGameSession(session);
  }
  
  async nextQuestion(sessionId: string): Promise<GameSession | undefined> {
    const session = await this.getGameSession(sessionId);
    if (!session) {
      return undefined;
    }
    
    // Vérifier si la session est en cours
    if (session.status !== "playing") {
      throw new Error(`Cannot go to next question because session ${sessionId} is ${session.status}`);
    }
    
    // Obtenir le quiz
    const quiz = await this.getQuiz(session.quizId);
    if (!quiz) {
      throw new Error(`Quiz with id ${session.quizId} not found`);
    }
    
    // Vérifier s'il y a une prochaine question
    if (session.currentQuestionIndex >= quiz.questions.length - 1) {
      // On a terminé toutes les questions
      return this.endGameSession(sessionId);
    }
    
    // Passer à la question suivante
    session.currentQuestionIndex++;
    session.questionStartTime = Date.now();
    
    return this.updateGameSession(session);
  }
  
  async endGameSession(sessionId: string): Promise<GameSession | undefined> {
    const session = await this.getGameSession(sessionId);
    if (!session) {
      return undefined;
    }
    
    session.status = "finished";
    session.questionStartTime = undefined;
    
    return this.updateGameSession(session);
  }
  
  async deleteGameSession(sessionId: string): Promise<boolean> {
    return this.gameSessions.delete(sessionId);
  }
}

export const storage = new MemStorage();
