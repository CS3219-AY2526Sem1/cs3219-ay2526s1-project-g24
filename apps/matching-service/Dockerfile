FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/logger/package.json packages/logger/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/jest-presets/package.json packages/jest-presets/
COPY packages/ui/package.json packages/ui/
COPY apps/matching-service/package.json apps/matching-service/

RUN pnpm install --frozen-lockfile

# ---------- (optional) build stage ----------
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/logger/package.json packages/logger/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/jest-presets/package.json packages/jest-presets/
COPY packages/ui/package.json packages/ui/
COPY apps/matching-service/package.json apps/matching-service/

RUN pnpm install --frozen-lockfile

COPY packages/ packages/
COPY apps/matching-service/ apps/matching-service/

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
