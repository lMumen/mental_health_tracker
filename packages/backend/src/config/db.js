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
        sleep_disturbances TEXT,
        log_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    const columns = await db.all('PRAGMA table_info(daily_logs)');
    if (!columns.some((column) => column.name === 'log_date')) {
      await db.exec('ALTER TABLE daily_logs ADD COLUMN log_date TEXT');
      await db.exec("UPDATE daily_logs SET log_date = date(created_at) WHERE log_date IS NULL");
    }
    if (!columns.some((column) => column.name === 'sleep_disturbances')) {
      await db.exec('ALTER TABLE daily_logs ADD COLUMN sleep_disturbances TEXT');
    }

    await db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_logs_user_date
      ON daily_logs(user_id, log_date)
      WHERE log_date IS NOT NULL;
    `);

    console.log('Database initialized successfully.');
  }
  return db;
}
