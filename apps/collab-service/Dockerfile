# Stage 1: Dependencies
FROM node:18-slim AS deps
WORKDIR /app

# Ensure devDependencies are installed (TypeScript, etc.) during build
ENV NODE_ENV=development

# Install pnpm
RUN npm install -g pnpm

# Copy package and prisma files
COPY package.json ./
COPY prisma ./prisma/

# Install dependencies (include dev deps explicitly since we're building)
RUN pnpm install --prod=false --frozen-lockfile=false

# Generate Prisma Client
RUN npx prisma generate

# Stage 2: Builder
FROM node:18-slim AS builder
WORKDIR /app

# Ensure devDependencies are available for build
ENV NODE_ENV=development

# Install pnpm
RUN npm install -g pnpm

# Copy source (package + prisma + src)
COPY package.json ./
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src

# Install dependencies for build (recreate node_modules symlinks properly)
RUN pnpm install --prod=false --frozen-lockfile=false

# Generate Prisma Client (ensures types are available for tsc)
RUN pnpm prisma:generate

# Build
RUN pnpm build

# Stage 3: Runner
FROM node:18-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install pnpm
RUN npm install -g pnpm

# Install Prisma CLI globally for runtime migrations
RUN npm install -g prisma@5.9.1

# Install runtime OS libraries required by Prisma engines on Debian
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
   openssl \
   ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && update-ca-certificates

# Copy necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# Optionally slim dependencies to production only
RUN pnpm prune --prod

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => { if (r.statusCode !== 200) throw new Error('Health check failed'); })"

# Start server
CMD ["node", "dist/index.js"]
