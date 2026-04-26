# Tech Stack — The Gathering

> Cập nhật: 2026-04-23 | Dùng cho AI agent reference

---

## Tổng quan Monorepo

```
the-gathering-03/
├── apps/
│   ├── client/   (React + Vite + Pixi.js)
│   └── server/   (Bun + ElysiaJS)
├── docs/
└── package.json  (Bun Workspaces root)
```

**Runtime:** Bun (toàn bộ, cả FE build và BE runtime)  
**Package Manager:** Bun Workspaces  
**Dev Command:** `bun run dev` (root — chạy đồng thời server + client qua `concurrently`)

---

## Backend — `apps/server`

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Bun | latest |
| Framework | ElysiaJS | ^1.2.0 |
| Database | MongoDB (Mongoose) | ^8.9.0 |
| Auth - Google | google-auth-library | ^9.15.0 |
| Auth - JWT | @elysiajs/jwt | ^1.2.0 |
| CORS | @elysiajs/cors | ^1.2.0 |
| Static Files | @elysiajs/static | ^1.4.7 |
| Video Call | livekit-server-sdk | ^2.15.0 |
| Email | nodemailer | ^8.0.5 |
| Language | TypeScript | ^5.0.0 |

**Real-time:** Bun native WebSocket (built-in Elysia `.ws()`) — **KHÔNG dùng Socket.io**

### Scripts
```bash
bun run dev    # bun --watch src/index.ts
bun run build  # bun build ./src/index.ts --target=bun
```

### Env Variables (server)
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/the-gathering
JWT_SECRET=super_secret_jwt_key_here
GOOGLE_CLIENT_ID=                         # Google OAuth Client ID
EMAIL_USER=yourmail@gmail.com             # Nodemailer Gmail sender
EMAIL_PASS=                               # Gmail App Password
LIVEKIT_URL=                              # LiveKit server URL
LIVEKIT_API_KEY=                          # LiveKit API key
LIVEKIT_API_SECRET=                       # LiveKit API secret
CLIENT_URL=http://localhost:5173          # Dùng để tạo link trong email
```

---

## Frontend — `apps/client`

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 18.3.1 |
| Build Tool | Vite | ^8.0.1 |
| Language | TypeScript | ~5.9.3 |
| Game Engine | PixiJS + @pixi/react | 7 / 7.1.2 |
| Styling | Tailwind CSS | **v4** (CSS-first, @tailwindcss/vite) |
| Routing | react-router-dom | ^7.13.2 |
| Video Call | livekit-client + @livekit/components-react | ^2.18.0 / ^2.9.20 |
| Animation | framer-motion | ^12.38.0 |
| Icons | lucide-react | ^1.7.0 |
| UI Helpers | clsx, tailwind-merge, class-variance-authority | latest |
| ID Gen | nanoid | ^5.1.7 |

> ⚠️ **QUAN TRỌNG — Tailwind v4**: Dự án dùng Tailwind CSS v4. KHÔNG dùng `tailwind.config.js`, không có `@apply`, cấu hình theme qua CSS `@theme {}` block. Xem `apps/client/src/index.css`.

### Scripts
```bash
bun run dev      # vite dev server (port 5173)
bun run build    # tsc -b && vite build
bun run lint     # eslint . --fix
```

### Env Variables (client)
```env
VITE_API_URL=http://localhost:3000        # Backend URL
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_LIVEKIT_URL=                         # LiveKit server URL (ws://)
```

---

## Game Engine (Pixi.js v7)

- Renderer: `@pixi/react` Stage + Container + Sprite
- Map: Tiled JSON format (`.json` files, không phải `.tmx`)
- Tileset: PNG spritesheets (32×32 raw → render 64×64 virtual pixels)
- Anti-glitch settings:
  - `SCALE_MODES.NEAREST` (pixel art)
  - `MIPMAP_MODES.OFF`
  - `ROUND_PIXELS = false`
  - `imageRendering: "pixelated"`

**Tilesets hiện có:**
| File | First GID | Cols |
|------|-----------|------|
| `Room_Builder_v2_32x32.png` | 1 | 17 |
| `Serene_Village_32x32.png` | 392 | 19 |
| `Interiors_free_32x32.png` | 1247 | 16 |

**Maps hiện có:**
| File | Type |
|------|------|
| `office_map.json` | Office layout (default) |
| `classroom_map.json` | Classroom layout |

**Switch map:** Sửa `MAP_CONFIG.type` trong `apps/client/src/components/game/core/config.ts`

---

## Database

**MongoDB** — local hoặc Atlas  
ORM: **Mongoose** v8  
DB Name mặc định: `the-gathering`

---

## Real-time Communication

| Feature | Technology | Notes |
|---------|-----------|-------|
| Player sync | Bun WebSocket | In-memory Map, 20Hz throttle |
| Proximity video | LiveKit | Token từ server `/api/livekit/token` |

---

## Authentication Flow

1. **Google One Tap** — credential gửi lên `POST /api/auth/google` → verify bằng `google-auth-library` → upsert MongoDB User → issue custom JWT
2. **Email OTP** — `POST /api/auth/otp/request` → gửi 6-digit OTP qua Nodemailer → `POST /api/auth/otp/verify` → issue JWT
3. JWT lưu trong `localStorage` (`token` key), user data lưu `localStorage` (`user` key)
4. Auth state quản lý qua `AuthContext` (React Context, không dùng Redux hay Zustand)
