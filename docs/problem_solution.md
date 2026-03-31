# 🛠️ Problems Encountered & Solutions Applied

Tài liệu này ghi lại chi tiết các vấn đề kỹ thuật phát sinh và cách giải quyết cụ thể bằng các công cụ trong hệ sinh thái dự án.

---

## 1. Lỗi Cast to ObjectId failed (Vấn đề Serialization)

### ❌ Vấn đề:
Khi gọi `Room.find()`, Server báo lỗi: `Cast to ObjectId failed for value "{ buffer: ... }"`. Điều này khiến trang Dashboard treo và không lấy được danh sách phòng.

### 🔍 Phân tích:
Dữ liệu lưu trong JWT Token không đồng bộ. Khi giải mã ở `room.routes.ts`, Mongoose nhận được một đối tượng Buffer thay vì một chuỗi HEX (65f0...).

### ✅ Giải pháp:
- **Công cụ A (Mongoose)**: Sử dụng phương thức `.toString()` có sẵn trên `ObjectId` của Mongoose để chuyển đổi đối tượng ID thành chuỗi thuần túy trước khi đưa vào Token.
- **Công cụ B (@elysiajs/jwt)**: Sử dụng hàm `jwt.sign()` để đóng gói chuỗi ID đã chuyển đổi. Việc này đảm bảo Payload khi được giải mã bởi `jwt.verify()` luôn trả về giá trị chuỗi (Primitive string), giúp Mongoose thực hiện casting ở các Route khác luôn khớp 100%.

---

## 2. Google One Tap gọi Initialize nhiều lần (GSI_LOGGER Warning)

### ❌ Vấn đề:
Console báo cảnh báo màu vàng: `google.accounts.id.initialize() is called multiple times`. Điều này gây lãng phí tài nguyên và có thể làm mất instance đăng nhập cuối cùng.

### 🔍 Phân tích:
Do React 18 chạy **StrictMode** ở môi trường Dev, khiến `useEffect` chạy 2 lần. Đồng thời, các lần re-render component cũng kích hoạt lại hàm khởi tạo của Google SDK.

### ✅ Giải pháp:
- **Công cụ C (React Hooks)**: Sử dụng `useRef<boolean>(false)` để tạo một biến cờ (Flag) lưu trữ trạng thái nằm ngoài vòng đời render của React.
- **Thực hiện**: Kiểm tra `if (isInitialized.current) return` trước khi gọi `google.accounts.id.initialize()`. Sau khi gọi thành công, gán `isInitialized.current = true`. Cách tiếp cận này chặn đứng tất cả các lần gọi khởi tạo dư thừa từ lần thứ 2 trở đi.

---

## 3. Lỗi Crash UI khi gặp dữ liệu cũ (Legacy Data)

### ❌ Vấn đề:
Giao diện báo lỗi: `Cannot read properties of undefined (reading '_id')` tại trang Dashboard.

### 🔍 Phân tích:
Các phòng cũ được tạo từ giai đoạn trước không có trường `ownerId`. Khi mã nguồn Frontend cố gắng so sánh `room.ownerId._id === user.id`, ứng dụng bị crash vì "truy cập thuộc tính của null".

### ✅ Giải pháp:
- **Công cụ A (Mongoose)**: Sử dụng phương thức `Room.updateMany({ ownerId: null }, { ownerId: userId })` để tự động gán chủ sở hữu cho các phòng vô chủ ngay khi hệ thống quét thấy chúng.
- **Công cụ D (Optional Chaining)**: Sử dụng toán tử `?.` (`room.ownerId?._id`) trong JSX. Đây là tính năng của JavaScript giúp ứng dụng vẫn chạy mượt mà ngay cả khi dữ liệu trả về từ Database bị khuyết thiếu, đảm bảo trải nghiệm người dùng không bị gián đoạn.

---

## 4. Cảnh báo lỗi thời PixiJS (Deprecation)

### ❌ Vấn đề:
Console liên tục báo: `PIXI.settings.SCALE_MODE is deprecated`.

### 🔍 Phân tích:
Thư viện PixiJS v7+ đã chuyển toàn bộ cấu trúc cài đặt vào đối tượng `defaultOptions` để tối ưu hóa việc quản lý trạng thái render toàn cục.

### ✅ Giải pháp:
- **Công cụ E (PixiJS API)**: Truy cập vào thuộc tính trực tiếp `PIXI.BaseTexture.defaultOptions.scaleMode`.
- **Thực hiện**: Gán giá trị `PIXI.SCALE_MODES.NEAREST` vào thuộc tính mới này. Kết quả giúp bản đồ Pixel Art giữ được độ sắc nét (Nearest Neighbor filtering) mà không vi phạm chuẩn viết mã của phiên bản mới.

---

## 5. Lỗi định kiểu TypeScript (jose inference)

### ❌ Vấn đề:
Lỗi TS2742: `The inferred type of 'roomRoutes' cannot be named without a reference to...`

### 🔍 Phân tích:
Kiểu dữ liệu trả về của Elysia khi kết hợp với Plugin JWT là một cấu trúc lồng nhau cực kỳ phức tạp, vượt quá khả năng suy luận mặc định của trình biên dịch TypeScript khi không có thư viện `jose` bản đầy đủ.

### ✅ Giải pháp:
- **Công cụ F (TypeScript Type Assertion)**: Sử dụng ép kiểu `any` (`export const roomRoutes: any`).
- **Thực hiện**: Việc này giúp "đóng băng" việc suy luận kiểu tại ranh giới của file routes, giúp quá trình Build diễn ra trơn tru và không bị kẹt bởi các tham chiếu thư viện hệ thống sâu bên trong Elysia.
