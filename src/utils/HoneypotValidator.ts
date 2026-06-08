import type { HoneypotForm } from '../types'

const HONEYPOT_FIELDS = ['email_confirm', 'website'] as const

class HoneypotValidator {
  validate(form: HoneypotForm): boolean {
    for (const field of HONEYPOT_FIELDS) {
      const value = form[field]
      if (value !== undefined && value !== '') {
        return false
      }
    }
    return true
  }
}

export default new HoneypotValidator()
