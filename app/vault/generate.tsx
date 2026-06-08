import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { FontAwesome } from '@expo/vector-icons'
import PasswordEvaluator from '../../src/utils/PasswordEvaluator'
import { t } from '../../src/i18n'
import { PASSWORD_GENERATOR, CLIPBOARD } from '../../src/config/constants'
import type { StrengthResult } from '../../src/types'

const STRENGTH_COLORS: Record<string, string> = {
  weak: '#ef4444',
  medium: '#f59e0b',
  strong: '#22c55e',
  excellent: '#7c3aed',
}

const LENGTH_OPTIONS = [8, 12, 16, 20, 24, 32]

export default function GenerateScreen() {
  const router = useRouter()

  const [length, setLength] = useState(PASSWORD_GENERATOR.DEFAULT_LENGTH)
  const [upper, setUpper] = useState(true)
  const [lower, setLower] = useState(true)
  const [digits, setDigits] = useState(true)
  const [symbols, setSymbols] = useState(false)
  const [generated, setGenerated] = useState('')
  const [strengthResult, setStrengthResult] = useState<StrengthResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  function handleGenerate() {
    setErrorMsg('')
    if (!upper && !lower && !digits && !symbols) {
      setErrorMsg(t.generate.errorOptions)
      return
    }
    try {
      const pw = PasswordEvaluator.generate({ length, upper, lower, digits, symbols })
      setGenerated(pw)
      setStrengthResult(PasswordEvaluator.evaluate(pw))
    } catch (err) {
      setErrorMsg(t.generate.errorOptions)
    }
  }

  async function handleCopy() {
    if (!generated) return
    await Clipboard.setStringAsync(generated)
    setCopied(true)
    setTimeout(async () => {
      await Clipboard.setStringAsync('')
      setCopied(false)
    }, CLIPBOARD.CLEAR_DELAY_MS)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="arrow-left" size={20} color="#9ca3af" />
        </TouchableOpacity>
        <Text style={styles.title}>{t.generate.title}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

        <Text style={styles.sectionLabel}>{t.generate.lengthLabel}</Text>
        <View style={styles.lengthOptions}>
          {LENGTH_OPTIONS.map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.lenChip, length === l && styles.lenChipActive]}
              onPress={() => setLength(l)}
            >
              <Text style={[styles.lenText, length === l && styles.lenTextActive]}>
                {l}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>{t.generate.uppercase}</Text>
          <Switch
            value={upper}
            onValueChange={setUpper}
            trackColor={{ false: '#374151', true: '#7c3aed' }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>{t.generate.lowercase}</Text>
          <Switch
            value={lower}
            onValueChange={setLower}
            trackColor={{ false: '#374151', true: '#7c3aed' }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>{t.generate.digits}</Text>
          <Switch
            value={digits}
            onValueChange={setDigits}
            trackColor={{ false: '#374151', true: '#7c3aed' }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>{t.generate.symbols}</Text>
          <Switch
            value={symbols}
            onValueChange={setSymbols}
            trackColor={{ false: '#374151', true: '#7c3aed' }}
            thumbColor="#fff"
          />
        </View>

        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
          <FontAwesome name="magic" size={16} color="#fff" />
          <Text style={styles.generateBtnText}>{t.generate.generate}</Text>
        </TouchableOpacity>

        {generated ? (
          <View style={styles.resultBox}>
            <Text style={styles.generatedText} selectable>
              {generated}
            </Text>
            {strengthResult && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBarBg}>
                  <View
                    style={[
                      styles.strengthBarFill,
                      {
                        width: `${strengthResult.score}%`,
                        backgroundColor: STRENGTH_COLORS[strengthResult.strength],
                      },
                    ]}
                  />
                </View>
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
            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                <FontAwesome name="copy" size={14} color="#7c3aed" />
                <Text style={styles.copyBtnText}>
                  {copied ? t.generate.copied : t.generate.copy}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>
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
  title: { fontSize: 20, fontWeight: 'bold', color: '#f9fafb' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  error: { color: '#f87171', marginBottom: 12, fontSize: 14 },
  sectionLabel: {
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lengthOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  lenChip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1f1f3a',
    borderWidth: 1,
    borderColor: '#374151',
  },
  lenChipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  lenText: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  lenTextActive: { color: '#fff' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f3a',
  },
  optionLabel: { color: '#f9fafb', fontSize: 15 },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  generateBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resultBox: {
    marginTop: 24,
    backgroundColor: '#1f1f3a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
    gap: 16,
  },
  generatedText: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS !== 'web' ? 'monospace' : undefined,
    letterSpacing: 1,
    textAlign: 'center',
  },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  strengthBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthBarFill: { height: '100%', borderRadius: 3 },
  strengthLabel: { fontSize: 12, fontWeight: '600', width: 50, textAlign: 'right' },
  resultActions: { flexDirection: 'row', justifyContent: 'center' },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f0f23',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  copyBtnText: { color: '#7c3aed', fontSize: 14, fontWeight: '600' },
})
