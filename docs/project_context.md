# The Gathering - Project Context (2026-04-01)

## 🎯 Mục tiêu hiện tại
Xây dựng nền tảng Metaverse (Virtual Co-working) ổn định. Hiện đã giải quyết xong các vấn đề cốt lõi về quản lý phòng và đồng bộ dữ liệu.

## 🛠 Tech Stack
- **Backend**: Bun + ElysiaJS + Mongoose (MongoDB).
- **Frontend**: React (Vite) + Tailwind CSS + PixiJS (@pixi/react).
- **Video/Audio**: LiveKit.
- **Auth**: Google One Tap + JWT.

## ✅ Trạng thái Milestone
1. **Authentication**: Đã xong Google Auth và cập nhật Profile.
2. **Room Management**: 
   - Tạo/Tham gia phòng qua Code.
   - Dashboard hiển thị phòng của tôi & phòng tham gia.
   - Chế độ "Manage" (Chủ phòng): Đổi tên, Xem member, Kick member.
   - **Đặc biệt**: Đã có cơ chế Self-healing tự sửa dữ liệu lỗi trong DB.
3. **Multiplayer**:
   - Đồng bộ vị trí thời gian thực qua WebSocket.
   - Cơ chế Lerp làm mượt chuyển động của OtherPlayer.
   - Video call tự động kích hoạt khi đứng gần nhau (Proximity Call).

## ⚠️ Lưu ý kỹ thuật (Dành cho phiên làm việc tới)
- **ID Handling**: Luôn dùng `userId.toString()` khi lấy từ JWT payload để tránh `CastError` (vì payload đôi khi chứa Buffer object thay vì chuỗi).
- **WebSocket**: Hook `useMultiplayer.ts` đã được tối ưu cho React StrictMode (không đóng socket khi đang Connecting).
- **PixiJS**: Các cảnh báo Deprecation đã bị tắt để tránh nhiễu console. Khi update đồ họa, hãy sử dụng `eventMode` thay vì `interaction`.
- **Database**: Collection `rooms` sử dụng schema có mảng `members` là danh sách `ObjectId`.

## 🚀 Kế hoạch tiếp theo
- **Đồ họa**: Thay thế Map `office.json` bằng Map mới tự vẽ.
- **Nhân vật**: Thay đổi Sprite và Model nhân vật mới.
- **Tính năng Game**: Bắt đầu phát triển các tính năng 2D Game (Mini games, tương tác vật thể) sau khi đồ họa ổn định.

---
*Tình trạng: Ổn định. Không còn lỗi 500 hay CastError.*
