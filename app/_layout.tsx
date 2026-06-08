import React, { useEffect, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { Stack } from 'expo-router'
import { openDatabaseAsync } from 'expo-sqlite'
import { AppProvider } from '../src/context/AppContext'
import { initializeSchema } from '../src/db/schema'
import SessionManager from '../src/services/SessionManager'
import CryptoService from '../src/services/CryptoService'
import AuthService from '../src/services/AuthService'
import ResetScheduler from '../src/services/ResetScheduler'
import CredentialRepository from '../src/repositories/CredentialRepository'
import { DB } from '../src/config/constants'
import type { SQLiteDatabase } from 'expo-sqlite'

const IS_DEV = process.env.NODE_ENV === 'development'

export default function RootLayout() {
  const [db, setDb] = useState<SQLiteDatabase | null>(null)
  const [authenticated, setAuthenticated] = useState(IS_DEV)

  useEffect(() => {
    async function init() {
      const database = await openDatabaseAsync(DB.NAME)
      await initializeSchema(database)
      await SessionManager.initialize()
      await CryptoService.getOrCreateKey()
      CredentialRepository.setDb(database)
      ResetScheduler.start(database)
      setDb(database)
    }
    init().catch((err) => console.error('[RootLayout] init error:', err))
  }, [])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        if (!IS_DEV) {
          AuthService.onAppBackground()
          setAuthenticated(false)
        }
      }
      if (state === 'active') {
        AuthService.resetTimer()
      }
    })
    return () => sub.remove()
  }, [])

  useEffect(() => {
    if (!authenticated) return
    const interval = setInterval(() => {
      const timedOut = AuthService.checkTimeout()
      if (timedOut) setAuthenticated(false)
    }, 15_000)
    return () => clearInterval(interval)
  }, [authenticated])

  return (
    <AppProvider db={db} isAuthenticated={authenticated} setAuthenticated={setAuthenticated}>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProvider>
  )
}
