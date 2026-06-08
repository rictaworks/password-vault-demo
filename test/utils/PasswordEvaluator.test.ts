import PasswordEvaluator from '../../src/utils/PasswordEvaluator'

describe('PasswordEvaluator.evaluate', () => {
  it('短すぎるパスワードはweakと評価する', () => {
    const result = PasswordEvaluator.evaluate('abc')
    expect(result.strength).toBe('weak')
    expect(result.score).toBe(0)
    expect(result.feedback).toContain('tooShort')
  })

  it('一般的なパスワードはweakと評価する', () => {
    const result = PasswordEvaluator.evaluate('password')
    expect(result.strength).toBe('weak')
    expect(result.feedback).toContain('isCommon')
  })

  it('数字のみのパスワードはmedium未満と評価する', () => {
    const result = PasswordEvaluator.evaluate('12345678')
    expect(['weak', 'medium']).toContain(result.strength)
    expect(result.feedback).toContain('noUpper')
    expect(result.feedback).toContain('noLower')
    expect(result.feedback).toContain('noSymbol')
  })

  it('大小英数字記号を含む長いパスワードはstrongまたはexcellentと評価する', () => {
    const result = PasswordEvaluator.evaluate('Tr0ub4dor&3Pass!')
    expect(['strong', 'excellent']).toContain(result.strength)
  })

  it('連続文字を含むパスワードはhasSequentialフィードバックを持つ', () => {
    const result = PasswordEvaluator.evaluate('Abcdefgh1!')
    expect(result.feedback).toContain('hasSequential')
  })

  it('scoreは0〜100の範囲に収まる', () => {
    const passwords = ['a', '12345678', 'Password1!', 'Tr0ub4dor&3Pass!!!!!!!!!!!!!!!!']
    passwords.forEach((pw) => {
      const result = PasswordEvaluator.evaluate(pw)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })
  })
})

describe('PasswordEvaluator.generate', () => {
  it('指定した長さのパスワードを生成する', () => {
    const pw = PasswordEvaluator.generate({ length: 20, upper: true, lower: true, digits: true, symbols: false })
    expect(pw.length).toBe(20)
  })

  it('大文字のみのオプションで大文字のみを生成する', () => {
    const pw = PasswordEvaluator.generate({ length: 16, upper: true, lower: false, digits: false, symbols: false })
    expect(pw).toMatch(/^[A-Z]+$/)
  })

  it('文字種が0件の場合はエラーをスローする', () => {
    expect(() =>
      PasswordEvaluator.generate({ length: 16, upper: false, lower: false, digits: false, symbols: false })
    ).toThrow()
  })

  it('生成されたパスワードが異なることを確認する（CSPRNG確認）', () => {
    const pw1 = PasswordEvaluator.generate({ length: 16, upper: true, lower: true, digits: true, symbols: true })
    const pw2 = PasswordEvaluator.generate({ length: 16, upper: true, lower: true, digits: true, symbols: true })
    expect(pw1).not.toBe(pw2)
  })

  it('最小・最大長のクランプが機能する', () => {
    const tooShort = PasswordEvaluator.generate({ length: 1, upper: true, lower: true, digits: true, symbols: false })
    const tooLong = PasswordEvaluator.generate({ length: 999, upper: true, lower: true, digits: true, symbols: false })
    expect(tooShort.length).toBe(8)
    expect(tooLong.length).toBe(64)
  })
})
