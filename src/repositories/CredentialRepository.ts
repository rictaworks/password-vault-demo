import type { SQLiteDatabase } from 'expo-sqlite'
import CryptoService from '../services/CryptoService'
import PasswordEvaluator from '../utils/PasswordEvaluator'
import type { NewEntry, EntryRow, Patch, Category, Strength } from '../types'

interface DbRow {
  id: number
  session_id: string
  service_name: string
  username_enc: string | null
  password_enc: string
  memo_enc: string | null
  category: string
  strength: string
  deleted_at: string | null
  created_at: string
  updated_at: string
}

function mapRow(row: DbRow): EntryRow {
  return {
    id: row.id,
    sessionId: row.session_id,
    serviceName: row.service_name,
    usernameEnc: row.username_enc,
    passwordEnc: row.password_enc,
    memoEnc: row.memo_enc,
    category: row.category as Category,
    strength: row.strength as Strength,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

class CredentialRepository {
  private db: SQLiteDatabase | null = null

  setDb(db: SQLiteDatabase): void {
    this.db = db
  }

  private requireDb(): SQLiteDatabase {
    if (!this.db) throw new Error('CredentialRepository: db not set')
    return this.db
  }

  async create(entry: NewEntry, sid: string): Promise<number> {
    const db = this.requireDb()
    const { strength } = PasswordEvaluator.evaluate(entry.password)

    await db.runAsync(
      `INSERT OR IGNORE INTO sessions (session_id) VALUES (?)`,
      [sid],
    )

    const passwordEnc = await CryptoService.encrypt(entry.password)
    const usernameEnc = entry.username
      ? await CryptoService.encrypt(entry.username)
      : null
    const memoEnc = entry.memo
      ? await CryptoService.encrypt(entry.memo)
      : null

    const result = await db.runAsync(
      `INSERT INTO credentials
         (session_id, service_name, username_enc, password_enc, memo_enc, category, strength)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sid, entry.serviceName, usernameEnc, passwordEnc, memoEnc, entry.category, strength],
    )

    return result.lastInsertRowId
  }

  async list(sid: string, q?: string, cat?: string): Promise<EntryRow[]> {
    const db = this.requireDb()
    const params: (string | null)[] = [sid]
    let sql = `
      SELECT * FROM credentials
      WHERE session_id = ? AND deleted_at IS NULL
    `
    if (q) {
      sql += ` AND service_name LIKE ?`
      params.push(`%${q}%`)
    }
    if (cat) {
      sql += ` AND category = ?`
      params.push(cat)
    }
    sql += ` ORDER BY service_name COLLATE NOCASE ASC`

    const rows = await db.getAllAsync<DbRow>(sql, params)
    return rows.map(mapRow)
  }

  async get(id: number, sid: string): Promise<EntryRow> {
    const db = this.requireDb()
    const row = await db.getFirstAsync<DbRow>(
      `SELECT * FROM credentials WHERE id = ? AND session_id = ? AND deleted_at IS NULL`,
      [id, sid],
    )
    if (!row) throw new Error(`CredentialRepository: entry ${id} not found`)
    return mapRow(row)
  }

  async update(id: number, sid: string, patch: Patch): Promise<void> {
    const db = this.requireDb()
    const current = await this.get(id, sid)

    const newPassword = patch.password ?? null
    const passwordEnc = newPassword
      ? await CryptoService.encrypt(newPassword)
      : current.passwordEnc
    const strength = newPassword
      ? PasswordEvaluator.evaluate(newPassword).strength
      : current.strength

    const usernameEnc = patch.username !== undefined
      ? patch.username ? await CryptoService.encrypt(patch.username) : null
      : current.usernameEnc

    const memoEnc = patch.memo !== undefined
      ? patch.memo ? await CryptoService.encrypt(patch.memo) : null
      : current.memoEnc

    const serviceName = patch.serviceName ?? current.serviceName
    const category = patch.category ?? current.category

    await db.runAsync(
      `UPDATE credentials
       SET service_name = ?, username_enc = ?, password_enc = ?,
           memo_enc = ?, category = ?, strength = ?,
           updated_at = datetime('now')
       WHERE id = ? AND session_id = ?`,
      [serviceName, usernameEnc, passwordEnc, memoEnc, category, strength, id, sid],
    )
  }

  async softDelete(id: number, sid: string): Promise<void> {
    const db = this.requireDb()
    await db.runAsync(
      `UPDATE credentials SET deleted_at = datetime('now') WHERE id = ? AND session_id = ?`,
      [id, sid],
    )
  }
}

export default new CredentialRepository()
