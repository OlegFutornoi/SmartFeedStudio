'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Locale, TranslationNamespace } from '@/i18n/types';

import ukCommon from '@/i18n/locales/uk/common.json';
import ukAuth from '@/i18n/locales/uk/auth.json';
import ukNav from '@/i18n/locales/uk/navigation.json';
import ukUsers from '@/i18n/locales/uk/users.json';
import ukLicenses from '@/i18n/locales/uk/licenses.json';
import ukPlans from '@/i18n/locales/uk/plans.json';
import ukSettings from '@/i18n/locales/uk/settings.json';
import ukDashboard from '@/i18n/locales/uk/dashboard.json';
import ukErrors from '@/i18n/locales/uk/errors.json';

import enCommon from '@/i18n/locales/en/common.json';
import enAuth from '@/i18n/locales/en/auth.json';
import enNav from '@/i18n/locales/en/navigation.json';
import enUsers from '@/i18n/locales/en/users.json';
import enLicenses from '@/i18n/locales/en/licenses.json';
import enPlans from '@/i18n/locales/en/plans.json';
import enSettings from '@/i18n/locales/en/settings.json';
import enDashboard from '@/i18n/locales/en/dashboard.json';
import enErrors from '@/i18n/locales/en/errors.json';

const TRANSLATIONS: Record<Locale, Record<TranslationNamespace, Record<string, string>>> = {
  uk: {
    common: ukCommon,
    auth: ukAuth,
    navigation: ukNav,
    users: ukUsers,
    licenses: ukLicenses,
    plans: ukPlans,
    settings: ukSettings,
    dashboard: ukDashboard,
    errors: ukErrors,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    navigation: enNav,
    users: enUsers,
    licenses: enLicenses,
    plans: enPlans,
    settings: enSettings,
    dashboard: enDashboard,
    errors: enErrors,
  },
};

const LANGUAGE_KEY = 'smartfeed_admin_lang';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (
    namespace: TranslationNamespace,
    key: string,
    params?: Record<string, string | number>,
  ) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('uk');

  useEffect(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY) as Locale;
    if (saved === 'uk' || saved === 'en') {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LANGUAGE_KEY, newLocale);
  }, []);

  const t = useCallback(
    (
      namespace: TranslationNamespace,
      key: string,
      params?: Record<string, string | number>,
    ): string => {
      const dict = TRANSLATIONS[locale]?.[namespace] || TRANSLATIONS.uk[namespace];
      let value = dict?.[key] || key;

      if (params) {
        Object.entries(params).forEach(([pKey, pVal]) => {
          value = value.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
        });
      }

      return value;
    },
    [locale],
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
