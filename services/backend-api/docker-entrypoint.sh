#!/bin/sh
set -e

echo "🚀 [SmartFeed Backend] Initializing container..."

# Auto-sync Prisma schema with PostgreSQL unless explicitly disabled
if [ "$PRISMA_DB_PUSH" != "false" ]; then
  echo "📦 [SmartFeed Backend] Synchronizing database schema via Prisma..."
  PRISMA_BIN=""
  if [ -x "/app/node_modules/.bin/prisma" ]; then
    PRISMA_BIN="/app/node_modules/.bin/prisma"
  elif [ -x "/app/node_modules/.pnpm/node_modules/.bin/prisma" ]; then
    PRISMA_BIN="/app/node_modules/.pnpm/node_modules/.bin/prisma"
  elif command -v prisma >/dev/null 2>&1; then
    PRISMA_BIN="prisma"
  fi

  if [ -n "$PRISMA_BIN" ]; then
    $PRISMA_BIN db push --schema=./prisma/schema.prisma || {
      echo "⚠️ [SmartFeed Backend] Prisma db push encountered an issue, proceeding with application startup..."
    }
  else
    npx prisma db push --schema=./prisma/schema.prisma || {
      echo "⚠️ [SmartFeed Backend] Prisma db push via npx encountered an issue, proceeding with application startup..."
    }
  fi
fi

# Optional database seed on initial boot
if [ "$PRISMA_SEED_ON_BOOT" = "true" ]; then
  echo "🌱 [SmartFeed Backend] Running database seed..."
  if [ -f dist/prisma/seed.js ]; then
    node dist/prisma/seed.js || echo "⚠️ [SmartFeed Backend] Seed execution completed with notices."
  elif [ -f dist/src/prisma/seed.js ]; then
    node dist/src/prisma/seed.js || echo "⚠️ [SmartFeed Backend] Seed execution completed with notices."
  fi
fi

echo "✨ [SmartFeed Backend] Starting application process..."
exec "$@"
