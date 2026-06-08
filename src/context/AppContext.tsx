import React, { createContext, useContext } from 'react'
import type { SQLiteDatabase } from 'expo-sqlite'

interface AppContextValue {
  db: SQLiteDatabase | null
  isAuthenticated: boolean
  setAuthenticated: (v: boolean) => void
}

const AppContext = createContext<AppContextValue>({
  db: null,
  isAuthenticated: false,
  setAuthenticated: () => undefined,
})

interface AppProviderProps {
  db: SQLiteDatabase | null
  isAuthenticated: boolean
  setAuthenticated: (v: boolean) => void
  children: React.ReactNode
}

export function AppProvider({
  db,
  isAuthenticated,
  setAuthenticated,
  children,
}: AppProviderProps) {
  return (
    <AppContext.Provider value={{ db, isAuthenticated, setAuthenticated }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext(): AppContextValue {
  return useContext(AppContext)
}
