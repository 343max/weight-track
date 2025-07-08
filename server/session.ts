import { randomBytes } from "crypto";

export interface Session {
  id: string;
  userId: number;
  createdAt: Date;
  lastAccessed: Date;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private readonly sessionTimeout = 365 * 24 * 60 * 60 * 1000; // 1 year

  generateSessionId(): string {
    return randomBytes(32).toString('hex');
  }

  createSession(userId: number): string {
    const sessionId = this.generateSessionId();
    const session: Session = {
      id: sessionId,
      userId,
      createdAt: new Date(),
      lastAccessed: new Date()
    };
    
    this.sessions.set(sessionId, session);
    return sessionId;
  }

  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check if session is expired
    const now = new Date();
    if (now.getTime() - session.lastAccessed.getTime() > this.sessionTimeout) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Update last accessed
    session.lastAccessed = now;
    return session;
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.sessions) {
      if (now.getTime() - session.lastAccessed.getTime() > this.sessionTimeout) {
        this.sessions.delete(sessionId);
      }
    }
  }
}