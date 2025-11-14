# Collaboration Service

Real-time collaborative coding service for PeerPrep using WebSockets and Yjs CRDT.

## Features

- 🔄 Real-time collaborative editing with conflict-free resolution (Yjs CRDT)
- 👁️ Awareness protocol for cursor positions and user presence
- 🎯 Smart session management with automatic cleanup (ghost sessions, AFK timeouts)
- 🔚 End Session functionality - terminates session for both users
- 💾 Periodic snapshots every 2 minutes for data persistence
- 🔌 Reconnection support with 10-minute grace period
- 📡 Redis Pub/Sub for horizontal scaling across replicas
- 🔐 JWT authentication with JWKS (RS256) for WebSocket connections
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

## Session Management

### Automatic Cleanup

The service includes smart session management to prevent resource waste:

**Ghost Session Cleanup (60s):**
- Detects sessions where no users connect after matching
- Automatically deletes after 1 minute
- Prevents orphaned sessions when users close tabs

**Solo Session Timeout (5min):**
- Warning at 4 minutes if only 1 user connected
- Auto-terminates at 5 minutes if partner never joins
- Prevents indefinite waiting and resource hogging

**AFK Detection (30min):**
- Expires sessions with no activity for 30+ minutes
- Periodic cleanup runs every 5 minutes
- Frees up server resources automatically

**Rejoin Grace Period (10min):**
- Users can reconnect within 10 minutes of disconnect
- Prevents session deletion from temporary network issues
- Session remains active during grace period

### End Session Flow

When a user clicks "End Session":
1. Backend terminates session for **both users**
2. WebSocket closes with code `4000` (session terminated)
3. Partner receives single notification toast
4. Status changes to "ended" (🟠 orange indicator)
5. Button changes to "Return to Home" (gray)
6. **No reconnection spam** - auto-reconnect disabled

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
