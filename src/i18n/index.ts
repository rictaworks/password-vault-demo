import { getLocales } from 'expo-localization'
import ja from './ja'
import en from './en'
import fr from './fr'
import zh from './zh'
import ru from './ru'
import es from './es'
import ar from './ar'
import type { Translations } from './ja'

const translations: Record<string, Translations> = {
  ja,
  en,
  fr,
  zh,
  ru,
  es,
  ar,
}

function buildTranslation(): Translations {
  const locales = getLocales()
  const code = locales[0]?.languageCode ?? 'en'
  return translations[code] ?? translations.en
}

export const t: Translations = buildTranslation()
