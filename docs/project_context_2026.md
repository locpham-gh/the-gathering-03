# Project Context — The Gathering (2026-04-23 Snapshot)

> File này cung cấp context đầy đủ cho AI agent làm việc với dự án The Gathering.

---

## 🚀 Công nghệ & Kiến trúc (Tech Stack)

| Thành phần | Công nghệ |
|------------|-----------|
| **Core Runtime** | [Bun](https://bun.sh/) (v1.x) |
| **Frontend** | React + Vite + TailwindCSS (v4) + PixiJS (Game engine) |
| **Backend** | [ElysiaJS](https://elysiajs.com/) (High-performance Bun framework) |
| **Database** | MongoDB (Mongoose ODM) |
| **Real-time** | Bun Native WebSockets |
| **Video/Audio** | LiveKit (Proximity-based) |
| **Authentication** | Google One Tap + JWT + OTP Email |

---

## 🗺️ Luồng Người Dùng (User Flow)

```
Landing (/) → Auth (Google/OTP) → Home (/home) → Vào Room (/room/:code)
Home tabs: Rooms | Events | Forum | Profile
Game room: GameCanvas + Sidebar + Zone Modals + LiveKit video
(Tính năng Lên lịch sự kiện đã được chuyển sang Modal Pattern hiển thị đè trên mọi màn hình)
```

---

## 📂 Cấu trúc Thư Mục (Client)

```
apps/client/src/
  App.tsx                      # Router + AuthProvider
  contexts/AuthContext.tsx      # Quản lý state login/user toàn cục
  hooks/useMultiplayer.ts       # Logic WebSocket sync vị trí người chơi
  lib/api.ts                    # Wrapper apiFetch & API utilities
  pages/
    index.tsx  home.tsx  game.tsx  auth/
  components/
    dashboard/
      rooms/                    # Module quản lý phòng (Refactored < 400 lines)
        DashboardOverview.tsx   # Widget tạo/join nhanh
        WorkspaceList.tsx       # Danh sách phòng & action quản lý
        RoomManageModal.tsx     # Modal cấu hình phòng, kick member
      events/                   # Module quản lý sự kiện
        EventsManager.tsx       # Tab danh sách sự kiện
        EventCard.tsx           # UI item cho từng event
        EventDetailModal.tsx    # Modal xem chi tiết/vào phòng/xóa
        EventsEmptyState.tsx    # Giao diện khi không có lịch
        GuestListManager.tsx    # Logic thêm/xóa khách mời qua email
      ScheduleEventModal.tsx    # Modal tạo sự kiện (dùng createPortal ra body)
      CommunityForum.tsx        # Diễn đàn thảo luận
      ProfileSettings.tsx       # Cài đặt cá nhân
    ui/
      Toast.tsx                 # Hệ thống thông báo popup toàn cục
    game/
      core/                     # Game Engine (PixiJS)
        GameCanvas.tsx          # Stage chính, quản lý layer
        MapRender.tsx           # Tiled JSON parser & renderer
        config.ts               # Tọa độ Spawn, Sprite config, Map switch
        zones.ts                # Định nghĩa khu vực tương tác (Library, v.v.)
      entities/                 # Nhân vật & Vật thể
        Player.tsx              # Local player (Input, Move, Collision)
        OtherPlayer.tsx         # Remote player (Network lerp)
      ui/
        RoomSidebar.tsx         # Sidebar tích hợp Chat/Members/Events
        LiveKitModal.tsx        # Cửa sổ Video Call Proximity
```

---

## 🗄️ Database Schema (MongoDB)

| Collection | Trường chính | Ghi chú |
|------------|--------------|---------|
| **Users** | `email`, `displayName`, `avatarUrl`, `googleId`, `otpCode` | Lưu thông tin định danh & Auth |
| **Rooms** | `name`, `code`, `ownerId` (Ref User), `members` (Array User) | Không gian làm việc riêng |
| **Events** | `title`, `roomId`, `hostId`, `startTime`, `endTime`, `guestEmails` | Lịch họp & Email mời |
| **ForumTopics**| `title`, `content`, `authorId`, `replies` | Diễn đàn cộng đồng |
| **Resources** | `title`, `url`, `category`, `tags` | Thư viện tài liệu (PDF, Link) |

---

## 🔌 API Routes (Backend)

| Module | Endpoint | Method | Chức năng |
|--------|----------|--------|-----------|
| **Auth** | `/api/auth/google` | POST | Login qua Google One Tap |
| | `/api/auth/otp/send` | POST | Gửi mã OTP về email |
| | `/api/auth/otp/verify` | POST | Xác thực OTP & cấp JWT |
| **Room** | `/api/rooms` | GET/POST | Lấy danh sách / Tạo phòng mới |
| | `/api/rooms/:id` | PATCH/DELETE | Sửa tên / Xóa phòng |
| | `/api/rooms/:id/members`| GET | Lấy danh sách thành viên trong phòng |
| | `/api/rooms/:id/kick` | POST | Đuổi thành viên ra khỏi phòng |
| **Event** | `/api/events` | GET/POST | Lấy lịch họp / Lên lịch mới & Gửi mail |
| | `/api/events/:id` | DELETE | Hủy lịch họp |
| **Forum** | `/api/forum/topics` | GET/POST | Lấy danh sách bài viết / Đăng bài |

---

## 🌐 Multiplayer & Real-time

- **WebSocket:** `ws://localhost:3000/ws?room=<roomCode>`
- **Sync Logic:** Server broadcast vị trí (`x`, `y`) và trạng thái (`isSitting`, `character`) cho mọi người trong cùng phòng.
- **State:** Hiện tại lưu In-memory (Mất khi restart).
- **Video:** Tự động kết nối LiveKit khi player bước vào vùng Proximity (dựa trên khoảng cách Euclidean giữa các sprites).

---

## 🛠️ Cải tiến gần đây (Changelog)

1. **Refactor Clean Code (2026-04-23):**
   - Tách tất cả các file component > 400 dòng thành các module nhỏ (`rooms/`, `events/`).
   - Chuyển `ScheduleEvent` từ Route sang Modal Pattern (dùng `createPortal` để hiển thị trên cùng, tránh bị sidebar map 2D chèn ép).
   - Fix lỗi `verbatimModuleSyntax` bằng cách sử dụng `import type`.
   - Chuẩn hóa hệ thống thông báo `Toast` thành component dùng chung.
2. **Fix Bug 500:** Xóa index unique lỗi `eventId` trong MongoDB giúp việc tạo lịch họp hoạt động ổn định.

---

## ⚠️ Known Issues

1. **In-memory State:** Server restart sẽ làm mất vị trí các player đang online.
2. **JWT Expiration:** Token hiện chưa có thời hạn hết hạn cứng (cần bổ sung `exp` field).
3. **Room Sidebar Sync:** Đôi khi danh sách Member Online không cập nhật ngay lập tức nếu WS disconnect đột ngột.
