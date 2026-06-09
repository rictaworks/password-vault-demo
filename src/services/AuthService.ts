import * as LocalAuth from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import { BackHandler } from 'react-native'
import { pbkdf2 } from '@noble/hashes/pbkdf2'
import { sha256 } from '@noble/hashes/sha256'
import { randomBytes } from '@noble/ciphers/webcrypto'
import { AUTH, SECURE_STORE_KEYS } from '../config/constants'
import type { AuthPurpose, AuthResult } from '../types'

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function pbkdf2Hash(password: string, salt: Uint8Array): Uint8Array {
  const enc = new TextEncoder()
  return pbkdf2(sha256, enc.encode(password), salt, {
    c: AUTH.PBKDF2_ITERATIONS,
    dkLen: AUTH.PBKDF2_KEY_LENGTH / 8,
  })
}

class AuthService {
  private authFlag: boolean = false
  private failureCount: number = 0
  private lastActiveAt: number = Date.now()

  isAuthenticated(): boolean {
    return this.authFlag
  }

  resetTimer(): void {
    this.lastActiveAt = Date.now()
  }

  checkTimeout(): boolean {
    if (!this.authFlag) return false
    if (Date.now() - this.lastActiveAt > AUTH.LOCK_TIMEOUT_MS) {
      this.lock()
      return true
    }
    return false
  }

  lock(): void {
    this.authFlag = false
  }

  onAppBackground(): void {
    this.lock()
  }

  async biometricAuth(_purpose: AuthPurpose): Promise<AuthResult> {
    const hasHardware = await LocalAuth.hasHardwareAsync()
    const isEnrolled = await LocalAuth.isEnrolledAsync()

    if (!hasHardware || !isEnrolled) {
      return 'unavailable'
    }

    const result = await LocalAuth.authenticateAsync({
      promptMessage: 'Vault unlock',
      cancelLabel: 'Cancel',
      disableDeviceFallback: true,
    })

    if (result.success) {
      this.authFlag = true
      this.failureCount = 0
      this.resetTimer()
      return 'success'
    }

    this.failureCount++
    if (this.failureCount >= AUTH.MAX_FAILURES) {
      this.failureCount = 0
      BackHandler.exitApp()
    }
    return 'failure'
  }

  async setupMasterPassword(password: string): Promise<void> {
    const saltBytes = randomBytes(16)
    const hashBytes = pbkdf2Hash(password, saltBytes)
    await SecureStore.setItemAsync(
      SECURE_STORE_KEYS.MASTER_PASSWORD_SALT,
      uint8ToBase64(saltBytes),
    )
    await SecureStore.setItemAsync(
      SECURE_STORE_KEYS.MASTER_PASSWORD_HASH,
      uint8ToBase64(hashBytes),
    )
  }

  async hasMasterPassword(): Promise<boolean> {
    const stored = await SecureStore.getItemAsync(
      SECURE_STORE_KEYS.MASTER_PASSWORD_HASH,
    )
    return stored !== null
  }

  async masterPasswordAuth(input: string): Promise<AuthResult> {
    const storedSaltB64 = await SecureStore.getItemAsync(
      SECURE_STORE_KEYS.MASTER_PASSWORD_SALT,
    )
    const storedHashB64 = await SecureStore.getItemAsync(
      SECURE_STORE_KEYS.MASTER_PASSWORD_HASH,
    )

    if (!storedSaltB64 || !storedHashB64) {
      await this.setupMasterPassword(input)
      this.authFlag = true
      this.failureCount = 0
      this.resetTimer()
      return 'success'
    }

    const salt = base64ToUint8(storedSaltB64)
    const computed = uint8ToBase64(pbkdf2Hash(input, salt))

    if (computed === storedHashB64) {
      this.authFlag = true
      this.failureCount = 0
      this.resetTimer()
      return 'success'
    }

    this.failureCount++
    if (this.failureCount >= AUTH.MAX_FAILURES) {
      this.failureCount = 0
      BackHandler.exitApp()
    }
    return 'failure'
  }
}

export default new AuthService()
