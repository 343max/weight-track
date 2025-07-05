import { WeightTracker } from "./database"
import { generateDateColumns } from "./utils"
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

function validateSecret(request: Request): boolean {
  const url = new URL(request.url)
  return url.searchParams.get("secret") === APP_SECRET
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
      if (!validateSecret(request)) {
        return new Response("Unauthorized", { status: 401 })
      }

      if (url.pathname === "/api/data" && method === "GET") {
        const users = db.getAllUsers()
        const weights = db.getAllWeights()
        const firstEntryDate = db.getFirstEntryDate()
        const dateColumns = generateDateColumns(firstEntryDate)

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
          const fileName = `weight-tracker-${new Date().toISOString().split('T')[0]}.db`
          
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

    if (!validateSecret(request)) {
      return createUnauthorizedResponse()
    }

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

    if (url.pathname.startsWith("/assets/")) {
      const filePath = "./dist" + url.pathname
      if (existsSync(filePath)) {
        const file = Bun.file(filePath)
        return new Response(file)
      }
    }

    return new Response("Not Found", { status: 404 })
  },
})

console.log(`Server running on http://localhost:${PORT}`)
