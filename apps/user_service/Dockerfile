# ---- Node 22 on Alpine Linux ----
FROM node:22-alpine AS base

# Set pnpm as the package manager
# See https://pnpm.io/docker
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
RUN apk update && apk add --no-cache libc6-compat

WORKDIR /app
COPY . .

# Generate a partial monorepo with a pruned lockfile for the app
RUN npx turbo prune --scope=user_service --docker

FROM base AS installer
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

#############################################
# ----  Dependencies ----
COPY --from=builder /app/out/json/ .
# Use pnpm to install dependencies
RUN pnpm install --frozen-lockfile

#############################################
# ----  App ----
COPY --from=builder /app/out/full/ .
RUN npx turbo build --filter=user_service

#############################################
# ----  Start ----
FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 user-service
USER user-service

COPY --from=installer /app .

CMD ["node", "apps/user_service/dist/index.js"]
