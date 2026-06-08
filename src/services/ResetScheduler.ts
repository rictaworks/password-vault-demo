import type { SQLiteDatabase } from 'expo-sqlite'
import { DB } from '../config/constants'

class ResetScheduler {
  private db: SQLiteDatabase | null = null
  private timer: ReturnType<typeof setTimeout> | null = null

  start(db: SQLiteDatabase): void {
    this.db = db
    this.scheduleNext()
  }

  private scheduleNext(): void {
    const ms = this.msUntilNextReset()
    this.timer = setTimeout(async () => {
      await this.runReset()
      this.scheduleNext()
    }, ms)
  }

  private msUntilNextReset(): number {
    const nowUtcMs = Date.now()
    const nowJstMs = nowUtcMs + DB.JST_OFFSET_MS
    const nowJst = new Date(nowJstMs)

    const resetJst = new Date(nowJstMs)
    resetJst.setUTCHours(DB.RESET_HOUR_JST, 0, 0, 0)

    if (nowJst.getUTCHours() >= DB.RESET_HOUR_JST) {
      resetJst.setUTCDate(resetJst.getUTCDate() + 1)
    }

    return resetJst.getTime() - nowJstMs
  }

  async runReset(): Promise<void> {
    if (!this.db) return

    const result = await this.db.runAsync(
      `DELETE FROM credentials WHERE deleted_at IS NOT NULL`,
    )
    const hardDeleted = result.changes

    const softResult = await this.db.runAsync(
      `DELETE FROM credentials WHERE deleted_at IS NULL`,
    )
    const totalDeleted = hardDeleted + softResult.changes

    await this.db.runAsync(
      `DELETE FROM sessions`,
    )

    await this.db.runAsync(
      `INSERT INTO reset_log (deleted_count) VALUES (?)`,
      [totalDeleted],
    )

    await this.db.execAsync(`VACUUM`)
  }

  stop(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}

export default new ResetScheduler()
