# API Routes & Database Schema — The Gathering

> Cập nhật: 2026-04-23 | Reference cho AI agent

---

## Base URL

```
Backend: http://localhost:3000   (dev)
WS:      ws://localhost:3000/ws  (dev)
```

Auth header (mọi route protected): `Authorization: Bearer <jwt_token>`

---

## Auth Routes — `/api/auth`

### POST `/api/auth/google`
Xác thực qua Google One Tap.

**Body:**
```json
{ "credential": "<google_id_token>" }
```
**Response:**
```json
{
  "success": true,
  "user": { "id": "", "email": "", "displayName": "", "avatarUrl": "" },
  "token": "<jwt>"
}
```

---

### POST `/api/auth/otp/request`
Gửi OTP 6 chữ số qua email. OTP expires sau 5 phút.

**Body:**
```json
{ "email": "user@example.com" }
```
**Response:** `{ "success": true, "message": "OTP sent successfully" }`

---

### POST `/api/auth/otp/verify`
Xác thực OTP và đổi lấy JWT.

**Body:**
```json
{ "email": "user@example.com", "code": "123456" }
```
**Response:**
```json
{
  "success": true,
  "user": { "id": "", "email": "", "displayName": "", "avatarUrl": "" },
  "token": "<jwt>"
}
```

---

### PUT `/api/auth/profile` 🔒
Cập nhật profile người dùng.

**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{ "displayName": "New Name", "avatarUrl": "https://..." }
```
**Response:** `{ "success": true, "user": { ... } }`

---

## Room Routes — `/api/rooms` 🔒

> Tất cả room routes đều yêu cầu JWT.

### GET `/api/rooms`
Lấy danh sách phòng của user hiện tại (owned + member).  
Có self-healing logic cho dữ liệu cũ bị corrupt.

**Response:**
```json
{ "success": true, "rooms": [{ "_id": "", "name": "", "code": "", "ownerId": {...}, "members": [...] }] }
```

---

### POST `/api/rooms`
Tạo phòng mới. User là owner và member đầu tiên.

**Body:**
```json
{ "name": "My Room", "code": "abc123" }
```
**Response:** `{ "success": true, "room": { ... } }`

---

### POST `/api/rooms/join/:code`
Join vào phòng bằng room code. Thêm user vào `members[]` nếu chưa có.

**Params:** `:code` — room code string  
**Response:** `{ "success": true, "room": { ... } }`

---

### GET `/api/rooms/:id/members`
Lấy danh sách members đã populate (có displayName, email, avatarUrl).  
`:id` có thể là MongoDB ObjectId hoặc room code.

**Response:**
```json
{ "success": true, "members": [{ "_id": "", "displayName": "", "email": "", "avatarUrl": "" }] }
```

---

### POST `/api/rooms/:id/kick` 🔒 (owner only)
Kick member ra khỏi phòng.

**Body:** `{ "userId": "<member_mongodb_id>" }`  
**Response:** `{ "success": true, "message": "Member kicked successfully" }`

---

### PATCH `/api/rooms/:id` 🔒 (owner only)
Cập nhật thông tin phòng (hiện tại chỉ `name`).

**Body:** `{ "name": "New Room Name" }`  
**Response:** `{ "success": true, "room": { ... } }`

---

### DELETE `/api/rooms/:id` 🔒 (owner only)
Xóa phòng.

**Response:** `{ "success": true, "message": "Room deleted successfully" }`

---

## Event Routes — `/api/events` 🔒

### GET `/api/events`
Lấy events mà user là host hoặc được mời (guestEmails).

**Response:**
```json
{
  "success": true,
  "events": [{
    "_id": "", "title": "", "description": "",
    "roomId": { "code": "", "name": "" },
    "hostId": { "displayName": "", "avatarUrl": "" },
    "startTime": "ISO", "endTime": "ISO",
    "guestEmails": ["..."]
  }]
}
```

---

### POST `/api/events`
Tạo event mới. Nếu `roomId = "new"` thì tự tạo room mới luôn.  
Gửi email mời cho `guestEmails` (nếu có).

**Body:**
```json
{
  "roomId": "<mongo_id hoặc 'new'>",
  "hostId": "<user_mongo_id>",
  "title": "Team Sync",
  "description": "Weekly sync",
  "startTime": "2026-04-24T09:00:00Z",
  "endTime": "2026-04-24T10:00:00Z",
  "guestEmails": ["a@b.com", "c@d.com"]
}
```
**Response:** `{ "success": true, "event": { ... } }`

---

## Forum Routes — `/api/forum`

### GET `/api/forum/topics`
Lấy tất cả topics (public, không cần auth).

**Response:** `{ "success": true, "topics": [{ "_id": "", "title": "", "authorId": "", "replies": [...] }] }`

---

### POST `/api/forum/topics` 🔒
Tạo topic mới.

**Body:** `{ "title": "Topic title" }`  
**Response:** `{ "success": true, "topic": { ... } }`

---

### POST `/api/forum/topics/:id/replies` 🔒
Thêm reply vào topic.

**Body:** `{ "content": "Reply content" }`  
**Response:** `{ "success": true, "topic": { ... } }`

---

### DELETE `/api/forum/topics/:id` 🔒
Xóa topic (chỉ author của topic mới được xóa).

**Response:** `{ "success": true }`

---

## Resource Routes — `/api/resources`

### GET `/api/resources`
Lấy danh sách tài nguyên học tập. Hỗ trợ filter/search.

**Query params:**
- `search` — full-text search (title + tags + description)
- `type` — `"guide"` | `"e-book"` | `"course"`
- `tag` — filter by tag string

**Response:**
```json
{ "success": true, "resources": [{ "_id": "", "title": "", "contentType": "", "fileUrl": "", "tags": [] }] }
```

---

## LiveKit Token — `/api/livekit/token`

### GET `/api/livekit/token`
Lấy LiveKit access token để join video room.

**Query params:**
- `room` — room name (convention: `[userId1]--[userId2]` sorted)
- `username` — display name trong LiveKit room

**Response:** `{ "token": "<livekit_jwt>" }`

---

## WebSocket — `ws://localhost:3000/ws`

**Query:** `?room=<roomCode>`

**Client → Server:**
```json
{ "type": "move", "payload": { "x": 0, "y": 0, "isSitting": false, "character": "Adam", "userId": "", "displayName": "", "avatarUrl": "" } }
```

**Server → Client:**
```json
// On connect
{ "type": "initial_state", "payload": { "players": {} } }

// On other player move
{ "type": "player_moved", "payload": { "id": "<wsId>", "x": 0, "y": 0, "isSitting": false, "character": "Adam", "userId": "", "displayName": "", "avatarUrl": "" } }

// On player disconnect
{ "type": "player_left", "payload": { "id": "<wsId>" } }
```

---

## Database Schema (Mongoose)

### Collection: `users`

```typescript
{
  email: String,          // unique, required
  displayName: String,
  avatarUrl: String,
  googleId: String,       // unique sparse (optional, Google OAuth)
  otpCode: String,        // temporary OTP code (6 digits)
  otpExpiresAt: Date,     // OTP expiry (5 min after issue)
  createdAt: Date,        // auto (timestamps)
  updatedAt: Date         // auto (timestamps)
}
```

---

### Collection: `rooms`

```typescript
{
  name: String,           // required — display name
  code: String,           // required, unique — join code (short slug)
  ownerId: ObjectId,      // ref: User, required
  members: [ObjectId],    // ref: User[]
  createdAt: Date,
  updatedAt: Date
}
```

> Note: `code` là string người dùng nhập để join (vd: "abc123"), không phải `_id`. Route `/room/:roomCode` dùng `code` này.

---

### Collection: `events`

```typescript
{
  title: String,          // required
  description: String,    // default ""
  roomId: ObjectId,       // ref: Room, required
  hostId: ObjectId,       // ref: User, required
  startTime: Date,        // required
  endTime: Date,          // required
  guestEmails: [String],  // danh sách email khách mời
  createdAt: Date,
  updatedAt: Date
}
```

---

### Collection: `forumtopics`

```typescript
{
  title: String,          // required
  authorId: ObjectId,     // ref: User, required
  replies: [{
    authorId: ObjectId,   // ref: User, required
    content: String,      // required
    createdAt: Date       // default: Date.now
  }],
  createdAt: Date,
  updatedAt: Date
}
```

---

### Collection: `resources`

```typescript
{
  title: String,          // required
  description: String,    // default ""
  contentType: String,    // enum: "guide" | "e-book" | "course", required
  fileUrl: String,        // required — link tới file
  thumbnailUrl: String,   // default ""
  tags: [String],
  size: Number,           // optional (legacy field)
  createdAt: Date,
  updatedAt: Date
}
```

> Text index: `title + tags + description` (cho full-text search)

---

### Collection: `services`

```typescript
{
  name: String,           // required
  provider: String,       // required
  contactInfo: String,    // required
  createdAt: Date,
  updatedAt: Date
}
```

> Model hiện có nhưng chưa có route API — chưa sử dụng.

---

## Error Response Format

Tất cả errors trả về dạng:
```json
{ "success": false, "error": "Error message" }
```

HTTP status codes:
- `400` — Bad request / validation error
- `401` — Unauthorized (no/invalid token, wrong OTP)
- `403` — Forbidden (không phải owner)
- `404` — Not found
- `500` — Internal server error
