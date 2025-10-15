# Matching Service

Pairs users for coding practice based on difficulty, topics, and programming languages.

## Requirements

| ID | Description |
|----|-------------|
| F1.1 | Accept matching request with difficulty, topics, languages |
| F1.2 | Find compatible peer (same difficulty, topic overlap, language overlap) |
| F1.3 | Allocate session on successful match |
| F1.4 | Timeout after 30 seconds if no match |
| F1.5 | Allow cancellation before match |
| F1.6 | Show timer in queue |

## Tech Stack

- **TypeScript** + **Express.js**
- **Redis** (single dependency for everything)
- **OpenTelemetry, Prometheus, Pino** (observability)

## Architecture

**Redis-only design** - Simple and scalable:

1. **Queue**: Redis Sorted Set (FIFO by timestamp)
2. **Matching**: Redis Pub/Sub triggers worker
3. **Timeout**: Redis key expiration (30s TTL)
4. **Events**: Redis Pub/Sub for SSE
5. **State**: Redis Hash with TTL

Just Redis primitives - no external queue systems needed.

## How It Works

```
POST /v1/match/requests
  ↓
1. Store in Redis (30s TTL)
2. Add to sorted set queue
3. Publish to "match:trigger"
  ↓
Matcher worker (subscribes to pub/sub)
  ↓
1. Pop 2 from queue (atomic)
2. Check compatibility
3. Create session
4. Update both as matched
  ↓
If key expires (30s)
  ↓
Timeout worker (keyspace notifications)
  ↓
Publish timeout event
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/match/requests` | Create match request |
| GET | `/v1/match/requests/:reqId` | Get status |
| DELETE | `/v1/match/requests/:reqId` | Cancel request |
| GET | `/v1/match/requests/:reqId/events` | SSE stream |
| GET | `/docs` | Swagger UI |
| GET | `/-/health` | Health check |
| GET | `/-/metrics` | Prometheus metrics |

## Data Model

**Request** (Redis Hash: `match:req:{reqId}`, 30s TTL):
```
userId: string
difficulty: 'easy' | 'medium' | 'hard'
topics: 'arrays,strings'  (CSV)
languages: 'python,java'  (CSV)
status: 'queued' | 'matched' | 'timeout' | 'cancelled'
createdAt: timestamp
sessionId: (optional)
```

**Queue** (Redis Sorted Set: `queue:{difficulty}`):
- Score = timestamp
- Member = reqId
- ZPOPMIN for atomic FIFO

**Events** (Redis Pub/Sub: `events:{reqId}`):
- Status updates for SSE

## Matching Logic

Compatible if:
- **Difficulty**: Exact match
- **Topics**: At least 1 overlap
- **Languages**: At least 1 overlap

## Workers

### Matcher
- Subscribes to `match:trigger` pub/sub
- Pops 2 requests atomically
- Checks compatibility
- Creates session or re-queues

### Timeout
- Subscribes to Redis key expiration events
- Triggered when request key expires (30s)
- Publishes timeout event

## Running

```bash
# Start Redis
docker-compose up -d redis

# Install
pnpm install

# Run
pnpm dev

# Test
pnpm test
```

## Environment Variables

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
```

## Metrics

- `match_queue_length` - Queue size by difficulty
- `matches_total` - Successful matches
- `match_timeouts_total` - Timeouts
- `redis_operation_duration_seconds` - Redis latency
