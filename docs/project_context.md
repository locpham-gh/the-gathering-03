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
4. **Game Engine** (Hoàn thiện Đồ họa & Hoạt cảnh):
   - Tích hợp thành công bản đồ xuất từ **Tiled** (Định dạng JSON đa lớp).
   - Tự động nhận diện va chạm theo Layer.
   - **Animation Engine**: Chuyển đổi thành công sang Sprite sheet nhân vật (16x32px). Hệ thống tính toán dựa trên `useTick` để tạo ra nhịp thở (Row 1), đi bộ (Row 2) với 6 frame mượt mà. Đã xử lý triệt để lỗi rung lắc, lật mặt nhân vật khi đi chéo bằng hàm `getNewDirection`. Hệ thống mượt mà hỗ trợ cả cho Multiplayers thông qua nội suy (Lerp).
   - **Interactive Mechanics**: Hệ thống Raycast lưới ảo. Nhân vật có thể hướng vào chiếc ghế (`LocalID 542` - nội thất), ấn nút `E` để leo lên ghế ngồi ngắm cảnh (Row 5) và tự động rơi xuống khi bấm di chuyển. 

## ⚠️ Lưu ý kỹ thuật (Dành cho phiên làm việc tới)
- **ID Handling**: Luôn dùng `userId.toString()` khi lấy từ JWT payload để tránh `CastError`.
- **Bản đồ Tiled**: Nếu vẽ thêm bản đồ mới, hãy luôn xuất ra định dạng JSON.
- **Tương tác Vật thể**: Thay vì Hardcode localId (ví dụ `542` cho đệm ghế), ở giai đoạn quy mô lớn sau này, cân nhắc sử dụng tính năng `Custom Properties` (như `isSeat = true`) tích hợp sẵn trong cục gạch trên phần mềm Tiled để Code có thể tái sử dụng dễ dàng.
- **Đồ họa PixiJS**: Cấu trúc Sprite Sheet tiêu chuẩn đang chạy rất mượt -> Nếu bạn Artiste cập nhật tệp ảnh, hãy giữ nguyên cấu trúc phân chia Hàng / Cột cũ.
- **Multiplayer State**: Cơ chế Lerp tự quét hướng (`dx, dy`) để quay mặt các Clone đối phương diễn ra rất ổn định, không cần phải bắn thêm gói tin WebSockets qua lại. Hướng xử lý Tối ưu mạng (Bandwidth-efficient) này cần được gìn giữ.

## 🚀 Kế hoạch tiếp theo
- **Zoning & Cảnh vật**: Cấu hình lại các vùng Tương tác (Interactive Zones lớn ẩn dưới sàn) để khớp với bản đồ văn phòng mới. Có thể áp dụng các kịch bản Zone mới như Phòng họp riêng (Mute mic người ngoài).
- **Tính năng Game**: Triển khai các tính năng "Hội họp" nhập vai (Mở Modal xem trình duyệt/chia sẻ file nội bộ khi lại gần PC, bảng trắng vẽ tay chung).
- **Performance**: Lập hệ thống Tile-Chunking khi bản đồ mở rộng quá lớn (Hiện tại render tĩnh đã tối ưu nên chưa quá cấp bách).

---
*Tình trạng: Cột mốc Hệ thống Đồ họa Game 2D Đã Chính Thức Hoàn Thành 100%. Sẵn sàng tung các Meta Logic.*
