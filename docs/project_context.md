# Project Context & Progress Review

**Dự án**: The Gathering (2D Metaverse + SaaS UI)
**Giai đoạn hiện tại**: Hoàn thành Phase 5. Chuẩn bị tiến vào Phase 6 (Data & SaaS Modules).

## 🏆 Những gì đã hoàn thành (Phase 1 -> 5)

### Kiến trúc & Monorepo
- Đã thiết lập Bun Workspaces chuẩn chỉ. Đã cấu hình lại Framework về **React 18.3.1** để tương thích hoàn hảo với `@pixi/react`.

### Backend (Bun + Elysia + mongoose)
- API xác thực Google OAuth 2.0.
- **WebSocket Server native (Bun.ws)**: Quản lý kết nối, pub/sub tọa độ người chơi.
- **LiveKit Integration**: Endpoint `/api/livekit/token` cấp quyền truy cập Video Call.

### Frontend & Core Engine (Vite + React + PixiJS)
- **Game Engine**: Render bản đồ 64x64 pixel art, va chạm AABB cực chuẩn.
- **Interactions (Zones)**: Hệ thống vùng tương tác (Reception, Library, Forum) có Overlay "E to enter" và Modal Glassmorphism.
- **Multiplayer Sync**: Sử dụng WebSockets đồng bộ vị trí. Áp dụng thuật toán **Lerp** (nội suy) giúp nhân vật khác di chuyển mượt mà ngay cả khi mạng chậm.
- **Proximity RTC**: Tự động tính khoảng cách Euclidean và kích hoạt Video Call (LiveKit) khi lại gần.

---

## 🚀 Tính năng & Triển khai tiếp theo cho Lần tới (Next Session)

### Phase 6: SaaS Modules & Data Integration (Tiếp theo)
1. **Library Module**:
   - Cho phép người dùng "gắp" tài liệu (Resources) từ Database hiển thị trong Modal Library.
   - Thêm tính năng Search/Filter cho tài liệu.
2. **Forum Module**:
   - Xây dựng hệ thống Thread/Comment đơn giản.
   - Cho phép tạo Topic mới từ trong giao diện Game.
3. **User Status**:
   - Trạng thái Online/Offline và "Check-in" tại Reception để thông báo cho team.

### Phase 7: Polish & Optimization (Dành cho bản production)
1. **Throttling WebSocket**: Giảm tần suất gửi tọa độ (hiện tại mỗi frame đều gửi) xuống khoảng 15hz-20hz để tiết kiệm băng thông.
2. **Spatial Grid**: Nếu lượng người chơi tăng lên (> 50 người), cần chia bản đồ thành các ô nhỏ để chỉ tính khoảng cách với các Player lân cận.
3. **Asset Optimization**: Chuyển các ảnh đơn lẻ sang **Spritesheets (Atlas JSON)** để giảm số lượng Web Requests và tăng tốc độ Render.

---

## 🛠️ Trạng thái thiết lập quan trọng
- **Backend .env**: Cần `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `LIVEKIT_URL/KEY/SECRET`.
- **Frontend .env**: Cần `VITE_GOOGLE_CLIENT_ID`, `VITE_API_URL`, `VITE_LIVEKIT_URL`.
