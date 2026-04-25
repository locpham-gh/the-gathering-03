# Product Requirements — The Gathering

> Nguồn gốc: Technical Brief PDF (2025-09) + bổ sung tính năng 2D Map & Admin Page  
> Cập nhật: 2026-04-23 | Dùng làm PRD chuẩn cho toàn bộ team và AI agent

---

## Tổng Quan Sản Phẩm

**The Gathering** là một **virtual co-working space** hướng đến công nghệ well-being, tập trung xây dựng cộng đồng làm việc/học tập trực tuyến có tác động xã hội tích cực.

| Thuộc tính | Chi tiết |
|-----------|---------|
| Loại sản phẩm | SaaS — Community Virtual Co-Working Space |
| Mục tiêu ban đầu | MVP cho 30–50 khách hàng beta tư nhân |
| Đối tượng | Cộng đồng làm việc / học tập chung |
| Công ty | Well-being tech company |

---

## MVP Features (Từ Technical Brief gốc)

### 1. Website / Giao diện & Quản lý người dùng

- **UI/UX:** Giao diện sạch, trực quan để truy cập toàn bộ tính năng platform
- **Sign-up & Login:** Trang tạo tài khoản và xác thực bảo mật
- **User Verification:** Hệ thống xác thực người dùng mới (bao gồm xác nhận qua email / OTP)
- **User Profile Management:** Cho phép người dùng chỉnh sửa profile, settings, thông tin cá nhân
- **Dashboard:** Cung cấp truy cập nhanh tới Events, Resources, và Forum

**Trạng thái triển khai:**
| Sub-feature | Trạng thái |
|-------------|-----------|
| Landing page | ✅ Done |
| Google One Tap login | ✅ Done |
| Email OTP login | ✅ Done |
| Profile edit (displayName, avatarUrl) | ✅ Done |
| Dashboard (Rooms, Events, Forum, Profile tabs) | ✅ Done |

---

### 2. Events Booking & Management

- **Booking Calendar:** Giao diện lịch để người dùng xem và đặt lịch sự kiện
- **Automated Communication:** Gửi email xác nhận và nhắc nhở tự động khi đặt lịch
- **Event Hosting Platform:**
  - Hỗ trợ tối thiểu 20 người tham gia, có thể mở rộng tới 100 người
  - Tính năng "Room" cho nhóm nhỏ (breakout groups) hoặc phiên riêng tư
  - Tích hợp third-party (LiveKit hoặc Zoom) hoặc module video conferencing tự xây

**Trạng thái triển khai:**
| Sub-feature | Trạng thái |
|-------------|-----------|
| Tạo & lên lịch event | ✅ Done |
| Email mời khách tham dự (Nodemailer) | ✅ Done |
| Proximity-based video call (LiveKit) | ✅ Done |
| Breakout rooms | 🔄 Qua Room system |
| Xem lịch events của tôi | ✅ Done |

---

### 3. Digital "Public Library" (Thư Viện Số)

- **Repository/CMS:** Kho lưu trữ và tổ chức tài nguyên số
- **Content Types:** Guides, e-books, courses
- **Search & Filter:** Khả năng tìm kiếm và lọc thân thiện với người dùng

**Trạng thái triển khai:**
| Sub-feature | Trạng thái |
|-------------|-----------|
| Resource listing với search/filter | ✅ Done |
| Filter theo type (guide/e-book/course) | ✅ Done |
| Filter theo tag | ✅ Done |
| Library zone trong 2D map (in-game access) | ✅ Done |
| Upload/quản lý resource (admin) | ⏳ Cần Admin Page |

---

### 4. Service Directory *(Pending Client Approval)*

- **Mô tả:** Database/directory tìm kiếm được các dịch vụ từ thành viên cộng đồng hoặc đối tác
- **Yêu cầu:** Mỗi entry gồm chi tiết dịch vụ + thông tin liên hệ
- **Note:** Tính năng này chờ phê duyệt từ client trước khi phát triển, có thể là giai đoạn sau

**Trạng thái triển khai:**
| Sub-feature | Trạng thái |
|-------------|-----------|
| Service model (Mongoose) | ✅ Schema có sẵn |
| Service API routes | ❌ Chưa có |
| Service Directory UI | ❌ Chưa có |

---

### 5. Community Forum

- **Discussion Board:** Module diễn đàn cho thành viên cộng đồng tương tác
- **Tính năng:** Tạo topic, threaded replies, khả năng moderation

**Trạng thái triển khai:**
| Sub-feature | Trạng thái |
|-------------|-----------|
| Tạo topic | ✅ Done |
| Threaded replies | ✅ Done |
| Xóa topic (author) | ✅ Done |
| User moderation (admin delete) | ⏳ Cần Admin Page |
| Pinned/featured topics | ❌ Chưa có |

---

## Feature 6 — 2D Virtual Map (Gather.town Style) ✨

> Tính năng mở rộng quan trọng, phân biệt The Gathering với các nền tảng thông thường.

### Mô tả

Không gian làm việc ảo 2D dạng pixel art, nơi người dùng điều khiển nhân vật di chuyển tự do trong map, tương tác với nhau và với các zone chức năng theo thời gian thực.

### Core Features

| Feature | Mô tả | Trạng thái |
|---------|-------|-----------|
| **2D Pixel Map** | Tilemap Tiled JSON render qua PixiJS, hỗ trợ nhiều layers | ✅ Done |
| **Character movement** | WASD/Arrow keys, 4 hướng, animation walk cycle | ✅ Done |
| **Tile collision** | AABB collision với furniture/walls | ✅ Done |
| **Multiplayer sync** | Vị trí nhân vật đồng bộ real-time qua WebSocket (20Hz) | ✅ Done |
| **Character selection** | 4 nhân vật: Adam, Bob, Amelia, Alex | ✅ Done |
| **Sitting mechanic** | Nhân vật có thể ngồi trên ghế | ✅ Done |
| **Zone system** | Khu vực tương tác (Library zone) kích hoạt khi bước vào | ✅ Done |
| **Proximity video call** | Tự động mở LiveKit khi đứng gần player khác | ✅ Done |
| **Multiple maps** | Office map + Classroom map, switch qua config | ✅ Done |
| **Camera follow** | Camera theo dõi player, world offset tự động | ✅ Done |
| **Room Sidebar** | Danh sách thành viên, forum, events trong game | ✅ Done |

### Maps Hiện Có

| Map | File | Mô tả |
|-----|------|-------|
| Office | `office_map.json` | Layout văn phòng |
| Classroom | `classroom_map.json` | Layout lớp học (default hiện tại) |

### Technical Architecture

```
GamePage (/room/:code)
├── RoomSidebar          — Flyout sidebar: members / forum / events
├── GameCanvas (PixiJS)
│   ├── MapRender        — Tile layers từ Tiled JSON
│   ├── Player           — Local player: input + collision + sync
│   ├── OtherPlayer[]    — Remote players: lerp interpolation
│   └── ZoneDebugRenderer
├── ZoneOverlay          — HUD "Press E to interact"
├── LibraryModal         — Digital Library (khi vào Library Zone)
├── LiveKitModal         — Video call (khi proximity trigger)
└── CharacterSelector    — Chọn nhân vật khi vào game lần đầu
```

### WebSocket Protocol

```
WS endpoint: ws://server:3000/ws?room=<roomCode>

Client → Server:
  type: "move", payload: { x, y, isSitting, character, userId, displayName, avatarUrl }

Server → Client:
  type: "initial_state"  → danh sách players hiện tại trong room
  type: "player_moved"   → một player vừa cập nhật vị trí
  type: "player_left"    → một player vừa disconnect
```

### Roadmap 2D Map (Chưa làm)

| Feature | Priority | Mô tả |
|---------|----------|-------|
| Thêm maps mới | Medium | Conference room, café, outdoor |
| Furniture interaction | Medium | Whiteboard, screen sharing khu vực |
| Chat text bubble | High | Tin nhắn text hiển thị trên đầu nhân vật |
| Mini-map | Low | Bản đồ thu nhỏ góc màn hình |
| Room capacity indicator | Medium | Hiển thị số người trong map |
| Custom avatar upload | Medium | Thay thế sprite mặc định bằng ảnh user |
| Persistent WS state | High | Dùng Redis thay in-memory Map |
| Map editor | Low | Công cụ tạo/chỉnh map không cần code |

---

## Feature 7 — Admin Page 🛡️

> Tính năng quản trị cho operator/admin của The Gathering platform.

### Mô tả

Trang quản trị riêng biệt cho admin, cho phép quản lý toàn bộ nội dung, người dùng, tài nguyên và diễn đàn của platform.

### Truy Cập & Phân Quyền

| Role | Quyền |
|------|-------|
| `user` | Người dùng thông thường |
| `admin` | Toàn quyền quản lý platform |

> **Cần thêm:** Field `role: "user" | "admin"` vào MongoDB `User` schema.  
> Admin page route: `/admin` — chỉ truy cập được khi `user.role === "admin"`.

### Admin Modules

#### 7.1 User Management
| Chức năng | API cần |
|-----------|---------|
| Xem danh sách tất cả users | `GET /api/admin/users` |
| Tìm kiếm user theo email/name | `GET /api/admin/users?search=` |
| Xem chi tiết user | `GET /api/admin/users/:id` |
| Cập nhật role user (admin ↔ user) | `PATCH /api/admin/users/:id/role` |
| Ban/unban user | `PATCH /api/admin/users/:id/status` |
| Xóa user | `DELETE /api/admin/users/:id` |

#### 7.2 Resource Management (Digital Library)
| Chức năng | API cần |
|-----------|---------|
| Xem tất cả resources | `GET /api/admin/resources` |
| Thêm resource mới | `POST /api/admin/resources` |
| Chỉnh sửa resource | `PATCH /api/admin/resources/:id` |
| Xóa resource | `DELETE /api/admin/resources/:id` |
| Upload file | `POST /api/admin/resources/upload` |

> Resource fields: `title, description, contentType (guide/e-book/course), fileUrl, thumbnailUrl, tags[]`

#### 7.3 Room Management
| Chức năng | API cần |
|-----------|---------|
| Xem tất cả rooms | `GET /api/admin/rooms` |
| Xóa room bất kỳ | `DELETE /api/admin/rooms/:id` |
| Xem rooms của một user | `GET /api/admin/rooms?userId=` |

#### 7.4 Forum Moderation
| Chức năng | API cần |
|-----------|---------|
| Xem tất cả topics | `GET /api/admin/forum/topics` |
| Xóa topic bất kỳ | `DELETE /api/admin/forum/topics/:id` |
| Xóa reply bất kỳ | `DELETE /api/admin/forum/topics/:id/replies/:replyId` |
| Pin/unpin topic | `PATCH /api/admin/forum/topics/:id/pin` |

#### 7.5 Event Management
| Chức năng | API cần |
|-----------|---------|
| Xem tất cả events | `GET /api/admin/events` |
| Xóa event | `DELETE /api/admin/events/:id` |

#### 7.6 Analytics Dashboard
| Metric | Mô tả |
|--------|-------|
| Tổng users | Đếm users trong DB |
| Users mới 30 ngày | Filter `createdAt` |
| Tổng rooms đang active | Count rooms |
| Tổng resources | Count resources |
| Tổng forum topics | Count topics |
| Events sắp tới | Filter `startTime > now` |

### Admin UI Layout (Đề xuất)

```
/admin
├── Sidebar navigation (Users / Resources / Rooms / Forum / Events / Analytics)
└── Main content area
    ├── /admin                → Analytics Dashboard
    ├── /admin/users          → User list + search + actions
    ├── /admin/resources      → Resource list + upload form
    ├── /admin/rooms          → Room list + delete
    ├── /admin/forum          → Topic list + moderation
    └── /admin/events         → Event list + delete
```

### Backend — Admin Middleware

Mọi admin route phải qua middleware kiểm tra role:

```typescript
// Middleware pattern cho admin routes
const adminGuard = async ({ jwt, headers, set }) => {
  const token = headers["authorization"]?.split(" ")[1];
  const payload = await jwt.verify(token);
  if (!payload || payload.role !== "admin") {
    set.status = 403;
    return { success: false, error: "Admin access required" };
  }
  return { user: payload };
};
```

### Database Changes Cần Thiết

```typescript
// User schema — thêm field:
role: { type: String, enum: ["user", "admin"], default: "user" }
status: { type: String, enum: ["active", "banned"], default: "active" }
```

---

## Summary — Feature Status Overview

| # | Feature | MVP | Trạng thái |
|---|---------|-----|-----------|
| 1 | Website / UI / Auth / Profile | ✅ | **Done** |
| 2 | Events Booking & Management | ✅ | **Done** |
| 3 | Digital Library | ✅ | **Done (thiếu admin upload)** |
| 4 | Service Directory | ⏳ | **Schema có, chưa có API/UI** |
| 5 | Community Forum | ✅ | **Done (thiếu admin moderation)** |
| 6 | 2D Virtual Map (Gather.town) | 🚀 | **Done — core features** |
| 7 | Admin Page | ❌ | **Chưa làm** |

---

## Tech Stack Tóm Tắt

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS v4 |
| Game Engine | PixiJS v7 + @pixi/react |
| Backend | Bun + ElysiaJS + TypeScript |
| Database | MongoDB + Mongoose |
| Real-time | Bun native WebSocket |
| Video | LiveKit (proximity-based) |
| Auth | Google One Tap + Email OTP + Custom JWT |
| Email | Nodemailer (Gmail) |
| Monorepo | Bun Workspaces |

---

## Environment Variables

### Server (`apps/server/.env`)
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/the-gathering
JWT_SECRET=super_secret_jwt_key_here
GOOGLE_CLIENT_ID=
EMAIL_USER=yourmail@gmail.com
EMAIL_PASS=
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
CLIENT_URL=http://localhost:5173
```

### Client (`apps/client/.env`)
```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=
VITE_LIVEKIT_URL=
```

---

## Cách Chạy Dự Án (Development)

```bash
# Từ root
bun run dev

# Riêng lẻ
bun run --cwd apps/server dev   # Backend :3000
bun run --cwd apps/client dev   # Frontend :5173
```
