#!/bin/sh
set -e

echo "🚀 [SmartFeed Backend] Initializing container..."

# Database schema migration strategy (DB-11: Zero-Downtime Expand/Contract)
if [ "$PRISMA_MIGRATE_DEPLOY" = "true" ] || [ -d "./prisma/migrations" ] && [ "$PRISMA_DB_PUSH" != "true" ]; then
  echo "📦 [SmartFeed Backend] Applying database migrations via prisma migrate deploy..."
  PRISMA_BIN=""
  if [ -x "/app/node_modules/.bin/prisma" ]; then
    PRISMA_BIN="/app/node_modules/.bin/prisma"
  elif [ -x "/app/node_modules/.pnpm/node_modules/.bin/prisma" ]; then
    PRISMA_BIN="/app/node_modules/.pnpm/node_modules/.bin/prisma"
  elif command -v prisma >/dev/null 2>&1; then
    PRISMA_BIN="prisma"
  fi

  if [ -n "$PRISMA_BIN" ]; then
    $PRISMA_BIN migrate deploy --schema=./prisma/schema.prisma || {
      echo "⚠️ [SmartFeed Backend] Prisma migrate deploy encountered an issue, proceeding with application startup..."
    }
  else
    npx prisma migrate deploy --schema=./prisma/schema.prisma || {
      echo "⚠️ [SmartFeed Backend] Prisma migrate deploy via npx encountered an issue, proceeding with application startup..."
    }
  fi
elif [ "$PRISMA_DB_PUSH" = "true" ]; then
  echo "⚠️ [SmartFeed Backend] Using prisma db push (development/ephemeral only)..."
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
