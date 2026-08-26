import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { Language, Namespace, TranslationDict, I18nContextType } from './types';

export * from './types';

const STORAGE_KEY = 'smartfeed_language';
const DEFAULT_LANGUAGE: Language = 'uk';

// Dynamic code-split loaders for each namespace and language
const localeModules: Record<Language, Record<Namespace, () => Promise<TranslationDict>>> = {
  uk: {
    common: () =>
      import('./locales/uk/common.json').then((m) => (m.default || m) as TranslationDict),
    auth: () => import('./locales/uk/auth.json').then((m) => (m.default || m) as TranslationDict),
    home: () => import('./locales/uk/home.json').then((m) => (m.default || m) as TranslationDict),
    plans: () => import('./locales/uk/plans.json').then((m) => (m.default || m) as TranslationDict),
    errors: () =>
      import('./locales/uk/errors.json').then((m) => (m.default || m) as TranslationDict),
  },
  en: {
    common: () =>
      import('./locales/en/common.json').then((m) => (m.default || m) as TranslationDict),
    auth: () => import('./locales/en/auth.json').then((m) => (m.default || m) as TranslationDict),
    home: () => import('./locales/en/home.json').then((m) => (m.default || m) as TranslationDict),
    plans: () => import('./locales/en/plans.json').then((m) => (m.default || m) as TranslationDict),
    errors: () =>
      import('./locales/en/errors.json').then((m) => (m.default || m) as TranslationDict),
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language;
    return saved === 'uk' || saved === 'en' ? saved : DEFAULT_LANGUAGE;
  });

  const [cache, setCache] = useState<Record<string, TranslationDict>>({});
  const [loadedNamespaces, setLoadedNamespaces] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Active namespaces registered by mounted components
  const activeNamespacesRef = useRef<Set<Namespace>>(new Set(['common', 'errors']));

  const loadNamespace = useCallback(
    async (ns: Namespace, lang = language) => {
      const cacheKey = `${lang}:${ns}`;
      activeNamespacesRef.current.add(ns);

      if (cache[cacheKey]) {
        return;
      }

      try {
        const loader = localeModules[lang]?.[ns];
        if (!loader) return;

        const dict = await loader();
        setCache((prev) => ({ ...prev, [cacheKey]: dict }));
        setLoadedNamespaces((prev) => new Set([...prev, cacheKey]));
      } catch (err) {
        console.error(`[i18n] Failed to load namespace ${ns} for language ${lang}:`, err);
      }
    },
    [language, cache],
  );

  // When language changes, reload all currently active namespaces in parallel
  const setLanguage = useCallback(
    async (newLang: Language) => {
      localStorage.setItem(STORAGE_KEY, newLang);
      setIsLoading(true);

      const activeList = Array.from(activeNamespacesRef.current);
      const promises = activeList.map(async (ns) => {
        const cacheKey = `${newLang}:${ns}`;
        if (!cache[cacheKey]) {
          const loader = localeModules[newLang]?.[ns];
          if (loader) {
            const dict = await loader();
            return { cacheKey, dict };
          }
        }
        return null;
      });

      const results = await Promise.all(promises);
      const newEntries: Record<string, TranslationDict> = {};
      const newLoadedKeys: string[] = [];

      results.forEach((res) => {
        if (res) {
          newEntries[res.cacheKey] = res.dict;
          newLoadedKeys.push(res.cacheKey);
        }
      });

      if (Object.keys(newEntries).length > 0) {
        setCache((prev) => ({ ...prev, ...newEntries }));
        setLoadedNamespaces((prev) => new Set([...prev, ...newLoadedKeys]));
      }

      setLanguageState(newLang);
      setIsLoading(false);
    },
    [cache],
  );

  // Initial load of 'common' and 'errors' namespaces
  useEffect(() => {
    loadNamespace('common', language);
    loadNamespace('errors', language);
  }, [language, loadNamespace]);

  // Translation lookup function
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      // Search in all loaded namespaces for current language
      let foundText: string | undefined;

      // Check if key is prefixed with namespace like "errors.invalidCredentials" or direct "invalidCredentials"
      const parts = key.split('.');
      if (parts.length === 2) {
        const [ns, k] = parts;
        const dict = cache[`${language}:${ns}`];
        if (dict && dict[k] !== undefined) {
          foundText = dict[k];
        }
      }

      if (foundText === undefined) {
        // Look through loaded active namespaces
        for (const ns of activeNamespacesRef.current) {
          const dict = cache[`${language}:${ns}`];
          if (dict && dict[key] !== undefined) {
            foundText = dict[key];
            break;
          }
        }
      }

      if (foundText === undefined) {
        return key; // Fallback to raw key
      }

      // Interpolate dynamic parameters like {{name}}, {{count}}
      if (params) {
        return Object.entries(params).reduce((str, [paramKey, paramVal]) => {
          return str.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(paramVal));
        }, foundText);
      }

      return foundText;
    },
    [language, cache],
  );

  const value: I18nContextType = {
    language,
    setLanguage,
    t,
    loadedNamespaces,
    loadNamespace,
    isLoading,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Custom hook for consuming translations in pages and components.
 * Automatically triggers on-demand lazy loading of specified namespaces.
 */
export function useTranslation(requiredNamespaces?: Namespace | Namespace[]) {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }

  const { loadNamespace, t, language, setLanguage, isLoading } = context;

  useEffect(() => {
    if (!requiredNamespaces) return;

    const nsList = Array.isArray(requiredNamespaces) ? requiredNamespaces : [requiredNamespaces];
    nsList.forEach((ns) => {
      loadNamespace(ns);
    });
  }, [requiredNamespaces, loadNamespace, language]);

  return {
    t,
    language,
    setLanguage,
    isLoading,
  };
}

/**
 * Utility helper to map any error (ApiError, Error, string) to localized text.
 */
export function getErrorMessage(error: unknown, t: (key: string) => string): string {
  if (!error) return '';

  const rawMessage = error instanceof Error ? error.message : String(error);

  // Common backend error message mappings
  if (
    rawMessage.includes('Invalid email or password') ||
    rawMessage.includes('Unauthorized') ||
    rawMessage.includes('401')
  ) {
    return t('errors.invalidCredentials');
  }

  if (rawMessage.includes('already exists') || rawMessage.includes('409')) {
    return t('errors.userAlreadyExists');
  }

  if (rawMessage.includes('email must be an email') || rawMessage.includes('invalid email')) {
    return t('errors.invalidEmail');
  }

  if (rawMessage.includes('password must be longer') || rawMessage.includes('at least 8')) {
    return t('errors.passwordTooShort');
  }

  if (
    rawMessage.includes('Failed to fetch') ||
    rawMessage.includes('NetworkError') ||
    rawMessage.includes('ECONNREFUSED')
  ) {
    return t('errors.networkError');
  }

  if (rawMessage.includes('500') || rawMessage.includes('Internal server error')) {
    return t('errors.serverError');
  }

  if (
    rawMessage.includes('password reset instructions') ||
    rawMessage.includes('not found') ||
    rawMessage.includes('User not found') ||
    rawMessage.includes('userNotFound')
  ) {
    return t('errors.userNotFound');
  }

  if (
    rawMessage.includes('Invalid or expired reset token') ||
    rawMessage.includes('reset token') ||
    rawMessage.includes('invalidResetToken')
  ) {
    return t('errors.invalidResetToken');
  }

  if (rawMessage.includes('LICENSE_EXPIRED') || rawMessage.includes('tariff plan has expired')) {
    return t('plans.licenseExpiredDesc');
  }

  // Try direct key lookup in errors namespace
  const translated = t(`errors.${rawMessage}`);
  if (translated !== `errors.${rawMessage}`) {
    return translated;
  }

  return rawMessage;
}
