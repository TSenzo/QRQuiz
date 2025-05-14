import { 
  Quiz, 
  InsertQuiz, 
  Score, 
  InsertScore, 
  User, 
  InsertUser, 
  quizzes, 
  scores, 
  users 
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private quizzes: Map<number, Quiz>;
  private scores: Map<number, Score>;
  private userCurrentId: number;
  private quizCurrentId: number;
  private scoreCurrentId: number;

  constructor() {
    this.users = new Map();
    this.quizzes = new Map();
    this.scores = new Map();
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
}

export const storage = new MemStorage();
