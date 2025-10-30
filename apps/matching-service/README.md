# Matching Service

Pairs users for coding practice based on difficulty, topics, and programming languages.

## Overview

The matching service queues users for matches based on their criteria. Users remain in the queue until matched or until they disconnect/cancel.

### Key Features
- ⏱️ **Configurable timeout** - Requests timeout after 30s (configurable) if not matched
- 🔄 **Real-time updates** - SSE connection provides live status and elapsed time
- ❌ **Auto-cancellation** - Closing the SSE connection cancels if queued, or redirects to session if matched
- 🎯 **Manual cancellation** - Users can also cancel anytime via API
- 🚀 **Event-driven** - Redis Pub/Sub for instant matching and real-time notifications
- 🛡️ **User deduplication** - Prevents users from creating multiple simultaneous match requests
- 🔒 **SSE connection management** - Prevents multiple SSE connections to the same request
- 💾 **Automatic cleanup** - TTL-based expiration plus atomic timeout popping prevent memory leaks or duplicate processing
- 🎭 **Clear separation** - Matching service only matches; collaboration service handles sessions, if user cancels but is matched, collaboration service should handle it (i.e. indicate that the other user left).
- 🔐 **JWT authentication** - Enforces RS256 access tokens from the user service (local overrides available for tests)

## Architecture

### Tech Stack
- **TypeScript** + **Express.js**
- **Redis** (single instance for everything: queue, state, pub/sub)
- **OpenTelemetry, Prometheus, Pino** (observability)

### System Flow

**High-Level Overview:**
```
Client                API               Redis           Workers
  │                    │                  │                │
  ├─POST /match───────►│──Store + Queue──►│                │
  │                    │                  │                │
  ├─Open SSE──────────►│──Subscribe──────►│                │
  │                    │                  │                │
  │    (waiting...)    │                  │◄─Matcher──────►│ (pairs users)
  │                    │                  │                │
  │                    │                  │◄─Timeout──────►│ (scans every 5s)
  │                    │                  │                │
  │◄──SSE: matched─────┤◄────Pub/Sub──────┤◄───────────────┤
  │    or timeout      │                  │                │
```

**Detailed Steps:**

1. **Request Creation:**
   - Client submits match request → API stores in Redis
   - Added to queue (sorted by timestamp)
   - Added to timeout tracker (deadline = now + 30s)
   - Triggers matcher worker via pub/sub

2. **Active Waiting:**
   - Client opens SSE connection for real-time updates
   - Receives elapsed time every 1 second: "Waiting... 3s"

3. **Two Outcomes (race condition):**
   
   **A) Match Found First:**
   - Matcher worker pops 2 compatible users from queue
   - Creates collaboration session
   - Publishes "matched" event → SSE delivers to both clients
   
  **B) Timeout First:**
  - Timeout worker atomically pops expired requests from the sorted set every 5s
  - Finds expired request (deadline passed)
   - Publishes "timeout" event → SSE delivers to client

### Request States
- `queued` - Waiting for a match
- `matched` - Successfully matched with another user (session created)
- `cancelled` - User cancelled while still queued
- `timeout` - No match found within timeout period

**Note:** Once `matched`, the request is final. The collaboration service handles what happens next (user joins, doesn't join, leaves, etc.).

## Authentication

The matching API requires authenticated users:

- The service expects an RS256 JWT issued by the user service. Provide it via the `Authorization: Bearer <token>` header or the `access_token` cookie.
- The SSE endpoint reuses browser cookies, so initialize it with `withCredentials: true` to propagate the session token.
- JWKS keys are fetched from `AUTH_JWKS_URI` (defaults to `http://localhost:8001/.well-known/jwks.json`).
- Local development and automated tests can opt out by setting `AUTH_DISABLED=true`. When disabled, supply a `x-test-user-id` header or configure `AUTH_FAKE_USER_ID` to choose the acting user.

Requests missing valid credentials receive `401 Unauthorized`.

### Redis Design

**Single Redis instance, multiple use cases:**

1. **Queue**: Sorted Set (`queue:{difficulty}`) - FIFO by timestamp
2. **State**: Hash (`match:req:{reqId}`) - Request metadata with TTL
3. **Worker Trigger**: Pub/Sub (`match:trigger`) - Wakes matcher worker
4. **User Events**: Pub/Sub (`events:{reqId}`) - Real-time SSE notifications
5. **Timeouts**: Sorted Set (`match:timeouts`) - Deadline tracking, atomically popped by timeout worker
6. **User Deduplication**: String (`user:active:{userId}`) - Tracks active requests per user (TTL)
7. **SSE Connection Tracking**: String (`sse:connection:{reqId}`) - Prevents duplicate SSE connections (TTL, atomic SET NX)

### Matching Logic

Two users are compatible if they have:
- ✅ **Same difficulty** (exact match)
- ✅ **At least 1 overlapping topic** (filters out empty strings)
- ✅ **At least 1 overlapping language** (filters out empty strings)
- ✅ **Different user IDs** (prevents matching with self)

### Workers

**Matcher Worker:**
- Subscribes to `match:trigger` pub/sub channel
- Pops 2 requests atomically from queue
- Checks compatibility (including same-user prevention)
- Creates session for compatible pairs
- Uses atomic CAS for state transitions (prevents race conditions)
- Rolls back partial matches if one user was cancelled/timed out
- Cleans up orphaned sessions on rollback
- Removes user active request markers on successful match

**Timeout Worker:**
- Atomically pops expired requests every 5s to prevent double processing
- Uses atomic status updates to prevent race conditions
- Auto-cancels requests after timeout period
- Publishes timeout events to SSE subscribers
- Removes user active request markers on timeout

## API Reference

### Core Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/match/requests` | Submit a match request |
| GET | `/api/v1/match/requests/:reqId/events` | Open SSE connection for real-time updates |
| GET | `/api/v1/match/requests/:reqId` | Get request status |
| DELETE | `/api/v1/match/requests/:reqId` | Cancel a pending request |

### Operational Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/docs` | Swagger UI documentation |
| GET | `/health` | Health check |
| GET | `/-/metrics` | Prometheus metrics |

### Examples

**Submit Match Request:**
```bash
POST /api/v1/match/requests
{
  "userId": "user123",
  "difficulty": "medium",
  "topics": ["algorithms", "data-structures"],
  "languages": ["javascript", "python"]
}

Response: { "reqId": "abc123" }

// Error: User already has active request
409 Conflict
{ "error": "User already has an active match request", "reqId": "existing-req-id" }
```

**Open SSE Connection:**
```javascript
GET /api/v1/match/requests/abc123/events

// Error: Duplicate SSE connection
409 Conflict
event: error
data: {"error":"Another SSE connection already exists for this request"}
```

**SSE Event Stream:**
```javascript
GET /api/v1/match/requests/abc123/events

// Stream of events:
data: {"status":"queued","timestamp":1697385600000,"elapsed":0}
data: {"status":"queued","timestamp":1697385601000,"elapsed":1}
data: {"status":"matched","timestamp":1697385645000,"sessionId":"session456"}
```

## Client Integration

### SSE Client Example

```javascript
// 1. Submit match request
const response = await fetch('/api/v1/match/requests', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <access-token>',
  },
  body: JSON.stringify({
    userId: 'user123',
    difficulty: 'medium',
    topics: ['algorithms', 'data-structures'],
    languages: ['javascript', 'python']
  })
});
const { reqId } = await response.json();

// 2. Open SSE connection
const eventSource = new EventSource(`/api/v1/match/requests/${reqId}/events`, {
  withCredentials: true,
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.status === 'queued') {
    updateUI(`Waiting... ${data.elapsed}s`);
  } else if (data.status === 'matched') {
    window.location.href = `/session/${data.sessionId}`;
  } else if (data.status === 'cancelled') {
    showMessage('Match request cancelled');
  }
};

// 3. Cancel manually (optional)
async function cancel() {
  await fetch(`/api/v1/match/requests/${reqId}`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer <access-token>' },
    credentials: 'include',
  });
  eventSource.close();
}
```

**Important:** 
- Closing the SSE connection (e.g., tab close, navigation) triggers immediate cancellation if still `queued`.
- **If already matched when disconnect occurs**, the matching service returns 409 with the session ID. The **collaboration service** handles what happens next (user joins late, never joins, partner timeout, etc.).
- This provides **clean separation of concerns** - matching service matches users, collaboration service manages sessions.
- Users cannot create multiple simultaneous match requests - attempting to do so returns 409 Conflict.
- Only one SSE connection is allowed per request to prevent duplicate event streams.
- Authenticated clients must continue sending credentials (cookies/headers) when keeping the SSE stream open.

## Testing

### Test Coverage

The matching service includes comprehensive test coverage with **52 tests** across multiple categories:

**Unit Tests:**
- `matcher.test.ts` - Compatibility logic and matching algorithms
- `timeout.test.ts` - Timeout processing and atomic update handling
- `redis.test.ts` - Redis operations and data persistence

**Integration Tests:**
- `api.test.ts` - API endpoints, request validation, and cancellation flows

**Running Tests:**
```bash
npm test
```

### Race Condition Testing

Race conditions **cannot be reliably tested** with automated unit/integration tests because:
- JavaScript is single-threaded - `Promise.all()` doesn't create parallel execution
- Mocked Redis operations complete synchronously
- No real network timing or concurrent access

Instead, use **manual testing with real Redis** to verify race condition handling.

### Manual Race Condition Testing

**Automated Script (Recommended):**

We provide a comprehensive manual testing script that creates real concurrent requests:

```bash
# 1. Start Redis and the service
docker-compose up -d matching_redis
npm run dev

# 2. Run the race condition test script (in another terminal)
./scripts/test-race-conditions.sh
```

**What the script tests:**
1. **Concurrent Cancellations** - 5 simultaneous cancellations, verify only 1 succeeds
2. **Cancel vs Timeout Race** - Cancel requests just before timeout fires
3. **Match with Cancellation** - Try to cancel while matching is in progress
4. **High Concurrency Stress** - 20 concurrent requests with simultaneous cancellations

**Expected Results:**
- ✅ Only one cancellation succeeds per request (others get 409 Conflict)
- ✅ Matched requests cannot be cancelled (get 400/409)
- ✅ No requests have inconsistent state (both matched and cancelled)
- ✅ All requests eventually reach terminal state (matched/cancelled/timeout)

**Manual Commands:**

You can also manually test specific scenarios:

```bash
# Test concurrent cancellations
# Requires either AUTH_DISABLED=true or a valid bearer token exported as $TOKEN
REQ_ID=$(curl -s -X POST http://localhost:3000/api/v1/match/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN:-test-token}" \
  -d '{"userId":"user1","difficulty":"easy","topics":["arrays"],"languages":["python"]}' \
  | jq -r '.reqId')

# Fire 5 cancellations simultaneously
for i in {1..5}; do
  curl -X DELETE "http://localhost:3000/api/v1/match/requests/$REQ_ID" \
    -H "Authorization: Bearer ${TOKEN:-test-token}" &
done
wait

# Check which one succeeded
curl http://localhost:3000/api/v1/match/requests/$REQ_ID
```



### Production Monitoring

Monitor race condition metrics in production:

```bash
# Check for 409 Conflict responses
curl http://localhost:3000/-/metrics | grep http_requests_total | grep 409

# Should show a non-zero count if race conditions occur
```

**What to monitor:**
- 409 Conflict rate (should be low but non-zero under load)
- Requests with inconsistent state (should be zero)
- Atomic update retry success rate

## Development

### Quick Start

```bash
# Start Redis
docker-compose up -d matching_redis

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test
```

### Environment Variables

```bash
PORT=3000                          # API server port
REDIS_HOST=localhost               # Redis host
REDIS_PORT=6379                    # Redis port
REDIS_PASSWORD=                    # Redis password (optional)
MATCH_TIMEOUT_SECONDS=30           # Request timeout
COLLABORATION_SERVICE_URL=...      # Collaboration service endpoint
CORS_ORIGIN=*                      # CORS allowed origins
LOG_LEVEL=info                     # Logging level
AUTH_JWKS_URI=http://localhost:8001/.well-known/jwks.json  # JWKS endpoint for token verification
AUTH_DISABLED=false                # Skip auth checks when true (local dev/tests)
AUTH_FAKE_USER_ID=test-user        # Optional fallback userId when auth disabled
```

### Observability

**Metrics (Prometheus format):**
- `match_queue_length{difficulty}` - Current queue size
- `matches_total{difficulty}` - Successful matches counter
- `sse_connections_active` - Active SSE connections
- `redis_operation_duration_seconds{operation}` - Redis latency histogram

**Access:**
- Swagger UI: `http://localhost:3000/docs`
- Metrics: `http://localhost:3000/-/metrics`
- Health: `http://localhost:3000/health`

## Design Notes

### Why Redis Pub/Sub?

**Event-Driven Matching:**
- Matcher worker is triggered instantly when new requests arrive
- No polling overhead or matching delays
- Horizontally scalable (multiple workers can subscribe)

**Real-Time SSE Updates:**
- Each SSE connection subscribes to per-user channel (`events:{reqId}`)
- Workers publish match results to Redis
- API forwards to connected clients via SSE
- Supports multiple API instances (stateless design)

### Connection Management

- **Immediate cancellation on disconnect**: SSE close → cancel if queued, or redirect to session if matched
- **No session management**: Matching service only creates sessions, doesn't manage them
- **Collaboration service responsibility**: Session joins, leaves, timeouts handled by collaboration service
- **Clean state**: All matching resources cleaned up (queue, timeout, user marker, SSE connection marker)
- **Duplicate prevention**: Users cannot create multiple simultaneous requests (409 Conflict)
- **SSE protection**: Only one SSE connection allowed per request (409 Conflict for duplicates)
- **Automatic expiration**: TTL on Redis keys prevents memory leaks
- **Idempotent operations**: Cancelling an already-cancelled/timed-out request succeeds (200 OK)

### Race Condition Prevention

**Philosophy:** We don't prevent races - we make them **safe** using:
- **Atomic state transitions** (CAS/optimistic locking via Redis WATCH/EXEC)
- **Idempotent operations** (retries are safe)
- **Compensation over rollback** (late cancel = leave session, not undo match)
- **Clear terminal states** (`queued` → `matched|cancelled|timeout` - one-way only)

**Problem:** Multiple operations (matching, cancellation, timeout) can occur simultaneously on the same request, leading to conflicts.

**Solution:** Compare-and-set (CAS) with **compensation for late operations**.

**Race Condition Scenarios Handled:**

1. **Cancel vs Match (Cancel Wins)**
   ```
   T1: User cancels (checks status = "queued")
   T2: Cancel does CAS("queued" → "cancelled") → SUCCESS
   T3: Matcher tries CAS("queued" → "matched") → FAILS
   T4: Matcher rolls back (re-queues partner)
   Result: User cancelled, partner re-queued ✓
   ```

2. **Cancel vs Match (Match Wins - Compensation)**
   ```
   T1: Matcher does CAS("queued" → "matched") → SUCCESS  
   T2: User tries to cancel (checks status = "matched")
   T3: Cancel publishes "partner_left" event (compensation)
   Result: User matched but left session, partner notified ✓
   ```

3. **Timeout vs Match**
   ```
   T1: Timeout worker checks status = "queued"
   T2: Matcher does CAS("queued" → "matched") → SUCCESS
   T3: Timeout tries CAS("queued" → "timeout") → FAILS
   T4: Timeout skips (status already terminal)
   Result: Users matched successfully, timeout ignored ✓
   ```

4. **Match with Partial Cancellation**
   ```
   T1: Matcher pops User A and User B from queue
   T2: User A cancels (CAS "queued" → "cancelled")
   T3: Matcher tries CAS for User A → FAILS
  T4: Matcher rolls back User B to queue using the preserved score
   T5: Matcher deletes orphaned session
   Result: User B re-queued, User A cancelled ✓
   ```

5. **Disconnect After Match (Redirect to Session)**
   ```
   T1: Matcher creates session and sets status="matched"
   T2: User A closes browser (SSE disconnects)
   T3: Disconnect handler checks status = "matched"
   T4: Returns 409 with sessionId
   T5: Frontend redirects user to session
   T6: Collaboration service handles if user doesn't actually join
   Result: Clean separation - matching done, session handling separate ✓
   ```

6. **Same User Matching Prevention**
   ```
   T1: User creates request A
   T2: User creates second request B (rejected with 409)
   Result: Single request per user enforced ✓
   ```

7. **Duplicate SSE Connection Prevention**
   ```
   T1: Client A opens SSE for reqId (atomically marks connection)
   T2: Client B tries to open SSE for same reqId
   T3: Client B receives 409 Conflict
   Result: Only one SSE connection per request ✓
   ```

**Implementation:**

- **Request Creation:** 
  - Checks for existing active request via `getUserActiveRequest(userId)`
  - Returns 409 Conflict if user already has active request
  - Stores request with TTL (timeout + 5 min buffer) to prevent memory leaks
  - Marks user as having active request via `setUserActiveRequest(userId, reqId, ttl)`

- **SSE Connection:**
  - Checks for existing connection via `hasActiveSSEConnection(reqId)`
  - Atomically marks connection using `setActiveSSEConnection(reqId, ttl)` with SET NX
  - Returns 409 Conflict if duplicate connection detected
  - Immediate cleanup on disconnect

- **Cancellation:** `cancelMatchRequest()` uses CAS pattern
  - **If `queued`:** CAS("queued" → "cancelled") with cleanup
  - **If `matched`:** Return 409 with sessionId (redirect to session, let collaboration service handle)
  - **If `cancelled` or `timeout`:** Return success with message (idempotent)
  - Removes user active request marker

- **Timeout:** `handleTimeout()` uses `atomicUpdateRequestStatus("queued" → "timeout")`
  - Timeout worker atomically pops expired entries to avoid duplicate handling
  - CAS fails if already matched/cancelled → skip gracefully
  - Logs current status for debugging
  - Removes user active request marker

- **Matching:** `attemptMatch()` uses CAS for both users and re-queues any still-queued request when its partner disappears mid-match
  - Creates session first (optimistic)
  - CAS("queued" → "matched", sessionId) for user 1
  - CAS("queued" → "matched", sessionId) for user 2
  - **If either CAS fails:** Rollback the other + delete session
  - Prevents same-user matching
  - Removes user active request markers for both users

- **Atomic Operation:** `atomicUpdateRequestStatus()` with WATCH/MULTI/EXEC
  - Only updates if current status matches expected status
  - Retry logic handles transient conflicts (up to 3 attempts)
  - Returns `true` on success, `false` if status changed (lost CAS race)

**Benefits:**
- ✅ No duplicate events (users receive exactly one terminal status)
- ✅ No orphaned sessions (partial match failures are rolled back)
- ✅ Consistent state across all workers (CAS prevents conflicts)
- ✅ Graceful handling of edge cases (compensation > rollback)
- ✅ Clear separation of concerns (matching vs session management)
- ✅ No duplicate requests per user (deduplication enforced)
- ✅ No duplicate SSE connections (atomic connection marking)
- ✅ No memory leaks (TTL on all Redis keys)
- ✅ Idempotent operations (safe to retry)
- ✅ Scales without distributed locks (optimistic concurrency)
