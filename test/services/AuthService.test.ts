import * as LocalAuth from 'expo-local-authentication'

jest.mock('react-native/Libraries/Utilities/BackHandler', () => ({
  exitApp: jest.fn(),
}))

describe('AuthService', () => {
  function getAuthService() {
    let AuthService: typeof import('../../src/services/AuthService').default
    jest.isolateModules(() => {
      AuthService = require('../../src/services/AuthService').default
    })
    return AuthService!
  }

  function getBackHandler() {
    return require('react-native/Libraries/Utilities/BackHandler')
  }

  beforeEach(() => {
    getBackHandler().exitApp.mockClear()
    ;(LocalAuth.hasHardwareAsync as jest.Mock).mockResolvedValue(true)
    ;(LocalAuth.isEnrolledAsync as jest.Mock).mockResolvedValue(true)
  })

  describe('isAuthenticated / lock', () => {
    it('初期状態では未認証', () => {
      const auth = getAuthService()
      expect(auth.isAuthenticated()).toBe(false)
    })

    it('lock()で認証状態がfalseになる', () => {
      const auth = getAuthService()
      auth.lock()
      expect(auth.isAuthenticated()).toBe(false)
    })
  })

  describe('biometricAuth', () => {
    it('生体認証成功でsuccessを返しisAuthenticatedがtrueになる', async () => {
      ;(LocalAuth.authenticateAsync as jest.Mock).mockResolvedValueOnce({ success: true })
      const auth = getAuthService()
      const result = await auth.biometricAuth('unlock')
      expect(result).toBe('success')
      expect(auth.isAuthenticated()).toBe(true)
    })

    it('ハードウェアがない場合はunavailableを返す', async () => {
      ;(LocalAuth.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(false)
      const auth = getAuthService()
      const result = await auth.biometricAuth('unlock')
      expect(result).toBe('unavailable')
    })

    it('生体認証失敗でfailureを返す', async () => {
      ;(LocalAuth.authenticateAsync as jest.Mock).mockResolvedValueOnce({ success: false, error: 'UserCancel' })
      const auth = getAuthService()
      const result = await auth.biometricAuth('unlock')
      expect(result).toBe('failure')
    })

    it('3回失敗するとexitAppが呼ばれる', async () => {
      ;(LocalAuth.authenticateAsync as jest.Mock).mockResolvedValue({ success: false, error: 'UserCancel' })
      const auth = getAuthService()
      await auth.biometricAuth('unlock')
      await auth.biometricAuth('unlock')
      await auth.biometricAuth('unlock')
      expect(getBackHandler().exitApp).toHaveBeenCalled()
    })
  })

  describe('checkTimeout', () => {
    it('未認証状態ではfalseを返す', () => {
      const auth = getAuthService()
      expect(auth.checkTimeout()).toBe(false)
    })
  })

  describe('onAppBackground', () => {
    it('バックグラウンドに移行するとロックされる', async () => {
      ;(LocalAuth.authenticateAsync as jest.Mock).mockResolvedValueOnce({ success: true })
      const auth = getAuthService()
      await auth.biometricAuth('unlock')
      expect(auth.isAuthenticated()).toBe(true)
      auth.onAppBackground()
      expect(auth.isAuthenticated()).toBe(false)
    })
  })
})
