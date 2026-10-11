import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { Language, Namespace, TranslationDict, I18nContextType } from '@/i18n/types';

import ukCommon from '@/i18n/locales/uk/common.json';
import ukAuth from '@/i18n/locales/uk/auth.json';
import ukHome from '@/i18n/locales/uk/home.json';
import ukPlans from '@/i18n/locales/uk/plans.json';
import ukTeam from '@/i18n/locales/uk/team.json';
import ukCatalogs from '@/i18n/locales/uk/catalogs.json';
import ukSuppliers from '@/i18n/locales/uk/suppliers.json';
import ukProducts from '@/i18n/locales/uk/products.json';
import ukAi from '@/i18n/locales/uk/ai.json';
import ukCloud from '@/i18n/locales/uk/cloud.json';
import ukSettings from '@/i18n/locales/uk/settings.json';
import ukStorage from '@/i18n/locales/uk/storage.json';
import ukErrors from '@/i18n/locales/uk/errors.json';
import ukFeatureTeaser from '@/i18n/locales/uk/featureTeaser.json';
import ukExport from '@/i18n/locales/uk/export.json';

import enCommon from '@/i18n/locales/en/common.json';
import enAuth from '@/i18n/locales/en/auth.json';
import enHome from '@/i18n/locales/en/home.json';
import enPlans from '@/i18n/locales/en/plans.json';
import enTeam from '@/i18n/locales/en/team.json';
import enCatalogs from '@/i18n/locales/en/catalogs.json';
import enSuppliers from '@/i18n/locales/en/suppliers.json';
import enProducts from '@/i18n/locales/en/products.json';
import enAi from '@/i18n/locales/en/ai.json';
import enCloud from '@/i18n/locales/en/cloud.json';
import enSettings from '@/i18n/locales/en/settings.json';
import enStorage from '@/i18n/locales/en/storage.json';
import enErrors from '@/i18n/locales/en/errors.json';
import enFeatureTeaser from '@/i18n/locales/en/featureTeaser.json';
import enExport from '@/i18n/locales/en/export.json';

export * from '@/i18n/types';

const STORAGE_KEY = 'smartfeed_language';
const DEFAULT_LANGUAGE: Language = 'uk';

const STATIC_TRANSLATIONS: Record<Language, Record<Namespace, TranslationDict>> = {
  uk: {
    common: ukCommon,
    auth: ukAuth,
    home: ukHome,
    plans: ukPlans,
    team: ukTeam,
    catalogs: ukCatalogs,
    suppliers: ukSuppliers,
    products: ukProducts,
    ai: ukAi,
    cloud: ukCloud,
    settings: ukSettings,
    storage: ukStorage,
    errors: ukErrors,
    featureTeaser: ukFeatureTeaser,
    export: ukExport,
  } as unknown as Record<Namespace, TranslationDict>,
  en: {
    common: enCommon,
    auth: enAuth,
    home: enHome,
    plans: enPlans,
    team: enTeam,
    catalogs: enCatalogs,
    suppliers: enSuppliers,
    products: enProducts,
    ai: enAi,
    cloud: enCloud,
    settings: enSettings,
    storage: enStorage,
    errors: enErrors,
    featureTeaser: enFeatureTeaser,
    export: enExport,
  } as unknown as Record<Namespace, TranslationDict>,
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

  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<Language>;
      if (customEvent.detail === 'uk' || customEvent.detail === 'en') {
        setLanguage(customEvent.detail);
      }
    };
    window.addEventListener('smartfeed-set-language', handleLangChange);
    return () => window.removeEventListener('smartfeed-set-language', handleLangChange);
  }, [setLanguage]);

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
        if (params && typeof params.defaultValue === 'string') {
          return params.defaultValue;
        }
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

export { getErrorMessage } from '@/i18n/errors';
