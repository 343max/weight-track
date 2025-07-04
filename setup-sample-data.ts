import { Database } from "bun:sqlite";
import { mkdir } from "fs/promises";
import { dirname } from "path";

const DATABASE_PATH = process.env.DATABASE_PATH || "./data/tracker.db";

async function setupSampleData() {
  await mkdir(dirname(DATABASE_PATH), { recursive: true });
  
  const db = new Database(DATABASE_PATH);
  
  console.log("Setting up sample data...");
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS weights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, date)
    );
  `);
  
  const insertUser = db.prepare("INSERT INTO users (name, color) VALUES (?, ?)");
  const insertWeight = db.prepare("INSERT OR IGNORE INTO weights (user_id, date, weight_kg) VALUES (?, ?, ?)");
  
  insertUser.run("Alice", "#FF6B6B");
  insertUser.run("Bob", "#4ECDC4");
  insertUser.run("Charlie", "#45B7D1");
  insertUser.run("Diana", "#96CEB4");
  
  const dates = [
    "2024-06-28",
    "2024-07-05",
    "2024-07-12",
    "2024-07-19",
    "2024-07-26",
  ];
  
  const weights = [
    [1, 70.5, 70.2, 69.8, 69.5, 69.1],
    [2, 82.3, 82.1, 81.9, 81.7, 81.4],
    [3, 75.0, 74.8, 74.6, 74.3, 74.0],
    [4, 68.2, 68.0, 67.8, 67.5, 67.2],
  ];
  
  for (let i = 0; i < dates.length; i++) {
    for (let j = 0; j < weights.length; j++) {
      if (weights[j][i + 1] !== undefined) {
        insertWeight.run(j + 1, dates[i], weights[j][i + 1]);
      }
    }
  }
  
  console.log("Sample data inserted successfully!");
  
  const allUsers = db.prepare("SELECT * FROM users ORDER BY name").all();
  const allWeights = db.prepare(`
    SELECT w.*, u.name as user_name, u.color as user_color
    FROM weights w
    JOIN users u ON w.user_id = u.id
    ORDER BY w.date, u.name
  `).all();
  
  console.log("Users:", allUsers);
  console.log("Weights:", allWeights);
  
  db.close();
}

setupSampleData().catch(console.error);