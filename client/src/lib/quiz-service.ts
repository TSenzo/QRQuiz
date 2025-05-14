import { apiRequest } from "@/lib/queryClient";
import { Quiz, InsertQuiz, Score, InsertScore, insertQuizSchema } from "@shared/schema";

export const QuizService = {
  // Quiz methods
  async getQuizzes(): Promise<Quiz[]> {
    const response = await apiRequest('GET', '/api/quizzes');
    return await response.json();
  },
  
  async getQuiz(id: number): Promise<Quiz> {
    const response = await apiRequest('GET', `/api/quizzes/${id}`);
    return await response.json();
  },
  
  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const response = await apiRequest('POST', '/api/quizzes', quiz);
    return await response.json();
  },
  
  async deleteQuiz(id: number): Promise<void> {
    await apiRequest('DELETE', `/api/quizzes/${id}`);
  },
  
  // Score methods
  async getScores(): Promise<Score[]> {
    const response = await apiRequest('GET', '/api/scores');
    return await response.json();
  },
  
  async getScoresByQuiz(quizId: number): Promise<Score[]> {
    const response = await apiRequest('GET', `/api/quizzes/${quizId}/scores`);
    return await response.json();
  },
  
  async createScore(score: InsertScore): Promise<Score> {
    const response = await apiRequest('POST', '/api/scores', score);
    return await response.json();
  },
  
  async getLeaderboard(limit?: number): Promise<Score[]> {
    const url = limit ? `/api/leaderboard?limit=${limit}` : '/api/leaderboard';
    const response = await apiRequest('GET', url);
    return await response.json();
  },
  
  async getLeaderboardByQuiz(quizId: number, limit?: number): Promise<Score[]> {
    const url = limit 
      ? `/api/quizzes/${quizId}/leaderboard?limit=${limit}` 
      : `/api/quizzes/${quizId}/leaderboard`;
    const response = await apiRequest('GET', url);
    return await response.json();
  },
  
  async resetScores(quizId?: number): Promise<void> {
    const url = quizId ? `/api/scores?quizId=${quizId}` : '/api/scores';
    await apiRequest('DELETE', url);
  },
  
  // QR code methods
  generateQuizQrUrl(quizId: number): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/take-quiz/${quizId}`;
  }
};

export default QuizService;
