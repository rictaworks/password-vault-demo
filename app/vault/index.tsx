import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { FontAwesome } from '@expo/vector-icons'
import { useAppContext } from '../../src/context/AppContext'
import CredentialRepository from '../../src/repositories/CredentialRepository'
import SessionManager from '../../src/services/SessionManager'
import AuthService from '../../src/services/AuthService'
import { t } from '../../src/i18n'
import { CATEGORIES } from '../../src/config/constants'
import type { EntryRow, Category } from '../../src/types'

const STRENGTH_COLORS: Record<string, string> = {
  weak: '#ef4444',
  medium: '#f59e0b',
  strong: '#22c55e',
  excellent: '#7c3aed',
}

export default function VaultIndex() {
  const router = useRouter()
  const { setAuthenticated } = useAppContext()

  const [entries, setEntries] = useState<EntryRow[]>([])
  const [query, setQuery] = useState('')
  const [selectedCat, setSelectedCat] = useState<Category | ''>('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const sid = SessionManager.getSessionId()
      const rows = await CredentialRepository.list(
        sid,
        query || undefined,
        selectedCat || undefined,
      )
      setEntries(rows)
    } catch (err) {
      console.error('[VaultIndex] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [query, selectedCat])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  function handleLock() {
    AuthService.lock()
    setAuthenticated(false)
  }

  function renderItem({ item }: { item: EntryRow }) {
    const strengthColor = STRENGTH_COLORS[item.strength] ?? '#9ca3af'
    const catLabel =
      t.categories[item.category as keyof typeof t.categories] ?? item.category

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/vault/${item.id}`)}
      >
        <View style={styles.cardLeft}>
          <FontAwesome name="key" size={18} color="#7c3aed" />
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.serviceName}</Text>
            <Text style={styles.cardSub}>{catLabel}</Text>
          </View>
        </View>
        <View style={[styles.strengthDot, { backgroundColor: strengthColor }]} />
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>{t.vault.title}</Text>
        <TouchableOpacity onPress={handleLock} style={styles.lockBtn}>
          <FontAwesome name="lock" size={18} color="#9ca3af" />
          <Text style={styles.lockText}>{t.vault.lock}</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder={t.vault.searchPlaceholder}
        placeholderTextColor="#6b7280"
        value={query}
        onChangeText={(v) => { setQuery(v); AuthService.resetTimer() }}
        returnKeyType="search"
      />

      <View style={styles.catBar}>
        <TouchableOpacity
          style={[styles.catChip, !selectedCat && styles.catChipActive]}
          onPress={() => setSelectedCat('')}
        >
          <Text style={[styles.catText, !selectedCat && styles.catTextActive]}>
            {t.vault.allCategories}
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, selectedCat === cat && styles.catChipActive]}
            onPress={() => setSelectedCat(selectedCat === cat ? '' : cat)}
          >
            <Text
              style={[
                styles.catText,
                selectedCat === cat && styles.catTextActive,
              ]}
            >
              {t.categories[cat as keyof typeof t.categories] ?? cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!loading && entries.length === 0 ? (
        <View style={styles.empty}>
          <FontAwesome name="folder-open-o" size={48} color="#374151" />
          <Text style={styles.emptyText}>{t.vault.empty}</Text>
          <Text style={styles.emptyHint}>{t.vault.emptyHint}</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onScrollBeginDrag={() => AuthService.resetTimer()}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/vault/add')}
      >
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f9fafb',
  },
  lockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  searchInput: {
    backgroundColor: '#1f1f3a',
    color: '#f9fafb',
    borderRadius: 10,
    margin: 16,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#374151',
  },
  catBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  catChip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  list: {
    padding: 16,
    gap: 10,
  },
  card: {
    backgroundColor: '#1f1f3a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardInfo: {
    gap: 2,
  },
  cardTitle: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '600',
  },
  cardSub: {
    color: '#9ca3af',
    fontSize: 13,
  },
  strengthDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyHint: {
    color: '#4b5563',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: '#7c3aed',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
})
