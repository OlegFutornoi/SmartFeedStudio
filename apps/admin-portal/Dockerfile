# ==============================================================================
# Stage 1: Build stage
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Install libc for native dependencies
RUN apk add --no-cache libc6-compat

# Copy workspace definition files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/admin-portal/package.json ./apps/admin-portal/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY apps/admin-portal/ ./apps/admin-portal/

# Build shared library & Next.js admin portal
RUN pnpm --filter @smartfeed/shared build
RUN pnpm --filter @smartfeed/admin-portal build

# ==============================================================================
# Stage 2: Production runner
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root system user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone build output
COPY --from=builder /app/apps/admin-portal/public ./apps/admin-portal/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-portal/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-portal/.next/static ./apps/admin-portal/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/admin-portal/server.js"]
