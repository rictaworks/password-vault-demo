import * as SecureStore from 'expo-secure-store'
import SessionManager from '../../src/services/SessionManager'

describe('SessionManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    SessionManager.clear()
    ;(SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null)
    ;(SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined)
  })

  it('初回呼び出しで新しいsession_idを生成しSecureStoreに保存する', async () => {
    const sid = await SessionManager.initialize()
    expect(sid).toMatch(/^test-uuid-/)
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1)
  })

  it('2回目の呼び出しでは既存のsession_idを返す', async () => {
    ;(SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('existing-session-id')
    const sid = await SessionManager.initialize()
    expect(sid).toBe('existing-session-id')
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled()
  })

  it('初期化前にgetSessionIdを呼ぶとエラーをスローする', () => {
    expect(() => SessionManager.getSessionId()).toThrow('SessionManager: not initialized')
  })

  it('初期化後にgetSessionIdが正しい値を返す', async () => {
    await SessionManager.initialize()
    const sid = SessionManager.getSessionId()
    expect(sid).toMatch(/^test-uuid-/)
  })

  it('clearを呼ぶとgetSessionIdがエラーをスローする', async () => {
    await SessionManager.initialize()
    SessionManager.clear()
    expect(() => SessionManager.getSessionId()).toThrow('SessionManager: not initialized')
  })
})
