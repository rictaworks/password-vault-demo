import HoneypotValidator from '../../src/utils/HoneypotValidator'

describe('HoneypotValidator.validate', () => {
  it('すべてのハニーポットフィールドが空なら true を返す', () => {
    expect(HoneypotValidator.validate({})).toBe(true)
    expect(HoneypotValidator.validate({ email_confirm: '', website: '' })).toBe(true)
  })

  it('email_confirm が入力されていれば false を返す', () => {
    expect(HoneypotValidator.validate({ email_confirm: 'bot@example.com' })).toBe(false)
  })

  it('website が入力されていれば false を返す', () => {
    expect(HoneypotValidator.validate({ website: 'https://example.com' })).toBe(false)
  })

  it('いずれかのフィールドが入力されていれば false を返す', () => {
    expect(
      HoneypotValidator.validate({ email_confirm: 'x', website: 'y' }),
    ).toBe(false)
  })
})
