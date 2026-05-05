# Hướng Dẫn Thiết Kế Mô Hình Use Case (Use Case Diagram & Description)

Tài liệu này hướng dẫn chi tiết cách đọc hiểu, phân tích và thiết kế Mô hình Use Case (Use Case Model) bao gồm Sơ đồ (Diagram) và Đặc tả (Description).

---

## PHẦN 1: SƠ ĐỒ USE CASE (USE CASE DIAGRAM)

### 1. Các thành phần cốt lõi
* **System Boundary (Ranh giới hệ thống):** Một khung hình chữ nhật bao quanh tất cả các Use Case, đại diện cho phạm vi của phần mềm. Tên hệ thống được ghi ở góc trên bên trong khung.
* **Actor (Tác nhân):** Người, hệ thống bên ngoài, hoặc thiết bị ngoại vi có tương tác với hệ thống. Luôn nằm **ngoài** ranh giới hệ thống. Biểu diễn bằng hình người (stickman) hoặc hình hộp chữ nhật có gắn thẻ `<<actor>>`.
* **Use Case (Chức năng):** Các chức năng có ý nghĩa của hệ thống. Luôn nằm **trong** ranh giới hệ thống. Biểu diễn bằng hình bầu dục (oval).

### 2. Các loại mối quan hệ (Relationships)
| Loại quan hệ | Ký hiệu | Ý nghĩa & Cách hoạt động |
| :--- | :--- | :--- |
| **Association** | Đường thẳng liền nét | Nối trực tiếp Actor và Use Case mà Actor đó sử dụng/tương tác. |
| **Include** | Mũi tên đứt nét (`<<include>>`) | Use Case A `<<include>>` Use Case B: Để thực hiện A thì **bắt buộc** phải thực hiện B trước. (Ví dụ: *Đăng tin* include *Đăng nhập*). Thứ tự: B thực hiện trước, A thực hiện sau. |
| **Extend** | Mũi tên đứt nét (`<<extend>>`) | Use Case A `<<extend>>` Use Case B: Đang làm A, **có thể** (không bắt buộc) làm thêm B. (Ví dụ: *Xem tin* extend *Bình luận*). Thứ tự: A thực hiện trước, B thực hiện sau. |
| **Generalization**| Mũi tên liền nét, đầu tam giác rỗng | Thể hiện tính tổng quát hóa/kế thừa. Thường dùng giữa các Actor. Actor con kế thừa quyền sử dụng Use Case của Actor cha và có Use Case riêng của nó. |

### 3. Quy tắc "Vàng" (Anti-patterns cần tránh)
* **KHÔNG phân mảnh chức năng thành thao tác:** Tuyệt đối không vẽ Use Case cho các thao tác giao diện nhỏ lẻ, vô nghĩa khi đứng một mình như: "Nhập mã khách hàng", "Nhập họ tên mới", "Click nút Quay về".
* **Đảm bảo tính trọn vẹn:** Một Use Case phải mang lại kết quả/giá trị trọn vẹn cho Actor.

---

## PHẦN 2: ĐẶC TẢ USE CASE (USE CASE SPECIFICATION)

Bản đặc tả mô tả chi tiết các bước thực hiện một chức năng từ lúc bắt đầu cho đến lúc kết thúc.

### 1. Cấu trúc chuẩn của một Đặc tả Use Case
* **Tên Use Case:** Tên chức năng đang mô tả.
* **Actor:** Tác nhân chính thực hiện chức năng.
* **Mô tả (Description):** Tóm tắt ngắn gọn mục đích của chức năng.
* **Tình huống chính (Main Success Scenario):** Chuỗi các bước lý tưởng từ khi bắt đầu đến khi thành công mà không gặp lỗi nào.
* **Tình huống thay thế (Alternative Scenarios):** Các nhánh rẽ (lập lỗi, hủy bỏ, sai thông tin) và cách hệ thống xử lý để đưa về luồng chính hoặc kết thúc sớm.

### 2. Ví dụ Đặc tả Use Case: Rút Tiền Từ Máy ATM
**1. Tên Use Case:** Rút tiền mặt (Withdraw Cash)
**2. Tác nhân (Actor):** Khách hàng (Customer)
**3. Mô tả:** Cho phép khách hàng rút tiền mặt từ tài khoản ngân hàng thông qua máy ATM.

**4. Tình huống chính (Main Success Scenario):**
1. Khách hàng đưa thẻ ngân hàng vào máy.
2. Hệ thống kiểm tra thẻ hợp lệ và yêu cầu nhập mã PIN.
3. Khách hàng nhập mã PIN.
4. Hệ thống xác thực mã PIN đúng và yêu cầu chọn giao dịch.
5. Khách hàng chọn "Rút tiền".
6. Hệ thống yêu cầu nhập số tiền.
7. Khách hàng nhập số tiền cần rút.
8. Hệ thống kiểm tra số dư hợp lệ, trừ tiền tài khoản, nhả tiền và in biên lai.
9. Khách hàng nhận tiền, biên lai và lấy lại thẻ.
10. Kết thúc Use Case.

**5. Các tình huống thay thế (Alternative Scenarios):**
* **Tình huống 1: Thẻ không hợp lệ (Rẽ nhánh tại bước 2)**
    * 2a. Hệ thống phát hiện thẻ lỗi/không đúng ngân hàng, thông báo lỗi và trả lại thẻ.
    * Kết thúc Use Case.
* **Tình huống 2: Sai mã PIN (Rẽ nhánh tại bước 4)**
    * 4a. Hệ thống báo sai mã PIN và yêu cầu nhập lại.
    * 4b. Khách hàng nhập lại (Quay về bước 3). Nếu sai quá số lần quy định, hệ thống nuốt thẻ. Kết thúc.
* **Tình huống 3: Không đủ tiền (Rẽ nhánh tại bước 8)**
    * 8a. Hệ thống báo tài khoản không đủ số dư.
    * 8b. Yêu cầu khách hàng nhập lại số tiền khác (Quay về bước 6) hoặc chọn hủy giao dịch.