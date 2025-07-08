import { WeightTracker } from "./database"
import { AuthService } from "./auth"

const DATABASE_PATH = process.env.DATABASE_PATH || "./data/tracker.db"

const db = new WeightTracker(DATABASE_PATH)
const authService = new AuthService(db)

async function setupPasswords() {
  console.log("Setting up passwords for existing users...")
  
  const users = db.getAllUsers()
  
  if (users.length === 0) {
    console.log("No users found in database.")
    return
  }
  
  console.log(`Found ${users.length} users:`)
  
  for (const user of users) {
    if (user.password) {
      console.log(`- ${user.name} (password already set)`)
    } else {
      console.log(`- ${user.name} (no password)`)
      
      // Set a default password that users should change
      const defaultPassword = "password123"
      const hashedPassword = authService.hashPassword(defaultPassword)
      db.updateUserPassword(user.id, hashedPassword)
      
      console.log(`  → Set default password: ${defaultPassword}`)
      console.log(`  → User should change this password after first login`)
    }
  }
  
  console.log("\nPassword setup complete!")
  console.log("Users with default passwords should change them after logging in.")
}

setupPasswords().catch(console.error)