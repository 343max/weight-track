import { WeightTracker } from "./database"

const DATABASE_PATH = process.env.DATABASE_PATH || "./data/tracker.db"

function getUsersWithoutPasswords() {
  const db = new WeightTracker(DATABASE_PATH)
  const users = db.getAllUsers()
  const usersWithoutPasswords = users.filter(user => !user.password)
  
  const usernames = usersWithoutPasswords.map(user => user.name)
  console.log(usernames.join(','))
}

getUsersWithoutPasswords()