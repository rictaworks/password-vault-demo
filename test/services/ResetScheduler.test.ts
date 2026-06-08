describe('ResetScheduler', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  function getScheduler() {
    let ResetScheduler: typeof import('../../src/services/ResetScheduler').default
    jest.isolateModules(() => {
      ResetScheduler = require('../../src/services/ResetScheduler').default
    })
    return ResetScheduler!
  }

  it('startを呼ぶとタイマーが設定される', () => {
    const mockDb = {
      runAsync: jest.fn().mockResolvedValue({ changes: 5, lastInsertRowId: 0 }),
      execAsync: jest.fn().mockResolvedValue(undefined),
    }
    const scheduler = getScheduler()
    scheduler.start(mockDb as any)
    scheduler.stop()
  })

  it('runResetでDBから削除処理が実行される', async () => {
    const mockDb = {
      runAsync: jest.fn().mockResolvedValue({ changes: 3, lastInsertRowId: 0 }),
      execAsync: jest.fn().mockResolvedValue(undefined),
    }
    const scheduler = getScheduler()
    scheduler.start(mockDb as any)
    await scheduler.runReset()
    expect(mockDb.runAsync).toHaveBeenCalled()
    expect(mockDb.execAsync).toHaveBeenCalledWith('VACUUM')
    scheduler.stop()
  })

  it('runResetでreset_logに記録される', async () => {
    const mockDb = {
      runAsync: jest.fn().mockResolvedValue({ changes: 2, lastInsertRowId: 1 }),
      execAsync: jest.fn().mockResolvedValue(undefined),
    }
    const scheduler = getScheduler()
    scheduler.start(mockDb as any)
    await scheduler.runReset()
    const calls = (mockDb.runAsync as jest.Mock).mock.calls as Array<[string, ...unknown[]]>
    const insertCall = calls.find((c) => c[0].includes('INSERT INTO reset_log'))
    expect(insertCall).toBeDefined()
    scheduler.stop()
  })
})
