import { WeightTracker } from "./database"
import { generateDateColumns } from "./utils"
import { AuthService } from "./auth"
import { mkdir } from "fs/promises"
import { dirname } from "path"
import { existsSync } from "fs"

const APP_SECRET = process.env.APP_SECRET
const DATABASE_PATH = process.env.DATABASE_PATH || "./data/tracker.db"
const PORT = process.env.PORT || 3000

if (APP_SECRET === undefined) {
  console.error("APP_SECRET environment variable is required (can be empty)")
  process.exit(1)
}

await mkdir(dirname(DATABASE_PATH), { recursive: true })

const db = new WeightTracker(DATABASE_PATH)
const authService = new AuthService(db)

function validateSecret(request: Request): boolean {
  const url = new URL(request.url)
  return url.searchParams.get("secret") === APP_SECRET
}

function requireAuth(request: Request): number | null {
  const sessionId = authService.getSessionFromRequest(request)
  if (!sessionId) return null
  return authService.validateSession(sessionId)
}

function createUnauthorizedResponse(): Response {
  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Unauthorized</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
        </style>
      </head>
      <body>
        <h1>You are not authorized</h1>
      </body>
    </html>`,
    {
      status: 401,
      headers: { "Content-Type": "text/html" },
    }
  )
}

const server = Bun.serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url)
    const method = request.method

    if (url.pathname.startsWith("/api/")) {
      // Public authentication endpoints
      if (url.pathname === "/api/login" && method === "POST") {
        const body = await request.json()
        const { username, password } = body as { username: string; password: string }

        if (!username || !password) {
          return new Response("Missing credentials", { status: 400 })
        }

        const sessionId = await authService.authenticate(username, password)
        if (!sessionId) {
          return new Response("Invalid credentials", { status: 401 })
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": authService.createAuthCookie(sessionId)
          }
        })
      }

      if (url.pathname === "/api/logout" && method === "POST") {
        const sessionId = authService.getSessionFromRequest(request)
        if (sessionId) {
          authService.logout(sessionId)
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": authService.createLogoutCookie()
          }
        })
      }

      if (url.pathname === "/api/change-password" && method === "POST") {
        const userId = requireAuth(request)
        if (!userId) {
          return new Response("Unauthorized", { status: 401 })
        }

        const body = await request.json()
        const { newPassword } = body as { newPassword: string }

        if (!newPassword) {
          return new Response("Missing password", { status: 400 })
        }

        authService.changePassword(userId, newPassword)
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" }
        })
      }

      // Protected API endpoints - require authentication
      const userId = requireAuth(request)
      if (!userId) {
        return new Response("Unauthorized", { status: 401 })
      }

      if (url.pathname === "/api/data" && method === "GET") {
        const users = db.getAllUsers()
        const weights = db.getAllWeights()
        const existingDates = db.getAllDates()
        const dateColumns = generateDateColumns(existingDates)

        const weightsByUserAndDate = weights.reduce((acc, weight) => {
          const key = `${weight.user_id}-${weight.date}`
          acc[key] = weight
          return acc
        }, {} as Record<string, any>)

        return Response.json({
          users,
          weights: weightsByUserAndDate,
          dateColumns,
        })
      }

      if (url.pathname === "/api/weight" && method === "POST") {
        const body = await request.json()
        const { userId, date, weight } = body as { userId: number; date: string; weight: number }

        if (!userId || !date || weight === undefined) {
          return new Response("Missing required fields", { status: 400 })
        }

        const updatedWeight = db.upsertWeight(userId, date, weight)
        const previousWeight = db.getUserPreviousWeight(userId, date)

        const responseData = {
          weight: updatedWeight,
          previousWeight,
        }

        return Response.json(responseData)
      }

      if (url.pathname === "/api/weight" && method === "DELETE") {
        const body = await request.json()
        const { userId, date } = body as { userId: number; date: string }

        if (!userId || !date) {
          return new Response("Missing required fields", { status: 400 })
        }

        const deleted = db.deleteWeight(userId, date)

        if (deleted) {
          return Response.json({ success: true })
        } else {
          return new Response("Weight not found", { status: 404 })
        }
      }

      if (url.pathname === "/api/export/sqlite" && method === "GET") {
        try {
          const file = Bun.file(DATABASE_PATH)
          const fileName = `weight-tracker-${new Date().toISOString().split("T")[0]}.db`

          return new Response(file, {
            headers: {
              "Content-Type": "application/octet-stream",
              "Content-Disposition": `attachment; filename="${fileName}"`,
            },
          })
        } catch (error) {
          console.error("Failed to export SQLite file:", error)
          return new Response("Failed to export database", { status: 500 })
        }
      }

      return new Response("Not Found", { status: 404 })
    }

    // For assets and static files, don't require authentication
    if (url.pathname.startsWith("/assets/")) {
      const filePath = "./dist" + url.pathname
      if (existsSync(filePath)) {
        const file = Bun.file(filePath)
        return new Response(file)
      }
    }

    // Always serve the React app for the root path - let the frontend handle auth
    if (url.pathname === "/") {
      if (existsSync("./dist/index.html")) {
        const file = Bun.file("./dist/index.html")
        return new Response(file, {
          headers: { "Content-Type": "text/html" },
        })
      } else {
        return new Response("", {
          headers: { "Content-Type": "text/html" },
          status: 404,
        })
      }
    }

    return new Response("Not Found", { status: 404 })
  },
})

console.log(`Server running on http://localhost:${PORT}`)
