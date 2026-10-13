import { z } from 'zod';

/**
 * AI Assistant Profile Schema (Single Source of Truth for avatar and metadata)
 */
export const AiAssistantProfileDtoSchema = z.object({
  name: z.string().default('SmartFeed AI Copilot'),
  avatarUrl: z.string().optional(),
  roleUk: z.string().default('Персональний AI-асистент з товарних каталогів та фідів'),
  roleEn: z.string().default('Personal AI Catalog & Feed Copilot'),
  badgeUk: z.string().default('AI Автопілот 24/7'),
  badgeEn: z.string().default('24/7 AI Autopilot'),
});

export type AiAssistantProfileDto = z.infer<typeof AiAssistantProfileDtoSchema>;

export const UpdateAiAssistantProfileDtoSchema = z.object({
  name: z.string().min(1).optional(),
  avatarUrl: z.string().optional(),
  roleUk: z.string().min(1).optional(),
  roleEn: z.string().min(1).optional(),
  badgeUk: z.string().min(1).optional(),
  badgeEn: z.string().min(1).optional(),
});

export type UpdateAiAssistantProfileDto = z.infer<typeof UpdateAiAssistantProfileDtoSchema>;

/**
 * Page Guide DTO Schema for contextual AI assistance on any page
 */
export const PageGuideDtoSchema = z.object({
  id: z.string().optional(),
  route: z.string(), // e.g. "/cloud-sync", "/catalogs", "/suppliers", "/ai", "/"
  titleUk: z.string(),
  titleEn: z.string(),
  icon: z.string().default('HelpCircle'),
  badgeUk: z.string().default('AI Асистент'),
  badgeEn: z.string().default('AI Assistant'),
  summaryUk: z.string(),
  summaryEn: z.string(),
  descriptionUk: z.string(),
  descriptionEn: z.string(),
  featuresUk: z.array(z.string()).default([]),
  featuresEn: z.array(z.string()).default([]),
  proTipUk: z.string().optional(),
  proTipEn: z.string().optional(),
  assistant: AiAssistantProfileDtoSchema.optional(),
});

export type PageGuideDto = z.infer<typeof PageGuideDtoSchema>;

export const DEFAULT_AI_ASSISTANT_PROFILE: AiAssistantProfileDto = {
  name: 'SmartFeed AI Copilot',
  avatarUrl: undefined, // defaults to local ai-copilot-agent.jpg
  roleUk: 'Персональний AI-асистент з товарних каталогів та фідів',
  roleEn: 'Personal AI Catalog & Feed Copilot',
  badgeUk: 'AI Автопілот 24/7',
  badgeEn: '24/7 AI Autopilot',
};

/**
 * Canonical default guides for all desktop application routes.
 * Guarantees 100% offline capability and instant rendering.
 */
export const DEFAULT_PAGE_GUIDES: Record<string, PageGuideDto> = {
  '/cloud-sync': {
    route: '/cloud-sync',
    titleUk: 'Хмарна синхронізація & Медіа',
    titleEn: 'Cloud Storage & Media',
    icon: 'Cloud',
    badgeUk: 'Хмарне сховище',
    badgeEn: 'Cloud Storage',
    summaryUk: 'Безпечне збереження медіафайлів та бекапів каталогу у Cloudflare R2 CDN.',
    summaryEn: 'Secure storage of media files and catalog backups in Cloudflare R2 CDN.',
    descriptionUk:
      'Цей розділ керує вивантаженням фотографій товарів у хмару Cloudflare R2, захищає ваш каталог від втрати зображень постачальників, роздає медіа через надшвидкий CDN та створює резервні копії.',
    descriptionEn:
      'This section manages uploading product photos to Cloudflare R2, protects your catalog from supplier photo drops, distributes media via ultra-fast CDN, and manages snapshots.',
    featuresUk: [
      'Вивантаження фотографій у Cloudflare R2 без лімітів трафіку',
      'Автоматичне видалення застарілих та незв’язаних файлів у фоні',
      'Створення та відновлення резервних копій (Snapshots)',
      'Налаштування автосинхронізації та очищення локального кешу',
    ],
    featuresEn: [
      'Upload product photos to Cloudflare R2 with zero egress fees',
      'Automated background purge of orphaned unlinked files',
      'Create and restore catalog backups (Snapshots)',
      'Auto-sync preferences and local media cache cleanup',
    ],
    proTipUk:
      'Перед видаленням постачальників чи фідів робіть резервну копію каталогу, а після видалення запускайте фонове очищення сміття R2 для вивільнення дискового простору.',
    proTipEn:
      'Always create a catalog backup before deleting feeds, and run background R2 orphan cleanup to reclaim disk space after large catalog deletions.',
  },
  '/': {
    route: '/',
    titleUk: 'Дашборд',
    titleEn: 'Dashboard',
    icon: 'LayoutDashboard',
    badgeUk: 'Аналітика',
    badgeEn: 'Analytics',
    summaryUk: 'Головна аналітична панель стану товарного бізнесу та фідів.',
    summaryEn: 'Main analytics overview of your catalog health and feeds.',
    descriptionUk:
      'Дашборд агрегує ключові показники: кількість активних фідів, загальну базу товарів, використання дискової квоти та статус останніх синхронізацій у реальному часі.',
    descriptionEn:
      'The dashboard aggregates vital metrics: active feeds, total catalog items, disk quota usage, and real-time synchronization health.',
    featuresUk: [
      'Швидкий огляд лічильників товарів та постачальників',
      'Моніторинг лімітів тарифного плану та квот',
      'Статус фонових завдань імпорту та синхронізації',
    ],
    featuresEn: [
      'Quick glance at product and supplier counters',
      'Subscription plan limit and quota monitoring',
      'Status of background import and sync tasks',
    ],
    proTipUk:
      'Слідкуйте за лічильником невивантажених фото, щоб вчасно передавати оновлення на маркетплейси.',
    proTipEn: 'Keep an eye on pending cloud sync photos to keep marketplace exports up to date.',
  },
  '/catalogs': {
    route: '/catalogs',
    titleUk: 'Каталоги товарів',
    titleEn: 'Product Catalogs',
    icon: 'Layers',
    badgeUk: 'Товари',
    badgeEn: 'Products',
    summaryUk: 'Повний реєстр товарів, управління цінами, фотографіями та націнками.',
    summaryEn: 'Comprehensive product inventory, pricing, media, and markup rules.',
    descriptionUk:
      'Центральна робоча зона для перегляду, фільтрації, редагування цін, наявності та характеристик товарів. Підтримує пакетні операції та пошук.',
    descriptionEn:
      'Central workspace to view, filter, edit prices, stock, and attributes. Supports batch operations and instant search.',
    featuresUk: [
      'Швидка фільтрація за постачальниками, категоріями та наявністю',
      'Редагування цін та персональних правил націнки',
      'Галерея фотографій з миттєвим переглядом та статусом R2',
    ],
    featuresEn: [
      'Fast filtering by suppliers, categories, and stock',
      'Price editing and custom markup rule configuration',
      'Photo gallery with instant previews and R2 status badges',
    ],
    proTipUk:
      'Налаштуйте колонки таблиці під свій робочий процес за допомогою кнопки «Налаштувати колонки».',
    proTipEn:
      'Customize your table layout using the "Customize Columns" button for peak workflow speed.',
  },
  '/suppliers': {
    route: '/suppliers',
    titleUk: 'Постачальники',
    titleEn: 'Suppliers',
    icon: 'Truck',
    badgeUk: 'Інтеграції',
    badgeEn: 'Integrations',
    summaryUk: 'Керування постачальниками, джерелами XML/CSV фідів та розкладом оновлень.',
    summaryEn: 'Manage suppliers, XML/CSV feed sources, and sync schedules.',
    descriptionUk:
      'Підключайте постачальників, налаштовуйте імпорт через URL або файли (XML, CSV, Websklad), керуйте правилами мапінгу та автоматичним оновленням залишків.',
    descriptionEn:
      'Connect suppliers, configure imports via URL or file (XML, CSV, Websklad), set up mapping rules, and automate stock updates.',
    featuresUk: [
      'Підтримка XML, YML, CSV форматів будь-якої складності',
      'Каскадне оновлення цін та залишків за 1 клік',
      'Автоматичне очищення пов’язаних медіафайлів при видаленні фіду',
    ],
    featuresEn: [
      'Support for XML, YML, and CSV formats of any complexity',
      '1-click cascading stock and price updates',
      'Automated cascade purge of photos upon feed deletion',
    ],
    proTipUk:
      'Використовуйте фоновий імпорт — ви можете продовжувати роботу, поки система обробляє десятки тисяч товарів.',
    proTipEn:
      'Use background imports — you can continue your work while the system processes tens of thousands of items.',
  },
  '/ai': {
    route: '/ai',
    titleUk: 'AI Асистент контенту',
    titleEn: 'AI Content Assistant',
    icon: 'Sparkles',
    badgeUk: 'AI Генерація',
    badgeEn: 'AI Generation',
    summaryUk: 'Генерація SEO-описів, заголовків та збагачення товарів за допомогою LLM.',
    summaryEn: 'SEO descriptions, high-converting titles, and attribute extraction via LLM.',
    descriptionUk:
      'Штучний інтелект аналізує ваші товари, автоматично виправляє помилки постачальників, генерує продаючі тексти для Rozetka/Prom/Google Shopping та витягує характеристики.',
    descriptionEn:
      'Artificial intelligence analyzes your products, fixes supplier errors, writes converting copy for marketplaces, and extracts rich attributes.',
    featuresUk: [
      'Генерація описів українською та англійською мовами',
      'SEO-оптимізація назв під пошукові алгоритми маркетплейсів',
      'Пакетна обробка сотень товарів за лічені хвилини',
    ],
    featuresEn: [
      'Multi-language description generation (Ukrainian & English)',
      'Marketplace SEO title optimization',
      'Batch generation for hundreds of products in minutes',
    ],
    proTipUk:
      'Зберігайте найкращі промпти як шаблони для повторного використання в нових поставках.',
    proTipEn: 'Save your best prompts as templates to reuse across upcoming supplier shipments.',
  },
  '/plans': {
    route: '/plans',
    titleUk: 'Тарифні плани та підписка',
    titleEn: 'Subscription Plans & Pricing',
    icon: 'CreditCard',
    badgeUk: 'Підписка',
    badgeEn: 'Subscription',
    summaryUk: 'Керування ліцензією, вибір тарифного плану та розширення квот.',
    summaryEn: 'Manage your license, choose plans, and upgrade storage or team quotas.',
    descriptionUk:
      'Ознайомтеся з можливостями тарифів (Starter, Growth, Pro, Enterprise), активуйте ліцензійні ключі, збільшуйте ліміти товарів, сховища та AI-кредитів.',
    descriptionEn:
      'Explore plan tiers (Starter, Growth, Pro, Enterprise), activate license keys, and upgrade SKU, storage, or AI limits.',
    featuresUk: [
      'Гнучке масштабування від одного магазину до корпоративної мережі',
      'Миттєве розблокування хмарного сховища та командної роботи',
      'Офіційні способи оплати через безпечні платіжні шлюзи',
    ],
    featuresEn: [
      'Flexible scaling from solo shops to enterprise networks',
      'Instant cloud storage and multi-seat team activation',
      'Secure payment processing via certified gateways',
    ],
    proTipUk: 'Тариф Growth надає повний доступ до Cloudflare R2 та 100 щомісячних AI-кредитів.',
    proTipEn: 'Growth plan includes full Cloudflare R2 access and 100 monthly AI credits.',
  },
  '/team': {
    route: '/team',
    titleUk: 'Команда',
    titleEn: 'Team',
    icon: 'Users',
    badgeUk: 'Колаборація',
    badgeEn: 'Collaboration',
    summaryUk: 'Спільна робота над товарними каталогами, запрошення колег та ролі.',
    summaryEn: 'Collaborative catalog editing, member invitations, and role management.',
    descriptionUk:
      'Додавайте менеджерів з контенту, адміністраторів та колег до вашої організації. Керуйте правами доступу та спільно редагуйте каталоги.',
    descriptionEn:
      'Invite content managers, admins, and teammates to your organization. Control permissions and edit catalogs together.',
    featuresUk: [
      'Безпечні запрошення за електронною поштою з одноразовими токенами',
      'Розподіл ролей: Owner, Admin, Member',
      'Контроль зайнятих місць (seats) у межах ліцензії',
    ],
    featuresEn: [
      'Secure email invitations with one-time verification tokens',
      'Granular roles: Owner, Admin, Member',
      'Seat allocation monitoring against your active license',
    ],
    proTipUk:
      'Призначайте роль Member співробітникам, яким потрібен доступ лише до редагування товарів.',
    proTipEn:
      'Assign Member role to teammates who only need to edit catalog items without billing access.',
  },
  '/profile': {
    route: '/profile',
    titleUk: 'Профіль користувача',
    titleEn: 'User Profile',
    icon: 'User',
    badgeUk: 'Акаунт',
    badgeEn: 'Account',
    summaryUk: 'Особисті дані, зміна пароля та інформація про поточну компанію.',
    summaryEn: 'Personal profile, password security, and active organization details.',
    descriptionUk:
      'Керуйте обліковим записом: оновлюйте ім’я, аватар, змінюйте пароль та переглядайте статус вашої організації.',
    descriptionEn:
      'Manage your account credentials, update your display name and avatar, change your password, and review your organization status.',
    featuresUk: [
      'Зміна пароля з валідацією безпеки',
      'Управління персональними даними та аватаром',
      'Інформація про роль в організації',
    ],
    featuresEn: [
      'Secure password changes with complexity validation',
      'Personal profile and avatar management',
      'Organization role and membership status',
    ],
    proTipUk: 'Регулярно оновлюйте пароль для захисту доступу до хмарних даних та фідів.',
    proTipEn: 'Regularly update your password to protect cloud feeds and sensitive catalog data.',
  },
  '/settings': {
    route: '/settings',
    titleUk: 'Налаштування',
    titleEn: 'Settings',
    icon: 'Settings',
    badgeUk: 'Система',
    badgeEn: 'System',
    summaryUk: 'Налаштування інтерфейсу, теми, мови та параметрів локальної бази даних.',
    summaryEn: 'UI preferences, dark/light theme, language, and local database settings.',
    descriptionUk:
      'Персоналізуйте роботу програми: перемикайте світлу/темну тему, обирайте мову (UA/EN), керуйте локальним кешем та перевіряйте стан підключення.',
    descriptionEn:
      'Personalize your workspace: toggle theme, select language (UA/EN), manage local cache, and verify system connectivity.',
    featuresUk: [
      'Миттєве перемикання мови інтерфейсу UA ⇄ EN',
      'Темна та світла теми з підтримкою системних налаштувань OS',
      'Діагностика локального сховища SQLCipher',
    ],
    featuresEn: [
      'Instant language switching between UA and EN',
      'Dark and light themes harmonized with OS preferences',
      'Local SQLCipher encrypted storage health diagnostics',
    ],
    proTipUk: 'Швидкі гарячі клавіші ⌘K дозволяють переходити між розділами за секунду.',
    proTipEn: 'Use ⌘K quick command search to jump between sections in a second.',
  },
};
