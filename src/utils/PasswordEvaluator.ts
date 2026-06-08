import { randomBytes } from '@noble/ciphers/webcrypto'
import type { GenOptions, StrengthResult, Strength } from '../types'
import { STRENGTH_SCORE_THRESHOLDS, PASSWORD_GENERATOR } from '../config/constants'

const CHAR_SETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?',
} as const

const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', '1234567890', 'password1',
  'qwerty', 'abc123', '111111', 'iloveyou', 'admin',
  'letmein', 'welcome', 'monkey', 'dragon', 'master',
  'login', 'hello', 'shadow', 'sunshine', 'princess',
  'superman', 'michael', 'jessica', 'password123', 'batman',
  'trustno1', '1q2w3e4r', 'qwerty123', 'zxcvbnm', 'asdfghjkl',
  '000000', 'pass', 'test', 'guest', 'root', 'user',
  'admin123', 'passw0rd', 'p@ssw0rd', 'P@ssw0rd', 'Pass1234',
])

function hasSequential(pw: string): boolean {
  for (let i = 0; i < pw.length - 2; i++) {
    const a = pw.charCodeAt(i)
    const b = pw.charCodeAt(i + 1)
    const c = pw.charCodeAt(i + 2)
    if (b - a === 1 && c - b === 1) return true
    if (a - b === 1 && b - c === 1) return true
  }
  return false
}

class PasswordEvaluator {
  evaluate(pw: string): StrengthResult {
    const feedback: string[] = []
    let score = 0

    if (pw.length < 8) {
      feedback.push('tooShort')
      return { strength: 'weak', score: 0, feedback }
    }

    score += Math.min(pw.length * 2, 30)

    const hasUpper = /[A-Z]/.test(pw)
    const hasLower = /[a-z]/.test(pw)
    const hasDigit = /[0-9]/.test(pw)
    const hasSymbol = /[^A-Za-z0-9]/.test(pw)

    if (hasUpper) score += 10; else feedback.push('noUpper')
    if (hasLower) score += 10; else feedback.push('noLower')
    if (hasDigit) score += 10; else feedback.push('noDigit')
    if (hasSymbol) score += 15; else feedback.push('noSymbol')

    if (COMMON_PASSWORDS.has(pw.toLowerCase())) {
      feedback.push('isCommon')
      score = Math.min(score, 25)
    }

    if (hasSequential(pw)) {
      feedback.push('hasSequential')
      score -= 10
    }

    score = Math.max(0, Math.min(100, score))

    let strength: Strength
    if (score <= STRENGTH_SCORE_THRESHOLDS.WEAK) {
      strength = 'weak'
    } else if (score <= STRENGTH_SCORE_THRESHOLDS.MEDIUM) {
      strength = 'medium'
    } else if (score <= STRENGTH_SCORE_THRESHOLDS.STRONG) {
      strength = 'strong'
    } else {
      strength = 'excellent'
    }

    if (feedback.length === 0) feedback.push('good')

    return { strength, score, feedback }
  }

  generate(opts: GenOptions): string {
    const {
      length = PASSWORD_GENERATOR.DEFAULT_LENGTH,
      upper,
      lower,
      digits,
      symbols,
    } = opts

    let charset = ''
    if (upper) charset += CHAR_SETS.upper
    if (lower) charset += CHAR_SETS.lower
    if (digits) charset += CHAR_SETS.digits
    if (symbols) charset += CHAR_SETS.symbols

    if (!charset) {
      throw new Error('PasswordEvaluator.generate: no character set selected')
    }

    const clampedLength = Math.min(
      Math.max(length, PASSWORD_GENERATOR.MIN_LENGTH),
      PASSWORD_GENERATOR.MAX_LENGTH,
    )

    const randomBuf = randomBytes(clampedLength * 4)
    const view = new DataView(randomBuf.buffer)

    let result = ''
    let i = 0
    while (result.length < clampedLength) {
      const rand = view.getUint32(i % randomBuf.length, true)
      result += charset[rand % charset.length]
      i += 4
    }

    return result
  }
}

export default new PasswordEvaluator()
