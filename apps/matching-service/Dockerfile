FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable

# 1) Copy root manifests + lockfile FIRST
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# 2) Copy only package.json files for all workspaces (better cache)
COPY packages/**/package.json packages/
COPY apps/**/package.json apps/

# 3) Install using the lockfile
RUN pnpm install --frozen-lockfile

# ---------- (optional) build stage ----------
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy all package.json files to resolve workspace dependencies
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/logger/package.json packages/logger/
COPY apps/matching-service/package.json apps/matching-service/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ packages/
COPY apps/matching-service/ apps/matching-service/

# Build the service
RUN pnpm --filter matching-service build

# ---------- production ----------
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

# copy only lockfile & root manifests
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# copy only the service package.json so pnpm knows which deps to install
COPY apps/matching-service/package.json apps/matching-service/

# install only production deps for the matching-service
RUN pnpm install --prod --frozen-lockfile --filter ./apps/matching-service...

# copy the built dist from build stage
COPY --from=build /app/apps/matching-service/dist ./apps/matching-service/dist

# copy the openapi spec file
COPY --from=build /app/apps/matching-service/openapi ./apps/matching-service/openapi

CMD ["node", "apps/matching-service/dist/index.js"]
