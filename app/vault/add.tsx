import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { FontAwesome } from '@expo/vector-icons'
import { useAppContext } from '../../src/context/AppContext'
import CredentialRepository from '../../src/repositories/CredentialRepository'
import SessionManager from '../../src/services/SessionManager'
import AuthService from '../../src/services/AuthService'
import PasswordEvaluator from '../../src/utils/PasswordEvaluator'
import HoneypotValidator from '../../src/utils/HoneypotValidator'
import { t } from '../../src/i18n'
import { CATEGORIES } from '../../src/config/constants'
import type { Category, StrengthResult } from '../../src/types'

const STRENGTH_COLORS: Record<string, string> = {
  weak: '#ef4444',
  medium: '#f59e0b',
  strong: '#22c55e',
  excellent: '#7c3aed',
}

export default function AddEntry() {
  const router = useRouter()
  useAppContext()

  const [serviceName, setServiceName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [memo, setMemo] = useState('')
  const [category, setCategory] = useState<Category>('ウェブ')
  const [strengthResult, setStrengthResult] = useState<StrengthResult | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const honeypotRef = useRef({ email_confirm: '', website: '' })

  function handlePasswordChange(v: string) {
    AuthService.resetTimer()
    setPassword(v)
    if (v.length > 0) {
      setStrengthResult(PasswordEvaluator.evaluate(v))
    } else {
      setStrengthResult(null)
    }
  }

  async function handleSave() {
    setErrorMsg('')
    if (!serviceName.trim() || !password.trim()) {
      setErrorMsg(t.add.errorRequired)
      return
    }
    if (!HoneypotValidator.validate(honeypotRef.current)) {
      return
    }
    setSaving(true)
    try {
      const sid = SessionManager.getSessionId()
      await CredentialRepository.create(
        {
          serviceName: serviceName.trim(),
          username: username.trim() || undefined,
          password: password.trim(),
          memo: memo.trim() || undefined,
          category,
        },
        sid,
      )
      router.back()
    } catch (err) {
      console.error('[AddEntry] save error:', err)
      setErrorMsg(t.add.errorSave)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="arrow-left" size={20} color="#9ca3af" />
        </TouchableOpacity>
        <Text style={styles.title}>{t.add.title}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

        <Text style={styles.label}>{t.add.serviceNameLabel}</Text>
        <TextInput
          style={styles.input}
          placeholder={t.add.serviceNamePlaceholder}
          placeholderTextColor="#6b7280"
          value={serviceName}
          onChangeText={(v) => { setServiceName(v); AuthService.resetTimer() }}
          autoCapitalize="none"
        />

        <Text style={styles.label}>{t.add.usernameLabel}</Text>
        <TextInput
          style={styles.input}
          placeholder={t.add.usernamePlaceholder}
          placeholderTextColor="#6b7280"
          value={username}
          onChangeText={(v) => { setUsername(v); AuthService.resetTimer() }}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>{t.add.passwordLabel}</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder={t.add.passwordPlaceholder}
            placeholderTextColor="#6b7280"
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword((v) => !v)}
          >
            <FontAwesome
              name={showPassword ? 'eye-slash' : 'eye'}
              size={18}
              color="#9ca3af"
            />
          </TouchableOpacity>
        </View>

        {strengthResult && (
          <View style={styles.strengthBar}>
            <View
              style={[
                styles.strengthFill,
                {
                  width: `${strengthResult.score}%`,
                  backgroundColor: STRENGTH_COLORS[strengthResult.strength],
                },
              ]}
            />
            <Text
              style={[
                styles.strengthLabel,
                { color: STRENGTH_COLORS[strengthResult.strength] },
              ]}
            >
              {t.strength[strengthResult.strength]}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.generateBtn}
          onPress={() => router.push('/vault/generate')}
        >
          <FontAwesome name="magic" size={14} color="#7c3aed" />
          <Text style={styles.generateBtnText}>{t.add.generateButton}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>{t.add.categoryLabel}</Text>
        <View style={styles.catGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, category === cat && styles.catChipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text
                style={[
                  styles.catText,
                  category === cat && styles.catTextActive,
                ]}
              >
                {t.categories[cat as keyof typeof t.categories] ?? cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t.add.memoLabel}</Text>
        <TextInput
          style={[styles.input, styles.memoInput]}
          placeholder={t.add.memoPlaceholder}
          placeholderTextColor="#6b7280"
          value={memo}
          onChangeText={(v) => { setMemo(v); AuthService.resetTimer() }}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Honeypot: hidden fields for bot detection */}
        <TextInput
          style={styles.honeypot}
          value={honeypotRef.current.email_confirm}
          onChangeText={(v) => { honeypotRef.current.email_confirm = v }}
          tabIndex={-1}
          aria-hidden
          autoComplete="off"
          importantForAutofill="no"
        />
        <TextInput
          style={styles.honeypot}
          value={honeypotRef.current.website}
          onChangeText={(v) => { honeypotRef.current.website = v }}
          tabIndex={-1}
          aria-hidden
          autoComplete="off"
          importantForAutofill="no"
        />

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{t.add.saveButton}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>{t.add.cancelButton}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f9fafb',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  error: {
    color: '#f87171',
    marginBottom: 12,
    fontSize: 14,
  },
  label: {
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1f1f3a',
    color: '#f9fafb',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#374151',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    padding: 4,
  },
  strengthBar: {
    marginTop: 8,
    height: 6,
    backgroundColor: '#1f1f3a',
    borderRadius: 3,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthLabel: {
    position: 'absolute',
    right: 0,
    fontSize: 11,
    fontWeight: '600',
    top: -18,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 6,
  },
  generateBtnText: {
    color: '#7c3aed',
    fontSize: 14,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1f1f3a',
    borderWidth: 1,
    borderColor: '#374151',
  },
  catChipActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  catText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  catTextActive: {
    color: '#fff',
  },
  memoInput: {
    height: 80,
    paddingTop: 12,
  },
  honeypot: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
  saveBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    alignItems: 'center',
    padding: 12,
    marginTop: 8,
  },
  cancelBtnText: {
    color: '#6b7280',
    fontSize: 15,
  },
})
