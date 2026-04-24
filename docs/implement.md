# Software Architecture Specification

## Document History

| Version | Date       | Changelog                                        |
|---------|------------|--------------------------------------------------|
| 1.0     | 2025-01-20 | First version                                    |
| 1.1     | 2025-01-25 | Defined initial system requirements              |
| 2.0     | 2026-04-23 | Rewritten to match current The Gathering project |

## Table of Contents

1. Backend Architecture (Bun + Elysia)
2. Frontend Architecture (React + Vite + Pixi)
3. API and Real-time Communication
4. MongoDB Data Model
5. Environment and Runbook

## 1. Backend Architecture (Bun + Elysia)

### 1.1 Runtime and Framework

- Runtime: Bun
- Framework: ElysiaJS
- Database access: Mongoose
- Auth: Google OAuth token verification + custom JWT
- Realtime: Elysia WebSocket endpoint (`/ws`)
- Video token service: LiveKit server SDK
- Email service: Nodemailer (Gmail SMTP)

Main entry point: `apps/server/src/index.ts`

### 1.2 Backend Folder Structure

```text
apps/server/
  src/
    index.ts
    db/
      connection.ts
    controllers/
      auth.controller.ts
      forum.controller.ts
      resource.controller.ts
    routes/
      auth.routes.ts
      event.routes.ts
      forum.routes.ts
      resource.routes.ts
      room.routes.ts
    models/
      Event.ts
      ForumTopic.ts
      Resource.ts
      Room.ts
      Service.ts
      User.ts
    services/
      email.service.ts
```

### 1.3 Naming Conventions

- Variables and functions: `camelCase`
- Types, interfaces, and models: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Route files: `<feature>.routes.ts`
- Controller files: `<feature>.controller.ts`

### 1.4 Routing and Module Boundaries

Routes are separated by domain and mounted in `index.ts`:

- `authRoutes` -> `/api/auth`
- `roomRoutes` -> `/api/rooms`
- `eventRoutes` -> `/api/events`
- `forumRoutes` -> `/api/forum`
- `resourceRoutes` -> `/api/resources`

Additional endpoints in `index.ts`:

- `GET /` health message
- `GET /api/livekit/token` for generating LiveKit JWT
- `WS /ws?room=<roomCode>` for multiplayer position sync

### 1.5 Error Handling Pattern

- Route handlers return `{ success: false, error/message }` on failure.
- HTTP status is assigned through `set.status` when needed.
- DB connection errors terminate the process in `connectDB()`.
- Email send failures return `false` and are handled by route logic.

### 1.6 Security and Auth

- JWT plugin: `@elysiajs/jwt`
- Protected routes extract `Authorization: Bearer <token>`
- Auth routes:
  - Google One Tap credential verify (`/api/auth/google`)
  - OTP request and verify (`/api/auth/otp/request`, `/api/auth/otp/verify`)
- Profile update endpoint: `PUT /api/auth/profile`

## 2. Frontend Architecture (React + Vite + Pixi)

### 2.1 Runtime and Tooling

- Framework: React 18 + TypeScript
- Build/dev server: Vite
- Styling: Tailwind CSS v4 + custom CSS
- Router: `react-router-dom`
- Game rendering: `pixi.js` + `@pixi/react`
- Video call UI/client: LiveKit React Components

Client root: `apps/client/src`

### 2.2 Frontend Folder Structure

```text
apps/client/src/
  main.tsx
  App.tsx
  index.css
  contexts/
    AuthContext.tsx
  hooks/
    useMultiplayer.ts
  lib/
    api.ts
    utils.ts
  pages/
    index.tsx
    home.tsx
    game.tsx
    auth/
      success.tsx
      failed.tsx
  components/
    auth/
    dashboard/
      rooms/
      events/
    game/
      core/
      entities/
      hooks/
      library/
      ui/
    layout/
    ui/
```

### 2.3 Router and View Composition

Defined in `apps/client/src/App.tsx`:

- Public:
  - `/` landing page
  - `/auth/success`
  - `/auth/failed`
- Auth-required:
  - `/home`
  - `/home/rooms`
  - `/home/events`
  - `/home/forum`
  - `/home/profile`
  - `/room/:roomId`

### 2.4 State Management

- Global auth state is handled by `AuthContext`.
- JWT token and user profile are persisted to `localStorage`.
- Multiplayer remote player state is managed in `useMultiplayer` with WebSocket events.
- Feature-level UI state is local to each page/component.

### 2.5 API Layer on Client

`apps/client/src/lib/api.ts` provides:

- `apiFetch()` wrapper with automatic `Authorization` header
- `resourcesApi`
- `forumApi`
- `eventsApi`

Base URL is read from `VITE_API_URL` with default `http://localhost:3000`.

### 2.6 Game Module

Core game module is under `components/game`:

- `core/` for map config, canvas, rendering, zones
- `entities/` for local and remote players
- `ui/` for in-game sidebar, overlays, LiveKit modal
- `library/` for resource/library interaction UI

`GamePage` integrates:

- room auto-join call (`POST /api/rooms/join/:code`)
- WebSocket position sync
- zone interactions
- LiveKit token fetch for proximity call

## 3. API and Real-time Communication

### 3.1 REST API Summary

#### Auth

- `POST /api/auth/google`
- `POST /api/auth/otp/request`
- `POST /api/auth/otp/verify`
- `PUT /api/auth/profile`

#### Rooms

- `GET /api/rooms`
- `POST /api/rooms`
- `POST /api/rooms/join/:code`
- `GET /api/rooms/:id/members`
- `POST /api/rooms/:id/kick`
- `PATCH /api/rooms/:id`
- `DELETE /api/rooms/:id`

#### Events

- `GET /api/events`
- `POST /api/events`
- `DELETE /api/events/:id`

#### Forum

- `GET /api/forum/topics`
- `POST /api/forum/topics`
- `POST /api/forum/topics/:id/replies`
- `DELETE /api/forum/topics/:id`

#### Resources

- `GET /api/resources`

#### Utility

- `GET /api/livekit/token?room=<room>&username=<name>`

### 3.2 WebSocket Contract

Endpoint: `WS /ws?room=<roomCode>`

Message types:

- Client -> server:
  - `move` with payload `{ x, y, isSitting, character, userId, displayName, avatarUrl }`
- Server -> client:
  - `initial_state`
  - `player_moved`
  - `player_left`

Realtime state is in-memory (`Map`) on the server and resets on server restart.

### 3.3 API Versioning

- Current implementation uses unversioned prefix `/api`.
- No `/v1` namespace yet.
- Recommended future path: move to `/api/v1` when introducing breaking changes.

## 4. MongoDB Data Model

### 4.1 Collections and Schemas

#### `users`

- `email` (required, unique)
- `displayName`
- `avatarUrl`
- `googleId` (unique, sparse)
- `otpCode`
- `otpExpiresAt`
- `createdAt`, `updatedAt`

#### `rooms`

- `name` (required)
- `code` (required, unique)
- `ownerId` (ObjectId ref `User`)
- `members` (ObjectId[] ref `User`)
- `createdAt`, `updatedAt`

#### `events`

- `title` (required)
- `description`
- `roomId` (ObjectId ref `Room`)
- `hostId` (ObjectId ref `User`)
- `startTime`
- `endTime`
- `guestEmails` (string[])
- `createdAt`, `updatedAt`

#### `forumtopics`

- `title` (required)
- `authorId` (ObjectId ref `User`)
- `replies[]`
  - `authorId` (ObjectId ref `User`)
  - `content`
  - `createdAt`
- `createdAt`, `updatedAt`

#### `resources`

- `title` (required)
- `description`
- `contentType` (`guide` | `e-book` | `course`)
- `fileUrl` (required)
- `thumbnailUrl`
- `tags` (string[])
- `size` (legacy optional)
- `createdAt`, `updatedAt`

Text index exists on:

- `title`
- `tags`
- `description`

#### `services`

- `name`
- `provider`
- `contactInfo`
- `createdAt`, `updatedAt`

### 4.2 Data Integrity Rules

- `users.email` and `rooms.code` are unique.
- Event references (`roomId`, `hostId`) must be valid ObjectId values.
- OTP code expires after 5 minutes.
- Room membership is deduplicated in join/member flow.
- Room list endpoint includes self-healing logic for legacy corrupted member/owner fields.

## 5. Environment and Runbook

### 5.1 Monorepo Structure

```text
the-gathering-03/
  apps/
    client/
    server/
  docs/
  package.json
```

### 5.2 Scripts

From repository root:

```bash
bun install
bun run dev
```

Or run independently:

```bash
# server
cd apps/server
bun run dev

# client
cd apps/client
bun run dev
```

### 5.3 Environment Variables

#### Server (`apps/server/.env`)

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `EMAIL_USER`
- `EMAIL_PASS`
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `CLIENT_URL`

#### Client (`apps/client/.env`)

- `VITE_API_URL`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_LIVEKIT_URL`

## Notes

- This document is intentionally aligned with source code under `apps/client` and `apps/server` as of 2026-04-23.
- When route signatures or models change, update this file together with `docs/api_schema_2026.md` and `docs/project_context_2026.md`.
