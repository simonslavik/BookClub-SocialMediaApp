# � Real-Time BookClub Service

A WebSocket-based book club platform where users can join clubs, discuss books, and chat in real-time!

## ✨ Features

- **Real-time Chat**: Discuss books with other members instantly
- **Book Clubs**: Create public/private clubs for your favorite books
- **User Presence**: See who's online in your club
- **WebSocket Powered**: Low-latency bi-directional communication
- **Authentication**: Secure club creation with JWT authentication
- **Persistent Clubs**: Save and return to your book clubs

## 📡 API Endpoints

### Authentication Required

#### Create New Book Club

```http
POST /bookclubs
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Classic Literature Club",
  "isPublic": true
}
```

Response:

```json
{
  "roomId": "uuid-here",
  "message": "Room created successfully"
}
```

#### Get My Rooms

```http
GET /my-rooms
Authorization: Bearer <access_token>
```

Returns all rooms created by the authenticated user.

### Public Endpoints

#### Get All Rooms

```http
GET /rooms
# Optional: GET /rooms?mine=true (requires auth to filter by user)
```

#### Get Room Info

```http
GET /rooms/:roomId
```

Returns room details, code, creator ID, and currently connected users.

#### Health Check

```http
GET /health
```

## 🎯 How It Works

### WebSocket Flow

```
Client                                Server
  │                                     │
  ├──────── Connect ─────────────────→ │
  │                                     │
  ├──────── Join Room ───────────────→ │
  │                                     │
  │←────── Init (current code) ─────── │
  │                                     │
  ├──────── Type "hello" ────────────→ │
  │                                     ├──→ Broadcast to other clients
  │                                     │
  │←────── Code Update ────────────────┤
  │                                     │
```

### Message Types

#### Client → Server

**1. Join Room**

```json
{
  "type": "join",
  "roomId": "uuid-here",
  "username": "Alice"
}
```

**2. Code Change**

```json
{
  "type": "code-change",
  "code": "console.log('hello');"
}
```

**3. Cursor Move**

```json
{
  "type": "cursor-move",
  "cursor": { "line": 5, "column": 12 }
}
```

#### Server → Client

**1. Initialize**

```json
{
  "type": "init",
  "clientId": "your-client-id",
  "code": "// current code",
  "users": [{ "id": "...", "username": "Alice" }]
}
```

**2. Code Update**

```json
{
  "type": "code-update",
  "code": "// updated code",
  "userId": "who-changed-it"
}
```

**3. User Events**

```json
{
  "type": "user-joined",
  "user": { "id": "...", "username": "Bob" }
}
```

## 🚀 Quick Start

### 1. Start the Service

```bash
# With Docker Compose (recommended)
docker-compose up -d collab-editor

# Or locally
cd collab-editor
npm install
npm run dev
```

### 2. Open in Browser

Go to: **http://localhost:4000**

### 3. Create or Join Room

- **Create New Room**: Leave room ID blank and click "Create New Room"
- **Join Existing Room**: Enter room ID and click "Join Room"

### 4. Share the Room

Share the room ID with others:

```
http://localhost:4000?room=YOUR-ROOM-ID
```

## 📡 API Endpoints

### HTTP Endpoints

```bash
# Health check
GET /health

# Create new room
POST /rooms
Response: { "roomId": "uuid" }

# Get room info
GET /rooms/:roomId
Response: { "roomId": "...", "code": "...", "connectedUsers": [...] }
```

### WebSocket Endpoint

```javascript
const ws = new WebSocket("ws://localhost:4000");

// Send messages
ws.send(JSON.stringify({ type: "join", roomId: "...", username: "Alice" }));

// Receive messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message);
};
```

## 🎓 Learn WebSockets

### Key Concepts

**1. Persistent Connection**

```javascript
// HTTP: One request, one response, connection closes
fetch("/api/data");

// WebSocket: Connection stays open
const ws = new WebSocket("ws://localhost:4000");
ws.onmessage = (event) => {
  /* receives data anytime */
};
```

**2. Bi-directional**

```javascript
// Client can send
ws.send("Hello server");

// Server can send (without client asking)
ws.send("Hello client");
```

**3. Real-time**

- No polling needed
- Instant updates
- Low latency

### Server-Side (Node.js with 'ws')

```typescript
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 4000 });

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (data) => {
    console.log("Received:", data);
    ws.send("Echo: " + data);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
```

### Client-Side (Browser)

```javascript
const ws = new WebSocket("ws://localhost:4000");

ws.onopen = () => {
  console.log("Connected!");
  ws.send("Hello server");
};

ws.onmessage = (event) => {
  console.log("Received:", event.data);
};

ws.onclose = () => {
  console.log("Disconnected");
};

ws.onerror = (error) => {
  console.error("Error:", error);
};
```

## 🎨 Customize

### Change Port

```yaml
# docker-compose.yml
collab-editor:
  environment:
    PORT: 5000 # Change to your preferred port
  ports:
    - "5000:5000"
```

### Add Authentication

Add JWT verification before allowing room join:

```typescript
ws.on("message", (data) => {
  const message = JSON.parse(data);

  if (message.type === "join") {
    // Verify JWT token
    const decoded = jwt.verify(message.token, JWT_SECRET);

    // Then allow join
    handleJoin(ws, message);
  }
});
```

### Persist Code to Database

```typescript
async function handleCodeChange(message) {
  // Save to database
  await prisma.room.update({
    where: { id: currentClient.roomId },
    data: { code: message.code },
  });

  // Then broadcast
  broadcast(room, { type: "code-update", code: message.code });
}
```

## 🔧 Troubleshooting

### WebSocket Connection Fails

```javascript
// Check if using correct protocol
ws://localhost:4000  ✅
wss://localhost:4000 ❌ (unless you have SSL)
http://localhost:4000 ❌ (that's HTTP, not WebSocket)
```

### Changes Not Syncing

1. Check browser console for errors
2. Verify WebSocket is connected: `ws.readyState === WebSocket.OPEN`
3. Check server logs: `docker logs collab-editor`

### Room Not Found

- Room IDs are temporary (stored in memory)
- Rooms are deleted when last user leaves
- Need persistence? Add database storage

## 📚 Next Steps

### Add More Features

1. **Syntax Highlighting**: Use CodeMirror or Monaco Editor
2. **Multiple Files**: Support file tree structure
3. **Chat**: Add chat alongside code
4. **Voice/Video**: Integrate WebRTC
5. **Version History**: Track all changes
6. **Conflict Resolution**: Handle simultaneous edits better

### Production Deployment

1. **Add SSL**: Use `wss://` instead of `ws://`
2. **Load Balancing**: Use Redis adapter for multiple servers
3. **Persistence**: Store rooms in database
4. **Authentication**: Require login to join rooms
5. **Rate Limiting**: Prevent spam

## 🎉 You Did It!

You now have a working real-time collaborative code editor!

**Test it:**

1. Open http://localhost:4000 in two browser windows
2. Create a room in one window
3. Copy the room ID and join from the other window
4. Start typing - watch it sync in real-time! ✨
