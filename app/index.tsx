import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { FontAwesome } from '@expo/vector-icons'
import { useAppContext } from '../src/context/AppContext'
import AuthService from '../src/services/AuthService'
import { t } from '../src/i18n'
import { AUTH } from '../src/config/constants'

const IS_DEV = process.env.NODE_ENV === 'development'

export default function LockScreen() {
  const router = useRouter()
  const { isAuthenticated, setAuthenticated } = useAppContext()

  const [showMasterPw, setShowMasterPw] = useState(false)
  const [masterPwInput, setMasterPwInput] = useState('')
  const [failureCount, setFailureCount] = useState(0)
  const [message, setMessage] = useState('')
  const [lockedOut, setLockedOut] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/vault')
    }
  }, [isAuthenticated])

  async function handleBiometric() {
    if (lockedOut) return
    const result = await AuthService.biometricAuth('unlock')
    if (result === 'success') {
      setAuthenticated(true)
    } else if (result === 'unavailable') {
      setShowMasterPw(true)
      setMessage(t.lock.biometricUnavailable)
    } else {
      const next = failureCount + 1
      setFailureCount(next)
      setMessage(t.lock.failureMessage(next, AUTH.MAX_FAILURES))
      if (next >= AUTH.MAX_FAILURES) {
        setLockedOut(true)
        setMessage(t.lock.lockedOut)
      }
    }
  }

  async function handleMasterPassword() {
    if (!masterPwInput.trim()) return
    const result = await AuthService.masterPasswordAuth(masterPwInput)
    setMasterPwInput('')
    if (result === 'success') {
      setAuthenticated(true)
    } else {
      const next = failureCount + 1
      setFailureCount(next)
      setMessage(t.lock.failureMessage(next, AUTH.MAX_FAILURES))
      if (next >= AUTH.MAX_FAILURES) {
        setLockedOut(true)
        setMessage(t.lock.lockedOut)
      }
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <FontAwesome name="lock" size={64} color="#7c3aed" />
        <Text style={styles.title}>{t.lock.title}</Text>
        <Text style={styles.subtitle}>{t.lock.subtitle}</Text>
      </View>

      {IS_DEV && (
        <View style={styles.devBanner}>
          <Text style={styles.devText}>DEV MODE</Text>
        </View>
      )}

      {message ? (
        <Text style={styles.message}>{message}</Text>
      ) : null}

      {!lockedOut && !showMasterPw && (
        <TouchableOpacity style={styles.primaryButton} onPress={handleBiometric}>
          <FontAwesome name="hand-o-up" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>{t.lock.biometricButton}</Text>
        </TouchableOpacity>
      )}

      {!lockedOut && (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setShowMasterPw((v) => !v)}
        >
          <Text style={styles.secondaryButtonText}>{t.lock.masterPasswordButton}</Text>
        </TouchableOpacity>
      )}

      {!lockedOut && showMasterPw && (
        <View style={styles.masterPwSection}>
          <TextInput
            style={styles.input}
            placeholder={t.lock.masterPasswordPlaceholder}
            placeholderTextColor="#6b7280"
            secureTextEntry
            value={masterPwInput}
            onChangeText={setMasterPwInput}
            autoFocus
            onSubmitEditing={handleMasterPassword}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleMasterPassword}
          >
            <Text style={styles.primaryButtonText}>{t.lock.masterPasswordSubmit}</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f9fafb',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  devBanner: {
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  devText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  message: {
    color: '#f87171',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 10,
    marginBottom: 12,
    width: '100%',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 10,
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#7c3aed',
    fontSize: 14,
  },
  masterPwSection: {
    width: '100%',
    gap: 12,
  },
  input: {
    backgroundColor: '#1f1f3a',
    color: '#f9fafb',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
})
