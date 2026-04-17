# Cấu trúc Kiến trúc Frontend (The Gathering)

Ứng dụng The Gathering được xây dựng theo mô hình **Feature-based Folder Component Architecture** (Cấu trúc thư mục theo Tính năng). Việc này đảm bảo nguyên lý S.O.L.I.D, đặc biệt là Trách nhiệm Đơn Lẻ (Single Responsibility) khi dự án lớn dần.

## 1. Mạch Máu Điều Hướng Nội Bộ (`App.tsx` & `home.tsx`)
- **`App.tsx`**: Khai báo mạch dẫn luồng Router của toàn hệ thống (`react-router-dom`). Đảm trách Auth Guards. Các routes nội biên nằm giới hạn trong chuỗi `/home/*` hoặc `/room/*`.
- **`pages/home.tsx`**: Không chứa Logic Giao diện cụ thể. Trách nhiệm duy nhất của nó là "Người chỉ đường" (Controller/Orchestrator). Dựa trên thanh URL (`useLocation`), nó nạp và lắp ráp các Linh kiện thành phần (Components) vào `DashboardLayout`.

## 2. Tiêu Chuẩn `components/dashboard/`
Toàn bộ các tab và khối giao diện khổng lồ của trang quản trị người dùng được bóc tách và niêm phong trong đường dẫn này:

- **`RoomsManager.tsx`**: Trái tim Quản lý Workspace. Đặc tính nhạy cảm chứa State điều khiển form khởi tạo Phòng họp, form Điền Code Mã vào phòng, và cả cái Lưới hiển thị danh sách "Your Workspaces" (`WorkspaceList`). 
- **`EventsManager.tsx`**: Module độc lập chuyên lo việc Bóc tách Database Sự Kiện cá nhân hiển thị dưới dạng Thẻ Lịch. Đảm trách móc nối với `eventsApi`.
- **`CommunityForum.tsx`**: Sợi rễ cắm thẳng vào mạch Cộng Đồng mở của Ứng dụng. Mô phỏng UI lưới ngang dọc vô cực của X/Threads. Độc lập toàn bộ Logic Comment, Đăng bài. Nền móng tự động dùng Fallback `DiceBear` Avatar nếu Google Auth bị chặn.
- **`ProfileSettings.tsx`**: Bánh răng thiết lập cấu hình User cá nhân (Avatar, DisplayName). Tự cập nhật ngược về Mạch máu chung của Client qua Context `updateUser`.

## 3. Quy Nhận Thức (Clean Code Standards)
1. **Dưới 400 Dòng**: Bất kỳ File Component nào khi nạp đủ chức năng phình lên trên 300-400 dòng, bắt buộc phải đập vỡ thành Sub-component đưa xuống folder con của tính năng đó.
2. **Không Chia Sẻ Suy Nghĩ (State Insulation)**: Component nào dùng biến trạng thái (State) thì nằm yên trong State đó. `home.tsx` tuyệt đối không được ôm `useState` tải Dữ liệu Cộng Đồng hay Dữ Liệu Avatar, giúp chống lại hiện tượng *Rò rỉ Vòng lặp Render (Render Leak)*.

## 4. Khuôn Viên Game (Mạch Độc Lập)
Các thành tố cấu thành lõi Game 2D nằm riêng ở `components/game/` (ví dụ `GameCanvas.tsx`). Do đặc thù gắn cứng với API của Phaser và socket `Tick-rate`, khu vực này được xem là một "Hộp Đen Mở" (Open Blackbox), liên tục tái cấu trúc các màn hình Phaser bên trong lõi thay vì phân mảnh File React bên ngoài lớp UI.
