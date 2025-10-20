# Matching Service

Pairs users for coding practice based on difficulty, topics, and programming languages.

## Matching Behavior

### Overview
The matching service queues users for matches based on their criteria. Users remain in the queue until matched or until they disconnect/cancel.

### Key Features
- ⏱️ **Configurable timeout** - Requests timeout after MATCH_TIMEOUT_SECONDS (default: 30s) if not matched
- 🔄 **Real-time updates** - SSE connection provides live status and elapsed time
- ❌ **Auto-cancellation on disconnect** - Closing the SSE connection automatically cancels the request
- 🎯 **Manual cancellation** - Users can also cancel anytime via API

### Request Lifecycle

```
User submits match request
         ↓
Request stored in Redis (no TTL)
         ↓
Added to matching queue
         ↓
Opens SSE connection (/match/:reqId/events)
         ↓
┌────────┴────────┐
│   Waiting...    │ ← User waits while SSE is active
│   (SSE active)  │    Matcher runs in background
└────────┬────────┘
         ↓
┌────────┴───────────────────────────────────┐
│                                            │
│  Match found!              User disconnects│
│  ✅ Status: "matched"      ❌ SSE closes    │
│  📍 sessionId provided     🔄 Auto-cancel  │
│  🔌 SSE ends               📝 Status: "cancelled"
│                                            │
│           OR               OR              │
│                                            │
│  User manually cancels                     │
│  ❌ DELETE /match/:reqId                   │
│  📝 Status: "cancelled"                    │
│  🔌 SSE ends                               │
└────────────────────────────────────────────┘
```

**Important:** Closing the SSE connection (e.g., closing the browser tab) automatically cancels the match request. This prevents abandoned requests from staying in the queue.

### Valid Request States
- `queued` - Waiting for a match
- `matched` - Successfully matched with another user
- `cancelled` - User cancelled the request

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
3. **State**: Redis Hash (no TTL - persists until matched/cancelled)
4. **Events**: Redis Pub/Sub for SSE

Just Redis primitives - no external queue systems needed.

## How It Works

```
POST /match
  ↓
1. Store in Redis (no TTL)
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
User waits indefinitely...
  ↓
SSE sends periodic updates every 1s
(shows elapsed time)
```

## API Endpoints

### POST /match
Submit a match request and get a request ID.

**Request:**
```json
{
  "userId": "user123",
  "difficulty": "medium",
  "topics": ["algorithms", "data-structures"],
  "languages": ["javascript", "python"]
}
```

**Response:**
```json
{
  "reqId": "abc123"
}
```

### GET /match/:reqId/events
Open SSE connection to receive real-time updates.

**Event Stream:**
```
data: {"status":"queued","timestamp":1697385600000,"elapsed":0}

data: {"status":"queued","timestamp":1697385601000,"elapsed":1}

data: {"status":"queued","timestamp":1697385602000,"elapsed":2}
...
data: {"status":"matched","timestamp":1697385645000,"sessionId":"session456"}
```

### DELETE /match/:reqId
Cancel a pending match request.

**Response:**
```json
{
  "message": "Request cancelled"
}
```

### GET /match/:reqId
Check the status of a match request.

**Response:**
```json
{
  "status": "queued",
  "userId": "user123",
  "difficulty": "medium",
  "topics": "algorithms,data-structures",
  "languages": "javascript,python",
  "createdAt": "1697385600000"
}
```

### Additional Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/docs` | Swagger UI |
| GET | `/-/health` | Health check |
| GET | `/-/metrics` | Prometheus metrics |

## Data Model

**Request** (Redis Hash: `match:req:{reqId}`, no TTL):
```
userId: string
difficulty: 'easy' | 'medium' | 'hard'
topics: 'arrays,strings'  (CSV)
languages: 'python,java'  (CSV)
status: 'queued' | 'matched' | 'cancelled'
createdAt: timestamp
sessionId: (optional, set when matched)
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

### Timeout Worker
The timeout worker monitors requests and automatically cancels them after MATCH_TIMEOUT_SECONDS (configurable via environment variable, default: 30 seconds) if they haven't been matched.

## Client-Side Implementation

Example SSE client:

```javascript
// Open SSE connection
const eventSource = new EventSource(`/match/${reqId}/events`);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.status === 'queued') {
    // Show elapsed time
    console.log(`Waiting... ${data.elapsed}s`);
  } else if (data.status === 'matched') {
    // Match found!
    console.log(`Matched! Session: ${data.sessionId}`);
    // Navigate to collaboration session
    window.location.href = `/session/${data.sessionId}`;
  } else if (data.status === 'cancelled') {
    // Request was cancelled
    console.log('Match request cancelled');
  }
};

// To cancel manually
async function cancel() {
  await fetch(`/match/${reqId}`, { method: 'DELETE' });
  eventSource.close();
}

// IMPORTANT: Closing the SSE connection auto-cancels the request
// This happens automatically when:
// - User closes the tab/window
// - User navigates away
// - EventSource.close() is called
// No need for manual cleanup in beforeunload
```

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
- `sse_connections` - Active SSE connections
- `redis_operation_duration_seconds` - Redis latency

## Notes

- **Auto-cancellation**: Closing the SSE connection automatically cancels the match request
- **No orphaned requests**: Since disconnection cancels requests, there are no abandoned requests in the queue
- **Connection required**: Users must maintain an active SSE connection to stay in the matching queue
- **Manual cancellation**: Users can also cancel explicitly via `DELETE /match/:reqId`
- **Re-enabling timeouts**: If needed, see implementation notes in `src/index.ts` and `src/workers/timeout.ts`
