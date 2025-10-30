# ---------- dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# 1) Copy root manifests + lockfile FIRST
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# 2) Copy only package.json files for all workspaces (better cache)
COPY packages/**/package.json packages/
COPY apps/**/package.json apps/

# 3) Install using the lockfile
RUN pnpm install --frozen-lockfile

# ---------- build stage ----------
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
RUN apk add --no-cache openssl

COPY . .
RUN pnpm install --frozen-lockfile

# Generate Prisma Client for collab-service
RUN pnpm --filter collab-service prisma:generate

# Build the service
RUN pnpm --filter collab-service build

# ---------- production ----------
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
RUN apk add --no-cache openssl

# Copy everything from build stage (includes node_modules with Prisma client)
COPY --from=build /app .

# Expose port
EXPOSE 3003

# Run migrations before starting the service
CMD ["sh", "-c", "pnpm --filter collab-service prisma migrate deploy && node apps/collab-service/dist/index.js"]
