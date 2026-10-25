import { env } from '@/config/env';

export const urls = {
  server: {
    api: env.E2E_SERVER_API_URL,
    admin: env.E2E_ADMIN_URL,
  },
  local: {
    backend: env.E2E_LOCAL_DB_URL,
    referenceBackend: env.E2E_LOCAL_DB_REFERENCE_URL,
    desktop: env.E2E_DESKTOP_URL,
  },
} as const;
