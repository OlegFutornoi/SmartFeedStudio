export interface LegalSection {
  title: string;
  content: string[];
}

export interface LegalDocumentData {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export const DEFAULT_TERMS_OF_SERVICE: Record<'uk' | 'en', LegalDocumentData> = {
  uk: {
    title: 'Умови використання SmartFeed Studio',
    lastUpdated: '10 жовтня 2026',
    sections: [
      {
        title: '1. Загальні положення',
        content: [
          'Ласкаво просимо до SmartFeed Studio. Використовуючи наш десктопний додаток або супутні хмарні сервіси, ви погоджуєтеся дотримуватися цих Умов використання.',
          'SmartFeed Studio надає програмне забезпечення для імпорту, обробки, валідації та синхронізації каталогів товарів і фідів (XML, CSV, YML) з маркетплейсами.',
        ],
      },
      {
        title: '2. Обліковий запис та безпека',
        content: [
          'Ви несете повну відповідальність за безпеку ваших облікових даних та збереження паролю.',
          'Ви зобов’язуєтеся надавати правдиву контактну інформацію про вашу організацію під час реєстрації.',
          'Один обліковий запис може використовуватися в межах дозволеної кількості робочих місць відповідно до вашого тарифного плану.',
        ],
      },
      {
        title: '3. Ліцензії та квоти',
        content: [
          'Використання додатку регулюється ліцензійним ключем. Тариф Free надає базові ліміти (до 1 000 SKU товарів).',
          'Спроби несанкціонованого обходу квот, декомпіляції чи модифікації ліцензійного ядра суворо заборонені.',
        ],
      },
      {
        title: '4. Конфіденційність та дані каталогів',
        content: [
          'Ваші бази даних постачальників, собівартість та націнки зберігаються локально у зашифрованому сховищі SQLite (SQLCipher) на вашому комп’ютері.',
          'SmartFeed Studio не передає ваші приватні комерційні дані третім особам без вашої прямої згоди.',
        ],
      },
      {
        title: '5. Відповідальність та відмова від гарантій',
        content: [
          'Програмне забезпечення надається за принципом "як є" (as-is). Користувач несе відповідальність за відповідність товарних описів та цін вимогам маркетплейсів.',
        ],
      },
    ],
  },
  en: {
    title: 'Terms of Service — SmartFeed Studio',
    lastUpdated: 'October 10, 2026',
    sections: [
      {
        title: '1. General Provisions',
        content: [
          'Welcome to SmartFeed Studio. By accessing or using our desktop application and associated cloud services, you agree to be bound by these Terms of Service.',
          'SmartFeed Studio provides software tools for importing, processing, validating, and synchronizing e-commerce product feeds (XML, CSV, YML) with marketplaces.',
        ],
      },
      {
        title: '2. User Accounts & Security',
        content: [
          'You are responsible for maintaining the confidentiality of your account credentials and passwords.',
          'You agree to provide accurate company and contact details during registration.',
          'Each account is licensed for use up to the authorized seat limits defined in your tariff plan.',
        ],
      },
      {
        title: '3. Licenses & Quota Usage',
        content: [
          'Software usage is controlled via license keys. The Free plan provides base quotas (up to 1,000 SKUs).',
          'Any unauthorized attempts to bypass quota limitations or tamper with licensing modules are strictly prohibited.',
        ],
      },
      {
        title: '4. Catalog Data Confidentiality',
        content: [
          'Supplier databases, wholesale prices, and margins remain stored locally inside an encrypted SQLCipher SQLite database on your device.',
          'SmartFeed Studio never transmits or sells your private product catalog margins to third parties.',
        ],
      },
      {
        title: '5. Limitation of Liability',
        content: [
          'The application is provided "as is". You are solely responsible for ensuring that published product listings comply with marketplace rules and regulations.',
        ],
      },
    ],
  },
};

export const DEFAULT_PRIVACY_POLICY: Record<'uk' | 'en', LegalDocumentData> = {
  uk: {
    title: 'Політика конфіденційності SmartFeed Studio',
    lastUpdated: '10 жовтня 2026',
    sections: [
      {
        title: '1. Які дані ми збираємо',
        content: [
          'Облікові дані: адреса електронної пошти, ім’я користувача, назва компанії для активації ліцензії.',
          'Технічні метрики: версія операційної системи, версія додатку та базові логи стабільності (Sentry) для усунення помилок.',
        ],
      },
      {
        title: '2. Локальне шифрування на вашому пристрої',
        content: [
          'Всі товари, файли постачальників (XML/CSV) та правила ціноутворення зберігаються локально на вашому комп’ютері.',
          'Для захисту локальної бази даних використовується 256-бітне шифрування AES (SQLCipher). Refresh-токени зберігаються в захищеному сховищі Keychain вашої ОС.',
        ],
      },
      {
        title: '3. Використання інформації',
        content: [
          'Зібрані облікові дані використовуються виключно для автентифікації, перевірки підписки та надання клієнтської підтримки.',
          'Ми не продаємо і не передаємо персональні дані комерційним рекламодавцям.',
        ],
      },
      {
        title: '4. Ваші права',
        content: [
          'Ви маєте право в будь-який момент експортувати свої локальні дані, змінити пароль або подати запит на повне видалення вашого хмарного профілю.',
        ],
      },
    ],
  },
  en: {
    title: 'Privacy Policy — SmartFeed Studio',
    lastUpdated: 'October 10, 2026',
    sections: [
      {
        title: '1. Information We Collect',
        content: [
          'Account information: email address, full name, and store/company name used for license activation.',
          'Technical diagnostics: OS architecture, client app version, and anonymized error traces (Sentry) for reliability.',
        ],
      },
      {
        title: '2. Device-Level Local Encryption',
        content: [
          'All product items, supplier files (XML/CSV), and pricing formulas are processed and stored locally on your desktop.',
          'Local databases are secured using 256-bit AES encryption (SQLCipher). Authentication refresh tokens are safely stored in your OS Keychain.',
        ],
      },
      {
        title: '3. How We Use Data',
        content: [
          'Account credentials are used strictly for authentication, license provisioning, and customer support services.',
          'We do not sell, rent, or lease your personal information to third-party advertisers.',
        ],
      },
      {
        title: '4. User Rights',
        content: [
          'You have the right to export your local catalogs at any time, change your security credentials, or request complete deletion of your account.',
        ],
      },
    ],
  },
};
