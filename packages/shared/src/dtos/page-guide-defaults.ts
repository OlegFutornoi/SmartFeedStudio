import type { AiAssistantProfileDto, PageGuideDto } from '@/dtos/page-guide.dto';

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
      'Fast filtering by supplier, category, and stock status',
      'Inline price and markup rule editing',
      'Photo gallery with instant preview and R2 status',
    ],
    proTipUk:
      'Використовуйте фільтри за постачальником, щоб швидко застосувати масові зміни до обраної групи товарів.',
    proTipEn:
      'Use supplier filters to quickly isolate and apply batch modifications to specific inventory items.',
  },
  '/suppliers': {
    route: '/suppliers',
    titleUk: 'Постачальники та фіди',
    titleEn: 'Suppliers & Feeds',
    icon: 'Truck',
    badgeUk: 'Джерела',
    badgeEn: 'Sources',
    summaryUk: 'Керування постачальниками, підключеними XML/CSV фідами та синхронізацією.',
    summaryEn: 'Vendor management, connected XML/CSV feeds, and sync automation.',
    descriptionUk:
      'Реєструйте постачальників, підключайте їхні XML/CSV прайси, налаштовуйте правила націнки за замовчуванням та контролюйте періодичність оновлення цін і залишків.',
    descriptionEn:
      'Register vendors, link external XML/CSV feeds, configure default markup percentages, and schedule automatic price and stock updates.',
    featuresUk: [
      'Підключення XML, YML та CSV прайсів за URL або файлом',
      'Кабінет постачальника з табами фідів, правил та аналітики',
      'Автоматичний розрахунок націнки для кожного постачальника',
    ],
    featuresEn: [
      'Ingest XML, YML, and CSV feeds via URL or local file upload',
      'Dedicated vendor drawer with feeds, rules, and analytics tabs',
      'Automatic profit margin calculations per supplier',
    ],
    proTipUk:
      'Налаштовуйте фіксовану націнку або відсоток маржі на рівні постачальника — вона автоматично застосується до всіх товарів з його фідів.',
    proTipEn:
      'Configure margin percentage or fixed markup at the supplier level — it will cascade to all imported products automatically.',
  },
  '/ai': {
    route: '/ai',
    titleUk: 'AI Асистент & Оптимізація',
    titleEn: 'AI Assistant & Copilot',
    icon: 'Sparkles',
    badgeUk: 'AI Двигун',
    badgeEn: 'AI Engine',
    summaryUk: 'Генерація SEO-описів, збагачення атрибутів та оптимізація товарів через AI.',
    summaryEn: 'AI-driven SEO generation, attribute enrichment, and catalog optimization.',
    descriptionUk:
      'Використовуйте штучний інтелект для пакетної генерації продаючих описів товарів, перекладу карток на інші мови, очищення заголовків від сміття та заповнення пропущених характеристик.',
    descriptionEn:
      'Leverage AI to batch-generate compelling product descriptions, translate listings, clean titles, and automatically enrich missing attributes.',
    featuresUk: [
      'Пакетне покращення назв та описів товарів через LLM',
      'Генерація пошукових тегів та SEO-метаданих',
      'Автоматичний переклад каталогу на англійську та українську',
    ],
    featuresEn: [
      'Batch LLM enhancement of titles and product descriptions',
      'Search tag and SEO metadata generation',
      'Instant bilingual catalog translation (UK ⇄ EN)',
    ],
    proTipUk:
      'Перед масовою генерацією описів протестуйте промпт на 2–3 товарах, щоб переконатися у відповідності стилю вашого магазину.',
    proTipEn:
      'Always test AI prompt templates on 2-3 sample items before running batch generation across entire categories.',
  },
  '/license': {
    route: '/license',
    titleUk: 'Тарифний план та ліцензія',
    titleEn: 'License & Subscription',
    icon: 'Key',
    badgeUk: 'Підписка',
    badgeEn: 'Billing',
    summaryUk: 'Інформація про поточний тариф, ліміти товарів, AI-кредити та термін дії.',
    summaryEn: 'Current plan details, SKU capacity, AI credit balance, and expiration.',
    descriptionUk:
      'Переглядайте стан активної ліцензії, використовувані квоти (кількість SKU, місця у команді, дисковий простір R2) та оновлюйте тарифний план.',
    descriptionEn:
      'Monitor your active license status, quota utilization (SKU limit, team seats, R2 storage), and upgrade or extend your plan.',
    featuresUk: [
      'Моніторинг лімітів товарів та дискового сховища',
      'Активація комерційних ліцензійних ключів',
      'Зручний перехід між тарифними планами',
    ],
    featuresEn: [
      'Live tracking of SKU capacity and cloud storage',
      'Commercial license key activation',
      'Seamless plan upgrades and renewals',
    ],
    proTipUk:
      'При наближенні до ліміту SKU активуйте тарифний план вищого рівня, щоб нові фіди не блокувалися під час імпорту.',
    proTipEn:
      'Upgrade your plan before reaching SKU capacity to prevent feed ingestion queues from pausing.',
  },
  '/team': {
    route: '/team',
    titleUk: 'Команда та доступ',
    titleEn: 'Team & Collaboration',
    icon: 'Users',
    badgeUk: 'Команда',
    badgeEn: 'Team',
    summaryUk: 'Управління учасниками команди, ролями та запрошеннями співробітників.',
    summaryEn: 'Team member invitations, role-based access control, and seat management.',
    descriptionUk:
      'Запрошуйте менеджерів та контент-редакторів до вашої організації, призначайте ролі з обмеженим доступом та спільно працюйте над каталогом.',
    descriptionEn:
      'Invite teammates and content specialists, assign granular roles, and collaborate safely on unified catalogs.',
    featuresUk: [
      'Запрошення учасників за електронною поштою',
      'Розподіл ролей (Admin, Member, Viewer)',
      'Контроль використаних місць за ліцензією',
    ],
    featuresEn: [
      'Email invitations with secure single-use tokens',
      'Granular roles (Admin, Member, Viewer)',
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
