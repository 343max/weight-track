import { WeightTracker } from './database'
import { createHash, randomBytes } from 'crypto'

const DATABASE_PATH = process.env.DATABASE_PATH || './data/tracker.db'

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#AED6F1', '#A3E4D7',
]

function generateRandomPassword(length: number = 20): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''

  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes(1)[0]! % chars.length
    password += chars[randomIndex]
  }

  return password
}

function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)]!
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

async function addUser() {
  const args = process.argv.slice(2)

  if (args.length < 1) {
    console.error('Usage: bun run add-user <name> [color] [password]')
    console.error('')
    console.error('  name      - Display name for the user (required)')
    console.error('  color     - Hex color for the user (optional, random if omitted)')
    console.error('  password  - Login password (optional, auto-generated if omitted)')
    console.error('')
    console.error('Examples:')
    console.error('  bun run add-user "Alice"')
    console.error('  bun run add-user "Bob" "#4ECDC4"')
    console.error('  bun run add-user "Charlie" "#45B7D1" "mypassword"')
    process.exit(1)
  }

  const name = args[0]!.trim()
  const color = args[1]?.trim() || randomColor()
  const password = args[2]?.trim() || generateRandomPassword()

  if (!name) {
    console.error('Error: Name cannot be empty')
    process.exit(1)
  }

  const db = new WeightTracker(DATABASE_PATH)

  const existingUser = db.getUserByName(name)
  if (existingUser) {
    console.error(`Error: User '${name}' already exists`)
    process.exit(1)
  }

  // Insert user directly using bun:sqlite since WeightTracker doesn't expose addUser
  const sqlite = (db as any).db
  const hashedPassword = hashPassword(password)
  sqlite.run('INSERT INTO users (name, color, password) VALUES (?, ?, ?)', name, color, hashedPassword)

  console.log(`User '${name}' created successfully`)
  console.log(`  Color: ${color}`)
  if (!args[2]) {
    console.log(`  Password: ${password}`)
    console.log(`  (save this password — it won't be shown again)`)
  }
  console.log('')
  console.log(`CSV: "${name}","${password}"`)

  process.exit(0)
}

addUser().catch((error) => {
  console.error('Failed to add user:', error)
  process.exit(1)
})
