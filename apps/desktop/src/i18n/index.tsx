import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { Language, Namespace, TranslationDict, I18nContextType } from './types';

import ukCommon from './locales/uk/common.json';
import ukAuth from './locales/uk/auth.json';
import ukHome from './locales/uk/home.json';
import ukPlans from './locales/uk/plans.json';
import ukTeam from './locales/uk/team.json';
import ukCatalogs from './locales/uk/catalogs.json';
import ukSuppliers from './locales/uk/suppliers.json';
import ukProducts from './locales/uk/products.json';
import ukAi from './locales/uk/ai.json';
import ukCloud from './locales/uk/cloud.json';
import ukSettings from './locales/uk/settings.json';
import ukStorage from './locales/uk/storage.json';
import ukErrors from './locales/uk/errors.json';
import ukFeatureTeaser from './locales/uk/featureTeaser.json';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enHome from './locales/en/home.json';
import enPlans from './locales/en/plans.json';
import enTeam from './locales/en/team.json';
import enCatalogs from './locales/en/catalogs.json';
import enSuppliers from './locales/en/suppliers.json';
import enProducts from './locales/en/products.json';
import enAi from './locales/en/ai.json';
import enCloud from './locales/en/cloud.json';
import enSettings from './locales/en/settings.json';
import enStorage from './locales/en/storage.json';
import enErrors from './locales/en/errors.json';
import enFeatureTeaser from './locales/en/featureTeaser.json';

export * from './types';

const STORAGE_KEY = 'smartfeed_language';
const DEFAULT_LANGUAGE: Language = 'uk';

const STATIC_TRANSLATIONS: Record<Language, Record<Namespace, TranslationDict>> = {
  uk: {
    common: ukCommon as TranslationDict,
    auth: ukAuth as TranslationDict,
    home: ukHome as TranslationDict,
    plans: ukPlans as TranslationDict,
    team: ukTeam as TranslationDict,
    catalogs: ukCatalogs as TranslationDict,
    suppliers: ukSuppliers as TranslationDict,
    products: ukProducts as TranslationDict,
    ai: ukAi as TranslationDict,
    cloud: ukCloud as TranslationDict,
    settings: ukSettings as TranslationDict,
    storage: ukStorage as TranslationDict,
    errors: ukErrors as TranslationDict,
    featureTeaser: ukFeatureTeaser as TranslationDict,
  },
  en: {
    common: enCommon as TranslationDict,
    auth: enAuth as TranslationDict,
    home: enHome as TranslationDict,
    plans: enPlans as TranslationDict,
    team: enTeam as TranslationDict,
    catalogs: enCatalogs as TranslationDict,
    suppliers: enSuppliers as TranslationDict,
    products: enProducts as TranslationDict,
    ai: enAi as TranslationDict,
    cloud: enCloud as TranslationDict,
    settings: enSettings as TranslationDict,
    storage: enStorage as TranslationDict,
    errors: enErrors as TranslationDict,
    featureTeaser: enFeatureTeaser as TranslationDict,
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language;
    return saved === 'uk' || saved === 'en' ? saved : DEFAULT_LANGUAGE;
  });

  const [cache, setCache] = useState<Record<string, TranslationDict>>(() => {
    const initial: Record<string, TranslationDict> = {};
    (['uk', 'en'] as Language[]).forEach((lang) => {
      Object.entries(STATIC_TRANSLATIONS[lang]).forEach(([ns, dict]) => {
        initial[`${lang}:${ns}`] = dict;
      });
    });
    return initial;
  });

  const [loadedNamespaces, setLoadedNamespaces] = useState<Set<string>>(
    () =>
      new Set(
        (['uk', 'en'] as Language[]).flatMap((lang) =>
          Object.keys(STATIC_TRANSLATIONS[lang]).map((ns) => `${lang}:${ns}`),
        ),
      ),
  );
  const [isLoading] = useState<boolean>(false);

  const activeNamespacesRef = useRef<Set<Namespace>>(
    new Set([
      'common',
      'errors',
      'auth',
      'home',
      'plans',
      'team',
      'catalogs',
      'ai',
      'cloud',
      'settings',
    ]),
  );

  const loadNamespace = useCallback(
    async (ns: Namespace, lang = language) => {
      const cacheKey = `${lang}:${ns}`;
      activeNamespacesRef.current.add(ns);

      if (!cache[cacheKey] && STATIC_TRANSLATIONS[lang]?.[ns]) {
        setCache((prev) => ({ ...prev, [cacheKey]: STATIC_TRANSLATIONS[lang][ns] }));
        setLoadedNamespaces((prev) => new Set([...prev, cacheKey]));
      }
    },
    [language, cache],
  );

  const setLanguage = useCallback((newLang: Language) => {
    localStorage.setItem(STORAGE_KEY, newLang);
    setLanguageState(newLang);
  }, []);

  // Translation lookup function supporting "ns:key", "ns.key", and direct "key"
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let foundText: string | undefined;

      let nsPrefix: string | undefined;
      let leafKey = key;

      if (key.includes(':')) {
        const colonIdx = key.indexOf(':');
        nsPrefix = key.slice(0, colonIdx);
        leafKey = key.slice(colonIdx + 1);
      } else if (key.includes('.')) {
        const dotIdx = key.indexOf('.');
        nsPrefix = key.slice(0, dotIdx);
        leafKey = key.slice(dotIdx + 1);
      }

      if (nsPrefix) {
        const dict =
          cache[`${language}:${nsPrefix}`] ||
          STATIC_TRANSLATIONS[language]?.[nsPrefix as Namespace];
        if (dict && dict[leafKey] !== undefined) {
          foundText = dict[leafKey];
        }
      }

      if (foundText === undefined) {
        // Search all active namespaces in priority order
        const searchList: Namespace[] = [
          'common',
          'catalogs',
          'ai',
          'cloud',
          'team',
          'plans',
          'auth',
          'home',
          'settings',
          'errors',
        ];
        for (const ns of searchList) {
          const dict = cache[`${language}:${ns}`] || STATIC_TRANSLATIONS[language]?.[ns];
          if (dict && dict[key] !== undefined) {
            foundText = dict[key];
            break;
          }
        }
      }

      if (foundText === undefined) {
        return key; // Fallback to raw key
      }

      // Interpolate dynamic parameters like {{name}}, {{count}}, {name}, {count}
      if (params) {
        return Object.entries(params).reduce((str, [paramKey, paramVal]) => {
          const doubleBrace = new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g');
          const singleBrace = new RegExp(`{\\s*${paramKey}\\s*}`, 'g');
          return str.replace(doubleBrace, String(paramVal)).replace(singleBrace, String(paramVal));
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

export function useTranslation(requiredNamespaces?: Namespace | Namespace[]) {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }

  const { loadNamespace, t: baseT, language, setLanguage, isLoading } = context;

  useEffect(() => {
    if (!requiredNamespaces) return;
    const nsList = Array.isArray(requiredNamespaces) ? requiredNamespaces : [requiredNamespaces];
    nsList.forEach((ns) => {
      loadNamespace(ns);
    });
  }, [requiredNamespaces, loadNamespace, language]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      if (requiredNamespaces && !key.includes(':') && !key.includes('.')) {
        const nsList = Array.isArray(requiredNamespaces)
          ? requiredNamespaces
          : [requiredNamespaces];
        for (const ns of nsList) {
          const dict = STATIC_TRANSLATIONS[language]?.[ns];
          if (dict && dict[key] !== undefined) {
            const foundText = dict[key];
            if (params) {
              return Object.entries(params).reduce((str, [paramKey, paramVal]) => {
                const doubleBrace = new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g');
                const singleBrace = new RegExp(`{\\s*${paramKey}\\s*}`, 'g');
                return str
                  .replace(doubleBrace, String(paramVal))
                  .replace(singleBrace, String(paramVal));
              }, foundText);
            }
            return foundText;
          }
        }
      }
      return baseT(key, params);
    },
    [baseT, language, requiredNamespaces],
  );

  return {
    t,
    language,
    setLanguage,
    isLoading,
  };
}

export function getErrorMessage(error: unknown, t: (key: string) => string): string {
  if (!error) return '';

  const rawMessage = error instanceof Error ? error.message : String(error);

  const direct = t(`errors.${rawMessage}`);
  if (direct && direct !== `errors.${rawMessage}` && direct !== rawMessage) {
    return direct;
  }

  const directNoNs = t(rawMessage);
  if (directNoNs && directNoNs !== rawMessage && directNoNs !== `errors.${rawMessage}`) {
    return directNoNs;
  }

  const lower = rawMessage.toLowerCase();

  if (
    lower.includes('authentication token is missing or invalid') ||
    lower.includes('jwt expired') ||
    lower.includes('token expired') ||
    lower.includes('invalid token') ||
    lower.includes('unauthorized') ||
    lower.includes('401')
  ) {
    return t('errors.unauthorized');
  }

  if (
    lower.includes('invalid email or password') ||
    lower.includes('invalid credentials') ||
    lower.includes('wrong password')
  ) {
    return t('errors.invalidCredentials');
  }

  if (lower.includes('already exists') || lower.includes('409')) {
    return t('errors.userAlreadyExists');
  }

  if (lower.includes('email must be an email') || lower.includes('invalid email')) {
    return t('errors.invalidEmail');
  }

  if (lower.includes('password must be longer') || lower.includes('at least 8')) {
    return t('errors.passwordTooShort');
  }

  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('econnrefused')
  ) {
    return t('errors.networkError');
  }

  if (lower.includes('500') || lower.includes('internal server error')) {
    return t('errors.serverError');
  }

  if (
    lower.includes('password reset instructions') ||
    lower.includes('not found') ||
    lower.includes('user not found') ||
    lower.includes('usernotfound')
  ) {
    return t('errors.userNotFound');
  }

  return rawMessage;
}
