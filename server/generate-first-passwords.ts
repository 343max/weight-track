import { WeightTracker } from "./database"
import { AuthService } from "./auth"
import { randomBytes } from "crypto"

const DATABASE_PATH = process.env.DATABASE_PATH || "./data/tracker.db"

function generateRandomPassword(length: number = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let password = ""

  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes(1)[0] % chars.length
    password += chars[randomIndex]
  }

  return password
}

async function generateFirstPasswords() {
  const userList = process.argv[2]

  if (!userList) {
    console.error('Usage: bun run generate-first-passwords "user1,user2,user3"')
    process.exit(1)
  }

  const db = new WeightTracker(DATABASE_PATH)
  const authService = new AuthService(db)

  const requestedUsernames = userList.split(",").map((name) => name.trim())
  const csvData: string[] = ["username,password"]

  for (const username of requestedUsernames) {
    const user = db.getUserByName(username)

    if (!user) {
      console.error(`Error: User '${username}' not found`)
      process.exit(1)
    }

    const password = generateRandomPassword()
    const hashedPassword = authService.hashPassword(password)

    db.updateUserPassword(user.id, hashedPassword)
    csvData.push(`"${user.name}","${password}"`)
  }

  console.log(csvData.join("\n"))
}

generateFirstPasswords().catch(() => process.exit(1))
