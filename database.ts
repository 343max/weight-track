import { Database } from "bun:sqlite";

export interface User {
  id: number;
  name: string;
  color: string;
}

export interface Weight {
  id: number;
  user_id: number;
  date: string;
  weight_kg: number;
}

export interface WeightEntry extends Weight {
  user_name: string;
  user_color: string;
}

export class WeightTracker {
  private db: Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase() {
    this.db.exec(`
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
  }

  getAllUsers(): User[] {
    const stmt = this.db.prepare("SELECT * FROM users ORDER BY name");
    return stmt.all() as User[];
  }

  getAllWeights(): WeightEntry[] {
    const stmt = this.db.prepare(`
      SELECT w.*, u.name as user_name, u.color as user_color
      FROM weights w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.date, u.name
    `);
    return stmt.all() as WeightEntry[];
  }

  getWeightsByDate(date: string): WeightEntry[] {
    const stmt = this.db.prepare(`
      SELECT w.*, u.name as user_name, u.color as user_color
      FROM weights w
      JOIN users u ON w.user_id = u.id
      WHERE w.date = ?
      ORDER BY u.name
    `);
    return stmt.all(date) as WeightEntry[];
  }

  upsertWeight(userId: number, date: string, weightKg: number): Weight {
    const roundedWeight = Math.round(weightKg * 10) / 10;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO weights (user_id, date, weight_kg)
      VALUES (?, ?, ?)
    `);
    stmt.run(userId, date, roundedWeight);
    
    const getStmt = this.db.prepare("SELECT * FROM weights WHERE user_id = ? AND date = ?");
    return getStmt.get(userId, date) as Weight;
  }

  getUserPreviousWeight(userId: number, beforeDate: string): Weight | null {
    const stmt = this.db.prepare(`
      SELECT * FROM weights 
      WHERE user_id = ? AND date < ? 
      ORDER BY date DESC 
      LIMIT 1
    `);
    return stmt.get(userId, beforeDate) as Weight | null;
  }

  getAllDates(): string[] {
    const stmt = this.db.prepare("SELECT DISTINCT date FROM weights ORDER BY date");
    return stmt.all().map((row: any) => row.date);
  }

  getLastEntryDate(): string | null {
    const stmt = this.db.prepare("SELECT MAX(date) as last_date FROM weights");
    const result = stmt.get() as { last_date: string | null };
    return result.last_date;
  }

  close() {
    this.db.close();
  }
}