import * as SecureStore from 'expo-secure-store'
import * as Crypto from 'expo-crypto'
import { SECURE_STORE_KEYS } from '../config/constants'

class SessionManager {
  private sessionId: string | null = null

  async initialize(): Promise<string> {
    const stored = await SecureStore.getItemAsync(SECURE_STORE_KEYS.SESSION_ID)
    if (stored) {
      this.sessionId = stored
      return stored
    }
    const newId = Crypto.randomUUID()
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.SESSION_ID, newId)
    this.sessionId = newId
    return newId
  }

  getSessionId(): string {
    if (!this.sessionId) {
      throw new Error('SessionManager: not initialized')
    }
    return this.sessionId
  }

  clear(): void {
    this.sessionId = null
  }
}

export default new SessionManager()
