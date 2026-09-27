#!/bin/sh
set -e

echo "🚀 [SmartFeed Backend] Initializing container..."

# Auto-sync Prisma schema with PostgreSQL unless explicitly disabled
if [ "$PRISMA_DB_PUSH" != "false" ]; then
  echo "📦 [SmartFeed Backend] Synchronizing database schema via Prisma..."
  if [ -x "/app/node_modules/.bin/prisma" ]; then
    /app/node_modules/.bin/prisma db push --skip-generate --schema=./prisma/schema.prisma || {
      echo "⚠️ [SmartFeed Backend] Prisma db push encountered an issue, proceeding with application startup..."
    }
  else
    npx prisma db push --skip-generate --schema=./prisma/schema.prisma || {
      echo "⚠️ [SmartFeed Backend] Prisma db push via npx encountered an issue, proceeding with application startup..."
    }
  fi
fi

# Optional database seed on initial boot
if [ "$PRISMA_SEED_ON_BOOT" = "true" ]; then
  echo "🌱 [SmartFeed Backend] Running database seed..."
  node dist/prisma/seed.js || echo "⚠️ [SmartFeed Backend] Seed execution completed with notices."
fi

echo "✨ [SmartFeed Backend] Starting application process..."
exec "$@"
