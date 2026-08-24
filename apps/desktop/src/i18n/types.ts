export type Language = 'uk' | 'en';

export type Namespace = 'common' | 'auth' | 'home';

export type TranslationDict = Record<string, string>;

export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  loadedNamespaces: Set<string>;
  loadNamespace: (ns: Namespace) => Promise<void>;
  isLoading: boolean;
}
