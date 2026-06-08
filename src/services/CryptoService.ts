import * as SecureStore from 'expo-secure-store'
import { gcm } from '@noble/ciphers/aes'
import { randomBytes } from '@noble/ciphers/webcrypto'
import { SECURE_STORE_KEYS, CRYPTO } from '../config/constants'

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

class CryptoService {
  private key: Uint8Array | null = null

  async getOrCreateKey(): Promise<Uint8Array> {
    if (this.key) return this.key

    const stored = await SecureStore.getItemAsync(SECURE_STORE_KEYS.ENCRYPTION_KEY)
    if (stored) {
      this.key = base64ToUint8(stored)
      return this.key
    }

    const newKey = randomBytes(CRYPTO.KEY_LENGTH_BYTES)
    await SecureStore.setItemAsync(
      SECURE_STORE_KEYS.ENCRYPTION_KEY,
      uint8ToBase64(newKey),
    )
    this.key = newKey
    return this.key
  }

  async encrypt(plain: string): Promise<string> {
    const key = await this.getOrCreateKey()
    const iv = randomBytes(CRYPTO.IV_LENGTH_BYTES)
    const cipher = gcm(key, iv)
    const encoded = new TextEncoder().encode(plain)
    const ciphertext = cipher.encrypt(encoded)
    const combined = new Uint8Array(iv.length + ciphertext.length)
    combined.set(iv, 0)
    combined.set(ciphertext, iv.length)
    return uint8ToBase64(combined)
  }

  async decrypt(cipherB64: string): Promise<string> {
    const key = await this.getOrCreateKey()
    const combined = base64ToUint8(cipherB64)
    const iv = combined.slice(0, CRYPTO.IV_LENGTH_BYTES)
    const ciphertext = combined.slice(CRYPTO.IV_LENGTH_BYTES)
    const cipher = gcm(key, iv)
    const plain = cipher.decrypt(ciphertext)
    return new TextDecoder().decode(plain)
  }
}

export default new CryptoService()
