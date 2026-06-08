import type { Category } from '../types'

export const SECURE_STORE_KEYS = {
  SESSION_ID: 'vault_session_id',
  ENCRYPTION_KEY: 'vault_encryption_key',
  MASTER_PASSWORD_HASH: 'vault_master_pw_hash',
  MASTER_PASSWORD_SALT: 'vault_master_pw_salt',
} as const

export const AUTH = {
  MAX_FAILURES: 3,
  LOCK_TIMEOUT_MS: 300_000,
  PBKDF2_ITERATIONS: 100_000,
  PBKDF2_KEY_LENGTH: 256,
} as const

export const CLIPBOARD = {
  CLEAR_DELAY_MS: 30_000,
} as const

export const DB = {
  NAME: 'vault.db',
  RESET_HOUR_JST: 3,
  JST_OFFSET_MS: 9 * 60 * 60 * 1000,
} as const

export const CRYPTO = {
  KEY_LENGTH_BYTES: 32,
  IV_LENGTH_BYTES: 12,
} as const

export const PASSWORD_GENERATOR = {
  DEFAULT_LENGTH: 16,
  MIN_LENGTH: 8,
  MAX_LENGTH: 64,
} as const

export const CATEGORIES: Category[] = [
  'ウェブ',
  'アプリ',
  '金融',
  'SNS',
  'その他',
]

export const STRENGTH_SCORE_THRESHOLDS = {
  WEAK: 30,
  MEDIUM: 55,
  STRONG: 75,
} as const
