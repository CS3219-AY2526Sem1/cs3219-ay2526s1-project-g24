# ---- Node 22 on Alpine Linux ----
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ---- builder: prune for collab-service ----
FROM base AS builder
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app
COPY . .
# 👇 just change the scope
RUN npx turbo prune --scope=collab-service --docker

# ---- installer: install deps for pruned repo ----
FROM base AS installer
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

# 1) install from pruned json
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

# 2) now copy the actual source
COPY --from=builder /app/out/full/ .

# Ensure Prisma schema and migrations are present (turbo prune may exclude migrations)
# Copy directly from the original source context preserved in the builder stage
COPY --from=builder /app/apps/collab-service/prisma ./apps/collab-service/prisma

# 3) Generate Prisma Client before building
WORKDIR /app/apps/collab-service
RUN npx prisma generate
WORKDIR /app

# 4) build only collab-service
# this will now find prisma because we just installed deps in this stage
RUN npx turbo build --filter=collab-service

# ---- runner ----
FROM base AS runner
WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 collab-service

COPY --from=installer --chown=collab-service:nodejs /app .

# Copy entrypoint script that runs migrations before starting the app
# This ensures the database schema is always up-to-date on container start
COPY --chown=collab-service:nodejs apps/collab-service/docker-entrypoint.sh /app/apps/collab-service/
RUN chmod +x /app/apps/collab-service/docker-entrypoint.sh

USER collab-service

ENTRYPOINT ["/app/apps/collab-service/docker-entrypoint.sh"]
