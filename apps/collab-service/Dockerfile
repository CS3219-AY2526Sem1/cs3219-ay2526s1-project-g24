# ---- Base stage ----
FROM node:18-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# ---- Dependencies stage ----
FROM base AS dependencies
WORKDIR /app

# Copy workspace configuration and lockfile
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy only package.json files first (better caching)
COPY apps/collab-service/package.json ./apps/collab-service/
COPY apps/collab-service/prisma ./apps/collab-service/prisma/

# Install all dependencies (including dev for building)
RUN pnpm install --frozen-lockfile --filter collab-service...

# Generate Prisma Client
WORKDIR /app/apps/collab-service
RUN npx prisma generate

# ---- Build stage ----
FROM base AS builder
WORKDIR /app

# Copy installed dependencies
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/collab-service/node_modules ./apps/collab-service/node_modules
COPY --from=dependencies /app/apps/collab-service/prisma ./apps/collab-service/prisma

# Copy source code and config
COPY apps/collab-service/src ./apps/collab-service/src
COPY apps/collab-service/tsconfig.json ./apps/collab-service/
COPY apps/collab-service/package.json ./apps/collab-service/

# Build the application
WORKDIR /app/apps/collab-service
RUN pnpm build

# ---- Production stage ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy collab-service node_modules (includes generated Prisma client)
COPY --from=dependencies /app/apps/collab-service/node_modules ./apps/collab-service/node_modules

# Copy built application from builder
WORKDIR /app/apps/collab-service
COPY --from=builder /app/apps/collab-service/dist ./dist
COPY --from=builder /app/apps/collab-service/package.json ./package.json

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 collab-service
USER collab-service

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => { if (r.statusCode !== 200) throw new Error('Health check failed'); })"

# Start server
CMD ["node", "dist/index.js"]
