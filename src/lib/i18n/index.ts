import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import en from './locales/en.json';
import ar from './locales/ar.json';

const STORAGE_KEY = 'app_language';    

// Walk the device's preferred languages and pick the first one we support.
// getLocales() is ordered most-preferred-first and never empty[reference:1].
const pickDeviceLanguage = (): 'en' | 'ar' => {
  const preferred = getLocales();
  for (const locale of preferred) {
    if (locale.languageCode === 'ar') return 'ar';
    if (locale.languageCode === 'en') return 'en';
  }
  return 'en'; // fallback
};

const init = async () => {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  const language = (stored as 'en' | 'ar' | null) ?? pickDeviceLanguage();

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: language,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    // keySeparator stays default ('.') so `t('profile.title')` works as expected
  });

  // Force RTL direction based on the language we just picked.
  // If the direction changed, the next render after restart will be RTL.
  const shouldBeRTL = language === 'ar';
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.forceRTL(shouldBeRTL);
    I18nManager.allowRTL(shouldBeRTL);
  }
};

init();       // call once

export default i18n;
