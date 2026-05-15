import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { I18nManager } from 'react-native';
import { storage } from '~/utils/storage';
import { STORAGE_KEYS, APP_CONFIG } from '~/constants/config';
import enTranslations from '~/constants/translations/en.json';
import arTranslations from '~/constants/translations/ar.json';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (path: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  isArabic: boolean;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, any> = {
  en: enTranslations,
  ar: arTranslations,
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(APP_CONFIG.DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Initialize ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      // Load language preference
      const cachedLang = await storage.getItem(STORAGE_KEYS.USER_LANGUAGE);
      if (cachedLang === 'en' || cachedLang === 'ar') {
        const lang = cachedLang as Language;
        applyRTL(lang);
        setLanguageState(lang);
      }
      setIsLoading(false);
    };

    init();
  }, []);

  // ─── RTL Application ──────────────────────────────────────────────────────────
  const applyRTL = useCallback((lang: Language) => {
    const shouldBeRTL = lang === 'ar';
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);
    }
  }, []);

  const setLanguage = useCallback(
    async (newLang: Language): Promise<void> => {
      if (newLang === language) return;

      applyRTL(newLang);
      setLanguageState(newLang);
      await storage.setItem(STORAGE_KEYS.USER_LANGUAGE, newLang);
    },
    [language, applyRTL]
  );

  // ─── Translation Function ────────────────────────────────────────────────────
  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const keys = path.split('.');
      let current: any = translations[language];

      for (const key of keys) {
        if (current === undefined || current === null) break;
        current = current[key];
      }

      // If translation not found in current language, fallback to English
      if (current === undefined || current === null || typeof current !== 'string') {
        current = translations['en'];
        for (const key of keys) {
          if (current === undefined || current === null) break;
          current = current[key];
        }
      }

      // Final fallback to human-readable string if English also fails
      if (current === undefined || current === null || typeof current !== 'string') {
        const lastPart = keys[keys.length - 1] || path;
        return lastPart
          .replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      // Replace params if provided
      let result = current;
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
        });
      }

      return result;
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, isRTL: language === 'ar', isArabic: language === 'ar', isLoading }),
    [language, setLanguage, t, isLoading]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

