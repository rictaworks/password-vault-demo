import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { FontAwesome } from '@expo/vector-icons'
import { useAppContext } from '../../src/context/AppContext'
import CredentialRepository from '../../src/repositories/CredentialRepository'
import CryptoService from '../../src/services/CryptoService'
import AuthService from '../../src/services/AuthService'
import SessionManager from '../../src/services/SessionManager'
import PasswordEvaluator from '../../src/utils/PasswordEvaluator'
import { t } from '../../src/i18n'
import { CATEGORIES, CLIPBOARD } from '../../src/config/constants'
import type { EntryRow, Category, StrengthResult } from '../../src/types'

const STRENGTH_COLORS: Record<string, string> = {
  weak: '#ef4444',
  medium: '#f59e0b',
  strong: '#22c55e',
  excellent: '#7c3aed',
}

export default function EntryDetail() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  useAppContext()

  const [entry, setEntry] = useState<EntryRow | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [revealedPassword, setRevealedPassword] = useState<string | null>(null)
  const [revealedUsername, setRevealedUsername] = useState<string | null>(null)
  const [strengthResult, setStrengthResult] = useState<StrengthResult | null>(null)

  const [editServiceName, setEditServiceName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editMemo, setEditMemo] = useState('')
  const [editCategory, setEditCategory] = useState<Category>('ウェブ')

  useEffect(() => {
    loadEntry()
  }, [id])

  async function loadEntry() {
    setLoading(true)
    try {
      const sid = SessionManager.getSessionId()
      const row = await CredentialRepository.get(Number(id), sid)
      setEntry(row)
      setEditServiceName(row.serviceName)
      setEditCategory(row.category)
    } catch (err) {
      console.error('[EntryDetail] load error:', err)
      setErrorMsg(t.detail.errorLoad)
    } finally {
      setLoading(false)
    }
  }

  async function handleRevealPassword() {
    if (revealedPassword !== null) {
      setRevealedPassword(null)
      return
    }
    const result = await AuthService.biometricAuth('view')
    if (result !== 'success') {
      setErrorMsg(t.detail.errorAuth)
      return
    }
    if (!entry) return
    try {
      const plain = await CryptoService.decrypt(entry.passwordEnc)
      setRevealedPassword(plain)
      setStrengthResult(PasswordEvaluator.evaluate(plain))
      setEditPassword(plain)
    } catch (err) {
      console.error('[EntryDetail] decrypt pw error:', err)
      setErrorMsg(t.detail.errorLoad)
    }
  }

  async function handleRevealUsername() {
    if (!entry?.usernameEnc) return
    if (revealedUsername !== null) {
      setRevealedUsername(null)
      return
    }
    try {
      const plain = await CryptoService.decrypt(entry.usernameEnc)
      setRevealedUsername(plain)
      setEditUsername(plain)
    } catch (err) {
      console.error('[EntryDetail] decrypt username error:', err)
      setErrorMsg(t.detail.errorLoad)
    }
  }

  function scheduleClipboardClear(clipboardTimer: ReturnType<typeof setTimeout> | null) {
    if (clipboardTimer) clearTimeout(clipboardTimer)
    return setTimeout(async () => {
      await Clipboard.setStringAsync('')
    }, CLIPBOARD.CLEAR_DELAY_MS)
  }

  let clipboardTimer: ReturnType<typeof setTimeout> | null = null

  async function handleCopyPassword() {
    if (!revealedPassword) {
      const result = await AuthService.biometricAuth('view')
      if (result !== 'success') {
        setErrorMsg(t.detail.errorAuth)
        return
      }
      if (!entry) return
      const plain = await CryptoService.decrypt(entry.passwordEnc)
      await Clipboard.setStringAsync(plain)
    } else {
      await Clipboard.setStringAsync(revealedPassword)
    }
    clipboardTimer = scheduleClipboardClear(clipboardTimer)
    setStatusMsg(t.detail.copied)
    setTimeout(() => setStatusMsg(''), CLIPBOARD.CLEAR_DELAY_MS)
  }

  async function handleCopyUsername() {
    const username = revealedUsername ?? ''
    if (!username && entry?.usernameEnc) {
      const plain = await CryptoService.decrypt(entry.usernameEnc)
      await Clipboard.setStringAsync(plain)
    } else {
      await Clipboard.setStringAsync(username)
    }
    clipboardTimer = scheduleClipboardClear(clipboardTimer)
    setStatusMsg(t.detail.copied)
    setTimeout(() => setStatusMsg(''), CLIPBOARD.CLEAR_DELAY_MS)
  }

  async function handleSave() {
    if (!entry) return
    setErrorMsg('')
    try {
      const sid = SessionManager.getSessionId()
      await CredentialRepository.update(entry.id, sid, {
        serviceName: editServiceName.trim(),
        username: editUsername.trim() || undefined,
        password: editPassword.trim() || undefined,
        memo: editMemo.trim() || undefined,
        category: editCategory,
      })
      setEditing(false)
      setStatusMsg(t.detail.updated)
      setTimeout(() => setStatusMsg(''), 2000)
      await loadEntry()
      setRevealedPassword(null)
      setRevealedUsername(null)
    } catch (err) {
      console.error('[EntryDetail] update error:', err)
      setErrorMsg(t.detail.errorUpdate)
    }
  }

  async function handleDelete() {
    if (!entry) return
    setShowDeleteModal(false)
    try {
      const sid = SessionManager.getSessionId()
      await CredentialRepository.softDelete(entry.id, sid)
      router.back()
    } catch (err) {
      console.error('[EntryDetail] delete error:', err)
      setErrorMsg(t.detail.errorDelete)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>{t.common.loading}</Text>
      </SafeAreaView>
    )
  }

  if (!entry) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{errorMsg || t.detail.errorLoad}</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="arrow-left" size={20} color="#9ca3af" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {entry.serviceName}
        </Text>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => setShowDeleteModal(true)}
        >
          <FontAwesome name="trash" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {statusMsg ? <Text style={styles.status}>{statusMsg}</Text> : null}
      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>{t.detail.serviceNameLabel}</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={editServiceName}
            onChangeText={setEditServiceName}
            placeholderTextColor="#6b7280"
          />
        ) : (
          <Text style={styles.value}>{entry.serviceName}</Text>
        )}

        <Text style={styles.sectionLabel}>{t.detail.categoryLabel}</Text>
        {editing ? (
          <View style={styles.catGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catChip,
                  editCategory === cat && styles.catChipActive,
                ]}
                onPress={() => setEditCategory(cat)}
              >
                <Text
                  style={[
                    styles.catText,
                    editCategory === cat && styles.catTextActive,
                  ]}
                >
                  {t.categories[cat as keyof typeof t.categories] ?? cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.value}>
            {t.categories[entry.category as keyof typeof t.categories] ?? entry.category}
          </Text>
        )}

        {entry.usernameEnc && (
          <>
            <Text style={styles.sectionLabel}>{t.detail.usernameLabel}</Text>
            <View style={styles.revealRow}>
              {editing ? (
                <TextInput
                  style={[styles.input, styles.flexInput]}
                  value={editUsername}
                  onChangeText={setEditUsername}
                  placeholderTextColor="#6b7280"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles.value}>
                  {revealedUsername ?? '••••••••'}
                </Text>
              )}
              {!editing && (
                <>
                  <TouchableOpacity onPress={handleRevealUsername} style={styles.iconBtn}>
                    <FontAwesome
                      name={revealedUsername ? 'eye-slash' : 'eye'}
                      size={16}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleCopyUsername} style={styles.iconBtn}>
                    <FontAwesome name="copy" size={16} color="#7c3aed" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>{t.detail.passwordLabel}</Text>
        <View style={styles.revealRow}>
          {editing ? (
            <TextInput
              style={[styles.input, styles.flexInput]}
              value={editPassword}
              onChangeText={(v) => {
                setEditPassword(v)
                if (v) setStrengthResult(PasswordEvaluator.evaluate(v))
              }}
              placeholderTextColor="#6b7280"
              secureTextEntry
            />
          ) : (
            <Text style={styles.value}>
              {revealedPassword ?? '••••••••••••'}
            </Text>
          )}
          {!editing && (
            <>
              <TouchableOpacity onPress={handleRevealPassword} style={styles.iconBtn}>
                <FontAwesome
                  name={revealedPassword ? 'eye-slash' : 'eye'}
                  size={16}
                  color="#9ca3af"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCopyPassword} style={styles.iconBtn}>
                <FontAwesome name="copy" size={16} color="#7c3aed" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {strengthResult && (
          <Text
            style={[
              styles.strengthLabel,
              { color: STRENGTH_COLORS[strengthResult.strength] },
            ]}
          >
            {t.strength[strengthResult.strength]}
          </Text>
        )}

        {entry.memoEnc && !editing && (
          <>
            <Text style={styles.sectionLabel}>{t.detail.memoLabel}</Text>
            <Text style={styles.value}>{t.common.loading}</Text>
          </>
        )}

        {editing && (
          <>
            <Text style={styles.sectionLabel}>{t.detail.memoLabel}</Text>
            <TextInput
              style={[styles.input, styles.memoInput]}
              value={editMemo}
              onChangeText={setEditMemo}
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </>
        )}

        <View style={styles.metaSection}>
          <Text style={styles.metaText}>
            {t.detail.createdAt}: {entry.createdAt}
          </Text>
          <Text style={styles.metaText}>
            {t.detail.updatedAt}: {entry.updatedAt}
          </Text>
        </View>

        {editing ? (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{t.detail.saveButton}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setEditing(false)}
            >
              <Text style={styles.cancelBtnText}>{t.detail.cancelButton}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setEditing(true)}
          >
            <FontAwesome name="pencil" size={16} color="#fff" />
            <Text style={styles.editBtnText}>{t.detail.editButton}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>{t.detail.confirmDelete}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelText}>{t.detail.deleteNo}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDelete}
                onPress={handleDelete}
              >
                <Text style={styles.modalDeleteText}>{t.detail.deleteYes}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#f9fafb', flex: 1, textAlign: 'center' },
  deleteBtn: { padding: 4 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  status: { color: '#22c55e', textAlign: 'center', marginBottom: 8, fontSize: 14 },
  error: { color: '#f87171', textAlign: 'center', marginBottom: 8, fontSize: 14 },
  loadingText: { color: '#9ca3af', textAlign: 'center', marginTop: 80 },
  errorText: { color: '#f87171', textAlign: 'center', marginTop: 80 },
  sectionLabel: { color: '#9ca3af', fontSize: 12, marginTop: 20, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { color: '#f9fafb', fontSize: 16, paddingVertical: 4 },
  revealRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flexInput: { flex: 1 },
  iconBtn: { padding: 6 },
  input: { backgroundColor: '#1f1f3a', color: '#f9fafb', borderRadius: 10, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#374151', flex: 1 },
  strengthLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  catChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#1f1f3a', borderWidth: 1, borderColor: '#374151' },
  catChipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  catText: { color: '#9ca3af', fontSize: 13 },
  catTextActive: { color: '#fff' },
  memoInput: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  metaSection: { marginTop: 24, gap: 4 },
  metaText: { color: '#4b5563', fontSize: 12 },
  editActions: { marginTop: 28, gap: 12 },
  saveBtn: { backgroundColor: '#7c3aed', borderRadius: 12, padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelBtnText: { color: '#6b7280', fontSize: 15 },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#374151', borderRadius: 12, padding: 14, marginTop: 28 },
  editBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  modalBox: { backgroundColor: '#1f1f3a', borderRadius: 16, padding: 24, width: '80%', gap: 20 },
  modalText: { color: '#f9fafb', fontSize: 16, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, backgroundColor: '#374151', borderRadius: 10, padding: 12, alignItems: 'center' },
  modalCancelText: { color: '#9ca3af', fontSize: 15 },
  modalDelete: { flex: 1, backgroundColor: '#ef4444', borderRadius: 10, padding: 12, alignItems: 'center' },
  modalDeleteText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})
