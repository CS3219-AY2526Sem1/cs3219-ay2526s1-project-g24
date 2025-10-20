# Collaborative Coding Testing Guide

## Overview
The collaborative coding page has been updated to integrate with your collaboration service using Yjs for real-time collaborative editing.

## Setup

### 1. Install Dependencies
The following packages have been added to the web app:
- `yjs` - CRDT library for conflict-free collaborative editing
- `y-websocket` - WebSocket provider for Yjs
- `y-monaco` - Monaco Editor binding for Yjs
- `monaco-editor` - TypeScript types for Monaco

### 2. Start Required Services

**Collab Service** (Terminal 1):
```bash
cd apps/collab-service
pnpm dev
```
The service should be running on `http://localhost:3003`

**Web Service** (Terminal 2):
```bash
pnpm turbo run dev --filter web
```
The web app should be running on `http://localhost:3000`

## Testing Collaborative Editing

### Step 1: Access the Collaborative Coding Page
Navigate to: `http://localhost:3000/collaborative-coding`

### Step 2: Enter a Session ID
1. You'll see a session ID input field in the header
2. Enter any session ID (e.g., `test-session-123`)
3. Click the "Connect" button

### Step 3: Test with Multiple Browsers
1. Open the same URL in a second browser or incognito window
2. Enter the **same session ID** in both windows
3. Click "Connect" in both windows
4. Start typing in either editor - you should see changes appear in real-time in both windows!

### Connection Status Indicators
- 🟢 **Green dot**: Connected to collaboration service
- 🟡 **Yellow dot (pulsing)**: Connecting...
- 🔴 **Red dot**: Connection error
- ⚪ **Gray dot**: Disconnected

### Features
- **Real-time Sync**: Changes are synchronized instantly across all connected clients
- **Conflict Resolution**: Yjs handles concurrent edits automatically using CRDTs
- **Cursor Awareness**: See where other users are editing (via Yjs awareness)
- **Disconnect/Reconnect**: You can disconnect and reconnect with different session IDs

## Configuration

### Hardcoded Test Values (in page.tsx)
```typescript
const HARDCODED_USER_ID = 'test-user-123';
const HARDCODED_TOKEN = 'test-token';
const COLLAB_SERVICE_URL = 'ws://localhost:3003';
```

### WebSocket Connection
The connection URL format is:
```
ws://localhost:3003/v1/ws/sessions/{sessionId}?token={token}
```

## Troubleshooting

### Connection Errors
1. **Check collab-service is running**: Verify `http://localhost:3003` is accessible
2. **Check ENABLE_MOCK_AUTH**: In `apps/collab-service/.env`, ensure `ENABLE_MOCK_AUTH=true`
3. **Browser console**: Check for WebSocket errors in DevTools

### Database Issues
The collab-service requires a PostgreSQL database. Check:
```bash
cd apps/collab-service
# Check .env file has valid DATABASE_URL
cat .env | grep DATABASE_URL
```

### Redis Issues
The collab-service uses Redis for session management. Ensure Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

## Architecture

### Components
1. **Yjs Document (Y.Doc)**: Shared CRDT document
2. **WebSocket Provider**: Connects to collab-service WebSocket
3. **Monaco Binding**: Syncs Monaco editor with Yjs document
4. **Awareness**: Tracks cursor positions and user presence

### Flow
1. User enters session ID and clicks "Connect"
2. WebSocket connection established to collab-service
3. Yjs document created and synced via WebSocket
4. Monaco editor bound to Yjs text type
5. All edits automatically synchronized across clients

## Next Steps

### For Production
1. Replace hardcoded `HARDCODED_USER_ID` with actual user ID from auth
2. Replace `HARDCODED_TOKEN` with real JWT token
3. Get session ID from URL params or API call instead of manual input
4. Add proper error handling and retry logic
5. Add UI for showing connected users
6. Add cursor decorations for other users' positions

### Recommended Improvements
- Show list of connected users
- Display cursor colors for each user
- Add "Copy Session ID" button
- Auto-reconnect on connection loss
- Save code to backend periodically
- Add session history/versioning
