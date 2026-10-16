import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://docs.smartfeed.studio',
  integrations: [
    starlight({
      title: 'SmartFeed Studio Docs',
      description: 'Enterprise XML/CSV Feed Management, Tauri v2 Desktop & NestJS CQRS Architecture Guide',
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'Українська',
          lang: 'uk',
        },
        en: {
          label: 'English',
          lang: 'en',
        },
      },
      social: {
        github: 'https://github.com/OlegFutornoi/SmartFeedStudio',
      },
      sidebar: [
        {
          label: 'Огляд платформи',
          translations: { en: 'Platform Overview' },
          autogenerate: { directory: 'overview' },
        },
        {
          label: 'Архітектура & Стек',
          translations: { en: 'Architecture & Tech Stack' },
          autogenerate: { directory: 'architecture' },
        },
        {
          label: 'База даних (Prisma)',
          translations: { en: 'Database Schema' },
          autogenerate: { directory: 'database' },
        },
        {
          label: 'Бекенд (NestJS CQRS)',
          translations: { en: 'Backend API' },
          autogenerate: { directory: 'backend' },
        },
        {
          label: 'Десктоп (Tauri v2)',
          translations: { en: 'Desktop Client' },
          autogenerate: { directory: 'desktop' },
        },
        {
          label: 'Панель адміністратора',
          translations: { en: 'Admin Portal' },
          autogenerate: { directory: 'admin' },
        },
        {
          label: 'QA & Бенчмарки',
          translations: { en: 'Testing & QA' },
          autogenerate: { directory: 'testing' },
        },
        {
          label: 'Часті запитання (FAQ)',
          translations: { en: 'FAQ' },
          autogenerate: { directory: 'faq' },
        },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
  ],
});
