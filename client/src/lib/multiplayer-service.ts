import { GameSession, Player } from "@shared/schema";
import { apiRequest } from "./queryClient";

// Classe pour gérer la connexion WebSocket
class WebSocketConnection {
  private socket: WebSocket | null = null;
  private reconnectTimer: any = null;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  
  // Se connecter au serveur WebSocket
  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onopen = () => {
      console.log("WebSocket connected");
      this.notifyHandlers("connection", { connected: true });
      
      // Annuler le timer de reconnexion s'il est actif
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };
    
    this.socket.onclose = () => {
      console.log("WebSocket disconnected");
      this.notifyHandlers("disconnection", { connected: false });
      
      // Essayer de se reconnecter après un délai
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };
    
    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type) {
          this.notifyHandlers(data.type, data);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };
  }
  
  // Rejoindre une session
  joinSession(sessionId: string, playerId: string) {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      this.connect();
      
      // Attendre que la connexion soit établie avant d'envoyer le message
      const checkInterval = setInterval(() => {
        if (this.socket?.readyState === WebSocket.OPEN) {
          clearInterval(checkInterval);
          this.sendMessage({
            type: 'join_session',
            sessionId,
            playerId
          });
        }
      }, 100);
      
      return;
    }
    
    this.sendMessage({
      type: 'join_session',
      sessionId,
      playerId
    });
  }
  
  // Envoyer un message au serveur
  sendMessage(data: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn("Cannot send message, WebSocket not connected");
    }
  }
  
  // Fermer la connexion
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    }
  }
  
  // Ajouter un gestionnaire d'événements
  on(type: string, handler: (data: any) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }
  
  // Supprimer un gestionnaire d'événements
  off(type: string, handler: (data: any) => void) {
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type)!;
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  // Notifier tous les gestionnaires d'un type d'événement
  private notifyHandlers(type: string, data: any) {
    if (this.messageHandlers.has(type)) {
      for (const handler of this.messageHandlers.get(type)!) {
        handler(data);
      }
    }
  }
}

// Singleton pour la connexion WebSocket
export const wsConnection = new WebSocketConnection();

// Service pour les fonctionnalités multijoueur
export const MultiplayerService = {
  // Créer une nouvelle session
  async createSession(quizId: number, hostId: string, hostName: string, timePerQuestion?: number): Promise<GameSession> {
    const response = await apiRequest('POST', '/api/sessions', { 
      quizId, hostId, hostName, timePerQuestion 
    });
    return response as GameSession;
  },
  
  // Obtenir les informations d'une session
  async getSession(sessionId: string): Promise<GameSession> {
    const response = await apiRequest('GET', `/api/sessions/${sessionId}`);
    return response as GameSession;
  },
  
  // Rejoindre une session
  async joinSession(sessionId: string, player: Pick<Player, "id" | "name">): Promise<GameSession> {
    const response = await apiRequest('POST', `/api/sessions/${sessionId}/join`, player);
    const session = response as GameSession;
    
    // Se connecter au WebSocket
    wsConnection.joinSession(sessionId, player.id);
    
    return session;
  },
  
  // Quitter une session
  async leaveSession(sessionId: string, playerId: string): Promise<void> {
    await apiRequest('DELETE', `/api/sessions/${sessionId}/players/${playerId}`);
    
    // Fermer la connexion WebSocket
    wsConnection.disconnect();
  },
  
  // Marquer un joueur comme prêt
  async setPlayerReady(sessionId: string, playerId: string, isReady: boolean): Promise<GameSession> {
    const response = await apiRequest('PATCH', `/api/sessions/${sessionId}/players/${playerId}/ready`, { isReady });
    return response as GameSession;
  },
  
  // Démarrer une session
  async startSession(sessionId: string): Promise<GameSession> {
    const response = await apiRequest('POST', `/api/sessions/${sessionId}/start`);
    return response as GameSession;
  },
  
  // Passer à la question suivante
  async nextQuestion(sessionId: string): Promise<GameSession> {
    const response = await apiRequest('POST', `/api/sessions/${sessionId}/next-question`);
    return response as GameSession;
  },
  
  // Soumettre une réponse
  async submitAnswer(
    sessionId: string, 
    playerId: string, 
    questionId: number, 
    answerId: number, 
    responseTime: number
  ): Promise<{isCorrect: boolean, score: number, sessionStatus: string}> {
    const response = await apiRequest('POST', `/api/sessions/${sessionId}/answer`, {
      playerId,
      questionId,
      answerId,
      responseTime
    });
    return response as {isCorrect: boolean, score: number, sessionStatus: string};
  },
  
  // Générer un ID de joueur unique (basé sur un UUID)
  generatePlayerId(): string {
    return 'player_' + Math.random().toString(36).substring(2, 15);
  }
};