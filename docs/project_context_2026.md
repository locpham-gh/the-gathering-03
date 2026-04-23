# Project Context — The Gathering (2026-04-23 Snapshot)

> File này dùng để cung cấp context đầy đủ cho AI agent làm việc với dự án.

---

## Tổng quan Dự án

**The Gathering** là một **virtual co-working space** dạng 2D multiplayer — tương tự Gather.town.  
Người dùng di chuyển nhân vật pixel trong map, tự động join video call khi đứng gần nhau (proximity-based), và có thể truy cập thư viện tài nguyên học tập, diễn đàn cộng đồng, lịch sự kiện.

**Đối tượng:** Cộng đồng học tập / làm việc chung  
**Scale:** Medium, 2-5 người phát triển  
**Trạng thái:** Active development

---

## User Flow

```
Landing (/) → Auth (Google/OTP) → Home (/home) → Vào Room (/room/:code)
Home tabs: Rooms | Events | Forum | Profile
Game room: GameCanvas + Sidebar + Zone Modals + LiveKit video
```

---

## Cấu trúc Thư Mục

```
apps/client/src/
  App.tsx                      # Router + AuthProvider
  contexts/AuthContext.tsx      # Auth state global
  hooks/useMultiplayer.ts       # WebSocket + player sync
  lib/api.ts                    # apiFetch + API wrappers
  pages/
    index.tsx  home.tsx  game.tsx  schedule.tsx  auth/
  components/
    dashboard/
      RoomsManager.tsx          # Tạo/join/list rooms
      CommunityForum.tsx        # Forum topics + replies
      EventsManager.tsx         # View/create events (in-game sidebar)
      ProfileSettings.tsx       # Cập nhật profile
    game/
      core/
        GameCanvas.tsx          # Pixi Stage, map + players
        MapRender.tsx           # Render tile layers
        config.ts               # MAP_CONFIG, CHARACTER_CONFIG
        zones.ts                # Zone definitions + collision check
      entities/
        Player.tsx              # Local player: input, move, collision, sit
        OtherPlayer.tsx         # Remote player: lerp render
        AnimatedPlayerSprite.tsx
      hooks/
        useCamera.ts  useCollision.ts  usePlayerInput.ts
      lib/
        gameTypes.ts  constants.ts  tileUtils.ts
      ui/
        RoomSidebar.tsx         # Sidebar: members/chat/events
        ZoneOverlay.tsx         # HUD "Press E"
        LiveKitModal.tsx        # Video call modal
        CharacterSelector.tsx   # Chọn nhân vật lần đầu
      library/
        LibraryModal.tsx  LibraryGrid.tsx  LibraryCard.tsx
        LibraryHeader.tsx  LibrarySidebar.tsx  ResourceDetail.tsx

apps/server/src/
  index.ts             # Elysia app + WS handler + LiveKit token
  db/connection.ts     # MongoDB connect
  models/              # User Room Event ForumTopic Resource Service
  routes/              # auth room event forum resource
  controllers/         # auth forum resource
  services/email.service.ts
```

---

## Multiplayer (WebSocket)

**Endpoint:** `ws://localhost:3000/ws?room=<roomCode>`  
**State:** In-memory `Map<roomId, Map<wsId, playerData>>` — mất khi restart server.

**Client → Server:**
```json
{ "type": "move", "payload": { "x": 0, "y": 0, "isSitting": false, "character": "Adam", "userId": "...", "displayName": "...", "avatarUrl": "..." } }
```

**Server → Client:**
| type | payload |
|------|---------|
| `initial_state` | `{ players: Record<wsId, playerData> }` |
| `player_moved` | `{ id, x, y, isSitting, character, userId, displayName, avatarUrl }` |
| `player_left` | `{ id }` |

**Throttle:** 20Hz (50ms), bypass khi thay đổi `isSitting`.

---

## Game Engine

- **Renderer:** PixiJS v7 + @pixi/react
- **Map format:** Tiled JSON (32px raw tiles → 64px virtual render, scale 2.01×)
- **Collision:** AABB tile-based, hitbox `(+16, +32) to (+48, +64)` trên sprite 64×64
- **Solid layers:** Mọi layer KHÔNG phải `Floor/floor/ground/Tile Layer 1`
- **Spawn:** `(1600, 1600)` pixel
- **Camera:** World container offset để player luôn ở center màn hình

**Maps:**
| File | Kích hoạt |
|------|-----------|
| `office_map.json` | `MAP_CONFIG.type = "office"` |
| `classroom_map.json` | `MAP_CONFIG.type = "classroom"` (default hiện tại) |

> Switch map: Sửa `apps/client/src/components/game/core/config.ts`

**Characters:** Adam, Bob, Amelia, Alex (`/sprites/<Name>_16x16.png`)  
Sprite sheet: 16×16px/frame, 4 hướng × 8 frame walk cycle.

---

## Zones

| ID | Label | Office (x,y,w,h) | Classroom (x,y,w,h) |
|----|-------|-----------------|---------------------|
| `library` | Library | 2000,350,600,600 | 1984,1408,512,832 |

Kích hoạt: bước vào zone → ZoneOverlay "Press E" → E → mở LibraryModal.

---

## Auth (Client)

```typescript
interface AuthContextType {
  user: { id, email, displayName, avatarUrl? } | null;
  token: string | null;
  loading: boolean;
  login(userData, token): void;
  logout(): void;
  updateUser(userData): void;
}
```

Session: `localStorage.token` (JWT) + `localStorage.user` (JSON).  
Không dùng cookie, không có refresh token.

---

## Known Issues (tính đến 2026-04)

1. **WS state in-memory** — mất khi server restart, cần Redis nếu scale.
2. **Room member data corruption** — có self-heal logic trong `GET /api/rooms` cho ObjectId bị corrupt thành Buffer (legacy bug).
3. **JWT không set exp** — cần thêm expiration cho production.
4. **RoomSidebar online check** — `players[*].userId === member._id` (WS wsId ≠ DB userId, cần userId trong payload).

---

## Ports (Development)

| Service | Port |
|---------|------|
| Backend (ElysiaJS + Bun) | 3000 |
| Frontend (Vite) | 5173 |
| MongoDB | 27017 |
