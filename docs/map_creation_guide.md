# Hướng dẫn tạo Bản đồ mới & Cấu hình Khu vực (Zones)

Tài liệu này sẽ hướng dẫn bạn cách sử dụng phần mềm Tiled để vẽ một bản đồ mới cho The Gathering, đưa bản đồ đó lên hệ thống, và cấu hình các khu vực tương tác (Reception, Library, Forum) sao cho khớp với thiết kế của bạn.

---

## Phần 1: Vẽ và Xuất bản đồ từ Tiled

1. **Hiểu về tỉ lệ (Scale):**
   - Kích thước gốc của mỗi viên gạch (tile) trong bộ công cụ là `32x32 pixel`.
   - Tuy nhiên, trong game chúng ta phóng to chúng lên tỉ lệ x2 (rendered size = `64x64 pixel`). Mọi tính toán vị trí, toạ độ sau này sẽ dùng **bội số của 64**.

2. **Cách phân lớp (Layers):**
   Thiết kế bản đồ của bạn buộc phải tuân theo cấu trúc tên Layer mà Engine đang hỗ trợ. Bạn có thể sử dụng các lớp sau:
   - `Tile Layer 1` (hoặc `Floor`): Đây là sàn nhà. Người chơi **có thể di chuyển tự do** ở trên lớp này.
   - Bất kỳ Layer nào khác (như `Tile Layer 2`, `Tile Layer 3`, `Tile Layer 4`, `Walls`...): Sẽ được Engine nhận diện là **vật cản/tường**. Nhân vật sẽ không thể đi xuyên qua các lớp này. Hãy cẩn thận khi đặt thảm mỏng ở Layer 2, vì nó có thể chặn người chơi.

3. **Xuất file (Export):**
   - Sau khi thiết kế xong, chọn `File -> Export As...` và ưu tiên chọn định dạng **JSON map files (`*.json`)**.
   - Lưu tên tệp là `office.json`.

---

## Phần 2: Đưa bản đồ vào Engine Game

1. **Thay thế file cấu hình JSON:**
   Phần mềm Tiled của bạn vừa sinh ra một file JSON, hãy chép đè file đó vào đường dẫn này của dự án:
   `apps/client/public/maps/office.json`

2. **Đảm bảo tệp ảnh hiển thị (Tilesets):**
   Nếu bạn có sử dụng tệp ảnh nền (Tileset png) mới mà hệ thống chưa từng có, hãy nhớ chép file ảnh đó (`.png`) vào luôn thư mục `apps/client/public/maps/`. Nền tảng hiện tại đang sử dụng 2 file ảnh mốc:
   - `Room_Builder_v2_32x32.png`
   - `Interiors_free_32x32.png`
   
   > **Note:** Nếu bạn thêm Tileset thứ 3 vào Tiled, bạn sẽ cần nhờ kỹ thuật viên mở file `GameCanvas.tsx`, hàm `getTileDataForGid` để khai báo tệp ảnh thứ 3 này.

---

## Phần 3: Cấu hình Khu vực tương tác (Interactive Zones)

Các khu vực tương tác (như thư viện, quầy tiếp tân, diễn đàn) đang được vẽ ẩn lên trên lớp nền bằng các ô vuông vô hình. 

Mở file sau lên để tuỳ chỉnh:
`apps/client/src/components/game/zones.ts`

Bạn sẽ thấy một mảng dữ liệu `ZONES`. Dưới đây là cách bạn tinh chỉnh toạ độ (`x`, `y`) và chiều rộng/dài (`width`, `height`):

```typescript
  {
    id: "library",
    label: "Library",
    x: 192,
    y: 192,
    width: 128,
    height: 128,
    description: "Knowledge resources and documentation",
  }
```

### 🧮 Cách tính toán toạ độ (Pixel Math):
Mỗi ô vuông trên nền Tiled (đã được phóng to) tương ứng với **64 pixel**.

Ví dụ, bạn muốn đặt khu vực thư viện bắt đầu từ **ô thứ 4 theo chiều ngang** (tính từ trái sang, bắt đầu đếm từ 0), và **ô thứ 3 theo chiều dọc** (tính từ trên xuống), kích thước vùng phủ rộng 2 ô x 2 ô:
- Kéo từ góc trái ô: `x = 4 * 64 = 256`
- Kéo từ mái ô xuống: `y = 3 * 64 = 192`
- Chiều rộng của khu vực: `width = 2 * 64 = 128`
- Chiều cao của khu vực: `height = 2 * 64 = 128`

Sửa lại các thông số trên trong tệp `zones.ts`, sau đó lưu lại. Vite Engine sẽ lập tức nạp bản đồ và gán các khu vực tương tác vào đúng khớp với vị trí nội thất bạn vừa thiết kế!
