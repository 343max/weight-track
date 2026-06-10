import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

interface SessionPayload {
  userId: number
  iat: number
}

export class SessionManager {
  private key: Buffer
  private readonly maxAge = 365 * 24 * 60 * 60 * 1000 // 1 year

  constructor(secret: string) {
    this.key = createHash('sha256').update(secret).digest()
  }

  createSession(userId: number): string {
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', this.key, iv)

    const payload: SessionPayload = { userId, iat: Date.now() }
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(payload), 'utf8'),
      cipher.final(),
    ])
    const authTag = cipher.getAuthTag()

    // Format: iv (12) + authTag (16) + ciphertext
    return Buffer.concat([iv, authTag, encrypted]).toString('base64url')
  }

  getSession(token: string): { userId: number } | null {
    try {
      const buf = Buffer.from(token, 'base64url')

      if (buf.length < 28) return null // iv (12) + authTag (16) minimum

      const iv = buf.subarray(0, 12)
      const authTag = buf.subarray(12, 28)
      const encrypted = buf.subarray(28)

      const decipher = createDecipheriv('aes-256-gcm', this.key, iv)
      decipher.setAuthTag(authTag)

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]).toString('utf8')

      const payload = JSON.parse(decrypted) as SessionPayload

      if (typeof payload.userId !== 'number' || typeof payload.iat !== 'number') return null

      // Reject expired sessions
      if (Date.now() - payload.iat > this.maxAge) return null

      return { userId: payload.userId }
    } catch {
      return null
    }
  }

  deleteSession(_token: string): void {
    // Stateless — logout is handled by clearing the cookie
  }
}
