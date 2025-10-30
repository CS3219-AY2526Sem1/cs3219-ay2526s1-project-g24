# ---------- deps (install only, for caching) ----------
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# 1) Copy root manifests + lockfile FIRST
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# 2) Copy only package.json files for all workspaces (better cache)
COPY packages/*/package.json packages/
COPY apps/*/package.json apps/

# 3) Install using the lockfile
RUN pnpm install --frozen-lockfile


# ---------- build (real build happens here) ----------
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# 1) Bring over node_modules from deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/pnpm-workspace.yaml ./
COPY --from=deps /app/package.json ./
COPY --from=deps /app/pnpm-lock.yaml ./

# 2) Now copy the entire repo (so we finally have prisma/schema.prisma etc.)
COPY . .

# 3) IMPORTANT: generate Prisma client **after** source is present
RUN pnpm --filter collab-service prisma generate

# 4) (Optional but common) run tests / typecheck here
# RUN pnpm --filter collab-service test

# 5) Build the service
RUN pnpm --filter collab-service build


# ---------- production ----------
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl

# Copy everything from build stage (includes dist + node_modules + generated Prisma client)
COPY --from=build /app ./

# Expose port
EXPOSE 3003

CMD ["node", "apps/collab-service/dist/index.js"]
