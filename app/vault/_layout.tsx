import React, { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { useAppContext } from '../../src/context/AppContext'

export default function VaultLayout() {
  const { isAuthenticated } = useAppContext()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated])

  return <Stack screenOptions={{ headerShown: false }} />
}
