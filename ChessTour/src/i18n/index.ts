import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../storage/keys';
import type { LanguageCode } from '../types';

import en from '../../locales/en.json';
import ru from '../../locales/ru.json';
import uz from '../../locales/uz.json';

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  uz: { translation: uz },
};

/** Default language when none stored: always Uzbek */
function getDefaultLanguage(): LanguageCode {
  return 'uz';
}

export async function getStoredLanguage(): Promise<LanguageCode> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (stored === 'en' || stored === 'ru' || stored === 'uz') return stored;
  } catch {}
  return getDefaultLanguage();
}

export async function setStoredLanguage(code: LanguageCode): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, code);
  i18n.changeLanguage(code);
}

export async function initI18n(lng: LanguageCode): Promise<typeof i18n> {
  await i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
  return i18n;
}
