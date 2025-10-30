# Collaboration Service

Real-time collaborative coding service for PeerPrep using WebSockets and Yjs CRDT.

## Features

- 🔄 Real-time collaborative editing with conflict-free resolution (Yjs CRDT)
- 👁️ Awareness protocol for cursor positions and user presence
- 💾 Periodic snapshots every 2 minutes for data persistence
- 🔌 Reconnection support with 2-minute grace period
- 📡 Redis Pub/Sub for horizontal scaling across replicas
- 🔐 JWT authentication for WebSocket connections
- 📊 Prometheus metrics for observability

## Tech Stack

- **Runtime**: Node.js 18 + TypeScript
- **Framework**: Express.js (REST API) + ws (WebSocket)
- **CRDT**: Yjs + y-protocols
- **Database**: PostgreSQL (via Prisma ORM)
- **Cache**: Redis (Pub/Sub)
- **Package Manager**: pnpm

## Getting Started

### 🚀 Quick Start (One Command!)

```bash
./start.sh
```

This starts PostgreSQL, Redis, runs migrations, and launches the service!

**Stop everything:**

```bash
./stop.sh
```

See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for more details.

---

### 📖 Manual Setup

#### Prerequisites

- Node.js 18+
- pnpm
- Docker (for PostgreSQL and Redis)

#### Installation

```bash
# Install dependencies
pnpm install

# Start PostgreSQL and Redis
docker compose up -d

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Start development server
pnpm dev
```

#### Environment Variables

Copy `.env.example` to `.env` (already configured for local development):

```bash
cp .env.example .env
```

**Key settings:**

- `ENABLE_MOCK_AUTH=true` - No JWT tokens needed for testing (see [MOCK_AUTH_GUIDE.md](./MOCK_AUTH_GUIDE.md))
- `DATABASE_URL` - Already configured for Docker PostgreSQL
- `REDIS_HOST=localhost` - Already configured for Docker Redis

## API Endpoints

### REST API

```
POST   /v1/sessions                      - Create new session
GET    /v1/sessions/:sessionId           - Get session details
POST   /v1/sessions/:sessionId:terminate - Terminate session
POST   /v1/sessions/:sessionId:rejoin    - Rejoin after disconnect
GET    /v1/sessions/:sessionId/snapshot  - Get latest snapshot

GET    /health                           - Health check
GET    /ready                            - Readiness check
GET    /metrics                          - Prometheus metrics
```

### WebSocket

```
WS     /v1/ws/sessions/:sessionId?token=<JWT>
```

## Development

```bash
# Watch mode
pnpm dev

# Build
pnpm build

# Run tests
pnpm test

# Test with coverage
pnpm test:coverage

# Lint
pnpm lint

# Prisma Studio (database GUI)
pnpm prisma:studio
```

## Architecture

```
┌─────────────┐                 ┌──────────────────┐
│   Client    │◄───WebSocket────►│ Collab Service   │
│  (Monaco +  │    (wss://)     │  (Express + WS)  │
│   Yjs)      │                 │                  │
└─────────────┘                 └────────┬─────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
            ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
            │    Redis     │    │  PostgreSQL  │    │   Question   │
            │   Pub/Sub    │    │  (Sessions)  │    │   Service    │
            │ (Y-updates)  │    │              │    │              │
            └──────────────┘    └──────────────┘    └──────────────┘
```

## Testing

Run the test suite:

```bash
pnpm test
```

For coverage report:

```bash
pnpm test:coverage
```

## Docker

Build the image:

```bash
docker build -t collab-service .
```

Run the container:

```bash
docker run -p 3003:3003 \
  -e DATABASE_URL=postgresql://.. \
  -e REDIS_HOST=redis \
  collab-service
```

## Documentation

See [COLLABORATION_SERVICE_PLAN.md](./COLLABORATION_SERVICE_PLAN.md) for detailed implementation plan.

## License

MIT
