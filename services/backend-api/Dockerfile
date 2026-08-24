# ==============================================================================
# Stage 1: Build stage
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Install OpenSSL & libc for Prisma build
RUN apk add --no-cache openssl libc6-compat

# Copy workspace definition files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/backend-api/package.json ./services/backend-api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code and Prisma schema
COPY packages/shared/ ./packages/shared/
COPY services/backend-api/ ./services/backend-api/

# Generate Prisma Client & Build TypeScript code
RUN pnpm --filter @smartfeed/backend-api prisma:generate
RUN pnpm --filter @smartfeed/shared build
RUN pnpm --filter @smartfeed/backend-api build

# ==============================================================================
# Stage 2: Production runner
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install OpenSSL for Prisma engine runtime
RUN apk add --no-cache openssl libc6-compat

# Create non-root system user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy workspace files for production install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY services/backend-api/package.json ./services/backend-api/
COPY services/backend-api/prisma ./services/backend-api/prisma/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy compiled artifacts from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/services/backend-api/dist ./services/backend-api/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nestjs

EXPOSE 4000

WORKDIR /app/services/backend-api

CMD ["node", "dist/main.js"]
