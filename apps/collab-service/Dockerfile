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

# 3) build only collab-service
# this will now find prisma because we just installed deps in this stage
RUN npx turbo build --filter=collab-service

# ---- runner ----
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 collab-service
USER collab-service

COPY --from=installer /app .

CMD ["node", "apps/collab-service/dist/index.js"]
