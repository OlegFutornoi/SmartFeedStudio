# ==============================================================================
# Stage 1: Build stage
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Install OpenSSL & libc for Prisma build (with resilient mirror fallback)
RUN apk add --no-cache openssl libc6-compat || \
    (sed -i 's/dl-cdn.alpinelinux.org/uk.alpinelinux.org/g' /etc/apk/repositories && apk update && apk add --no-cache openssl libc6-compat) || \
    true

# Copy workspace definition files (all packages declared in pnpm-workspace.yaml to satisfy frozen-lockfile)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/backend-api/package.json ./services/backend-api/
COPY apps/admin-portal/package.json ./apps/admin-portal/
COPY apps/desktop/package.json ./apps/desktop/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code and Prisma schema
COPY packages/shared/ ./packages/shared/
COPY services/backend-api/ ./services/backend-api/

# Safe placeholder DATABASE_URL so Prisma Client can be generated at build-time without live DB
ENV DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/smartfeed_db?schema=public"

# Generate Prisma Client & Build TypeScript code
RUN pnpm --filter @smartfeed/backend-api prisma:generate
RUN pnpm --filter @smartfeed/shared build
RUN pnpm --filter @smartfeed/backend-api build

# ==============================================================================
# Stage 2: Production runner
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV NODE_PATH="/app/node_modules:/app/services/backend-api/node_modules"

# Install OpenSSL for Prisma engine runtime (with resilient mirror fallback)
RUN apk add --no-cache openssl libc6-compat || \
    (sed -i 's/dl-cdn.alpinelinux.org/uk.alpinelinux.org/g' /etc/apk/repositories && apk update && apk add --no-cache openssl libc6-compat) || \
    true

# Create non-root system user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy workspace dependencies & built assets from builder
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared ./packages/shared
COPY --from=builder --chown=nestjs:nodejs /app/services/backend-api/package.json ./services/backend-api/
COPY --from=builder --chown=nestjs:nodejs /app/services/backend-api/node_modules ./services/backend-api/node_modules
COPY --from=builder --chown=nestjs:nodejs /app/services/backend-api/dist ./services/backend-api/dist
COPY --from=builder --chown=nestjs:nodejs /app/services/backend-api/prisma ./services/backend-api/prisma
COPY --from=builder --chown=nestjs:nodejs /app/services/backend-api/prisma.config.ts ./services/backend-api/prisma.config.ts
COPY --chown=nestjs:nodejs services/backend-api/docker-entrypoint.sh ./services/backend-api/docker-entrypoint.sh
RUN chmod +x ./services/backend-api/docker-entrypoint.sh

USER nestjs

EXPOSE 4000

WORKDIR /app/services/backend-api

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["sh", "-c", "if [ -f dist/src/main.js ]; then exec node dist/src/main.js; else exec node dist/main.js; fi"]

