# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Install pnpm
RUN npm i -g pnpm

# Copy dependency definition files
COPY package.json pnpm-lock.yaml ./

# Fetch dependencies into a cache layer
RUN pnpm fetch

# Stage 2: Build the application
FROM node:18-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm i -g pnpm

# Copy source code and other necessary files
COPY . .

# Copy prisma schema
COPY prisma ./prisma

# Copy fetched dependencies
COPY --from=deps /app/node_modules ./node_modules

# Install dependencies and build the app
RUN pnpm install --offline
RUN pnpm prisma generate
RUN pnpm run build

# Stage 3: Final runtime image
FROM node:18-alpine AS runner
WORKDIR /app

# Copy production dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy compiled code
COPY --from=builder /app/dist ./dist

# Copy package.json to be able to run start script
COPY package.json . 

# The port the application will run on
EXPOSE 8000

# The command to run the application in production
CMD ["pnpm", "start"]
