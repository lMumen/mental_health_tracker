import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

let db;

export async function getDb() {
  if (!db) {
    db = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database,
    });

    await db.exec('PRAGMA foreign_keys = ON;');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        picture TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS daily_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        mood_rating INTEGER NOT NULL,
        anxiety_level INTEGER NOT NULL,
        activity_type TEXT NOT NULL,
        activity_duration INTEGER NOT NULL,
        sleep_hours REAL NOT NULL,
        sleep_quality TEXT NOT NULL,
        social_engagements INTEGER NOT NULL,
        stress_level INTEGER NOT NULL,
        symptoms TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log('Database initialized successfully.');
  }
  return db;
}
