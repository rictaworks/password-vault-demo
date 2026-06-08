import type { SQLiteDatabase } from 'expo-sqlite'

const CREATE_SESSIONS = `
  CREATE TABLE IF NOT EXISTS sessions (
    session_id     TEXT PRIMARY KEY,
    created_at     DATETIME DEFAULT (datetime('now')),
    last_active_at DATETIME DEFAULT (datetime('now'))
  );
`

const CREATE_CREDENTIALS = `
  CREATE TABLE IF NOT EXISTS credentials (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id   TEXT    NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    service_name TEXT    NOT NULL,
    username_enc TEXT,
    password_enc TEXT    NOT NULL,
    memo_enc     TEXT,
    category     TEXT    NOT NULL CHECK(category IN ('ウェブ','アプリ','金融','SNS','その他')),
    strength     TEXT    NOT NULL CHECK(strength IN ('weak','medium','strong','excellent')),
    deleted_at   DATETIME,
    created_at   DATETIME DEFAULT (datetime('now')),
    updated_at   DATETIME DEFAULT (datetime('now'))
  );
`

const CREATE_RESET_LOG = `
  CREATE TABLE IF NOT EXISTS reset_log (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    reset_at      DATETIME DEFAULT (datetime('now')),
    deleted_count INTEGER NOT NULL
  );
`

const ENABLE_WAL = `PRAGMA journal_mode=WAL;`
const ENABLE_FK = `PRAGMA foreign_keys=ON;`

export async function initializeSchema(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(ENABLE_WAL)
  await db.execAsync(ENABLE_FK)
  await db.execAsync(CREATE_SESSIONS)
  await db.execAsync(CREATE_CREDENTIALS)
  await db.execAsync(CREATE_RESET_LOG)
}
