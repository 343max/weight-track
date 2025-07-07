import { Database } from "bun:sqlite";
import { mkdir } from "fs/promises";
import { dirname } from "path";

const DATABASE_PATH = process.env.DATABASE_PATH || "./data/tracker.db";

async function setupSampleData() {
  await mkdir(dirname(DATABASE_PATH), { recursive: true });
  
  const db = new Database(DATABASE_PATH);
  
  console.log("Setting up sample data...");
  
  db.exec(`
    DROP TABLE IF EXISTS weights;
    DROP TABLE IF EXISTS users;
    
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT
    );

    CREATE TABLE weights (
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
  insertUser.run("Bobby", "#4ECDC4");
  insertUser.run("Foobar", "#45B7D1");
  insertUser.run("Ben", "#96CEB4");
  
  const dates = [
    "2025-06-06",
    "2025-06-13",
    "2025-06-20",
    "2025-06-27",
    "2025-07-04",
    "2025-07-11",
  ];
  
  const weights = [
    [1, 68.2, 68.0, 67.8, 67.5, 67.2, 67.0],
    [2, 85.4, 85.1, 84.9, 84.6, 84.3, 84.0],
    [3, 92.8, 92.5, 92.2, 91.9, 91.6, 91.3],
    [4, 73.1, 72.9, 72.6, 72.3, 72.0, 71.8],
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