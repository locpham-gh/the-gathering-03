**Bug Report: Member Not Evicted from Virtual Room After Being Kicked**

| **Field**     | **Description**                          |
| ------------- | ---------------------------------------- |
| **Bug ID**    | \[Internal-ID\]                          |
| **Severity**  | **High** (Security/Access Control issue) |
| **Priority**  | **High**                                 |
| **Component** | Room Management / Real-time Socket       |
| **Status**    | New                                      |

**Bug Summary**

Hệ thống không tự động đẩy thành viên (kick) ra khỏi phòng ảo nếu thành viên đó đang hiện diện trong phòng tại thời điểm bị xóa quyền truy cập bởi chủ phòng.

**Description**

Chủ phòng có thể thực hiện thao tác "Kick" Thành viên A thành công trên giao diện quản lý. Tuy nhiên, nếu Thành viên A đang ở trong phòng ảo (Virtual Room/Game Room) lúc đó, họ không bị buộc rời đi ngay lập tức. Thành viên A vẫn có thể tương tác bên trong phòng cho đến khi họ tự thoát thủ công.

**Preconditions**

- Chủ phòng (Owner) đã tạo một phòng hoạt động.
- Thành viên A đã tham gia vào phòng đó.
- Chủ phòng và Thành viên A đăng nhập trên hai thiết bị/trình duyệt khác nhau.
- **Thành viên A đang hiện diện (active) bên trong phòng ảo.**

**Steps to Reproduce**

- Đăng nhập tài khoản **Owner** và mở màn hình quản lý phòng.
- Đăng nhập tài khoản **Thành viên A** trên trình duyệt khác và tiến hành **vào trong phòng ảo**.
- Tại màn hình của **Owner**, chọn Thành viên A trong danh sách thành viên.
- Nhấn nút **Kick** (và xác nhận nếu có).
- Kiểm tra danh sách thành viên bên phía Owner.
- Quan sát màn hình và trạng thái của **Thành viên A** bên trong phòng ảo.

**Actual Result**

- Thành viên A bị xóa khỏi danh sách thành viên ở phía quản lý thành công.
- **Lỗi:** Thành viên A vẫn ở trong phòng ảo, không bị ngắt kết nối hoặc chuyển hướng.
- Thành viên A vẫn có thể quan sát hoặc tương tác trong phòng cho đến khi đóng trình duyệt hoặc tự thoát.

**Expected Result**

- Thành viên A phải bị xóa khỏi danh sách thành viên.
- **Hệ thống phải thực hiện lệnh "Force Exit" ngay lập tức:**
  - Thành viên A bị đẩy ra khỏi phòng ảo và chuyển hướng về trang Dashboard hoặc danh sách phòng.
  - Hiển thị thông báo: _"Bạn đã bị mời ra khỏi phòng bởi chủ phòng."_
  - Avatar và dữ liệu của Thành viên A phải biến mất khỏi góc nhìn của các người dùng khác trong phòng.