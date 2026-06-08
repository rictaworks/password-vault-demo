export type AuthPurpose = 'unlock' | 'add' | 'view' | 'delete'
export type AuthResult = 'success' | 'failure' | 'unavailable'
export type Strength = 'weak' | 'medium' | 'strong' | 'excellent'
export type Category = 'ウェブ' | 'アプリ' | '金融' | 'SNS' | 'その他'
export type AppEnv = 'development' | 'production' | 'test'

export interface NewEntry {
  serviceName: string
  username?: string
  password: string
  memo?: string
  category: Category
}

export interface EntryRow {
  id: number
  sessionId: string
  serviceName: string
  usernameEnc: string | null
  passwordEnc: string
  memoEnc: string | null
  category: Category
  strength: Strength
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Patch {
  serviceName?: string
  username?: string
  password?: string
  memo?: string
  category?: Category
}

export interface GenOptions {
  length: number
  upper: boolean
  lower: boolean
  digits: boolean
  symbols: boolean
}

export interface StrengthResult {
  strength: Strength
  score: number
  feedback: string[]
}

export interface HoneypotForm {
  email_confirm?: string
  website?: string
  [key: string]: string | undefined
}
