import { createHash } from "crypto"
import { WeightTracker } from "./database"
import { SessionManager } from "./session"

export class AuthService {
  private sessionManager: SessionManager
  private db: WeightTracker

  constructor(db: WeightTracker) {
    this.db = db
    this.sessionManager = new SessionManager()

    // Clean up expired sessions every hour
    setInterval(() => {
      this.sessionManager.cleanupExpiredSessions()
    }, 60 * 60 * 1000)
  }

  hashPassword(password: string): string {
    return createHash("sha256").update(password).digest("hex")
  }

  async authenticate(username: string, password: string): Promise<string | null> {
    const user = this.db.getUserByName(username)

    if (!user || !user.password) return null

    const hashedPassword = this.hashPassword(password)
    if (user.password !== hashedPassword) return null

    return this.sessionManager.createSession(user.id)
  }

  validateSession(sessionId: string): number | null {
    const session = this.sessionManager.getSession(sessionId)
    return session ? session.userId : null
  }

  logout(sessionId: string): void {
    this.sessionManager.deleteSession(sessionId)
  }

  changePassword(userId: number, newPassword: string): void {
    const hashedPassword = this.hashPassword(newPassword)
    this.db.updateUserPassword(userId, hashedPassword)
  }

  getSessionFromRequest(request: Request): string | null {
    const cookieHeader = request.headers.get("Cookie")
    if (!cookieHeader) return null

    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=")
      acc[key] = value
      return acc
    }, {} as Record<string, string>)

    return cookies["session"] || null
  }

  createAuthCookie(sessionId: string): string {
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1) // 1 year
    const isProduction = process.env.NODE_ENV === "production"
    const secureFlag = isProduction ? "Secure; " : ""
    return `session=${sessionId}; HttpOnly; ${secureFlag}SameSite=Strict; Path=/; Expires=${expires.toUTCString()}`
  }

  createLogoutCookie(): string {
    const isProduction = process.env.NODE_ENV === "production"
    const secureFlag = isProduction ? "Secure; " : ""
    return `session=; HttpOnly; ${secureFlag}SameSite=Strict; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  }
}
