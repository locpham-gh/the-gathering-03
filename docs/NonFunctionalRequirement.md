# Non-Functional Requirement Specification

Project: The Gathering

Last updated: 2026-04-23

## 1. Scope

Tai lieu nay mo ta cac yeu cau phi chuc nang cho he thong The Gathering phu hop voi kien truc hien tai (Bun + Elysia + React + Pixi + MongoDB + WebSocket + LiveKit).

## 2. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Availability | He thong phai hoat dong o moi truong dev/staging voi uptime muc tieu >= 99.0% trong gio van hanh da dinh nghia. |
| NFR-02 | Startup | Backend phai khoi dong thanh cong voi cau hinh `.env` hop le va ket noi duoc MongoDB truoc khi phuc vu request nghiep vu. |
| NFR-03 | API Performance | Cac API CRUD thong thuong (`/api/rooms`, `/api/events`, `/api/forum/topics`, `/api/resources`) nen dat p95 < 500ms trong dieu kien tai trung binh (khong tinh network ben ngoai). |
| NFR-04 | Realtime Latency | Thong diep WebSocket `move` -> `player_moved` phai co do tre cam nhan thap, muc tieu <= 200ms trong LAN/Internet on dinh. |
| NFR-05 | Client UX | Trang giao dien chinh (landing, home, game) phai responsive tren desktop va laptop pho bien, khong vo layout o viewport >= 1280x720. |
| NFR-06 | Browser Compatibility | Ung dung web phai hoat dong tren Chrome/Edge phien ban hien hanh (2 major versions gan nhat). |
| NFR-07 | Security - Auth | Tat ca route can bao ve phai yeu cau JWT hop le qua header `Authorization: Bearer <token>`. |
| NFR-08 | Security - Input Validation | API phai validate schema body/query bang Elysia `t.Object(...)` cho cac endpoint co du lieu dau vao quan trong. |
| NFR-09 | Security - Secret Management | Khong hardcode credentials san xuat trong source; thong tin nhay cam (`JWT_SECRET`, SMTP, LiveKit keys) phai lay tu environment variables. |
| NFR-10 | Data Integrity | Cac truong duy nhat quan trong phai duoc rang buoc unique o DB (`users.email`, `rooms.code`). |
| NFR-11 | Error Handling | API phai tra status code phu hop (4xx/5xx) va payload loi co cau truc (`success: false`, `error/message`) de client xu ly. |
| NFR-12 | Session Persistence | Trang thai dang nhap phai duoc giu sau refresh browser thong qua local storage token/user. |
| NFR-13 | Maintainability | Source phai duoc tach module theo domain (auth, room, event, forum, resource, game) de de test va de mo rong. |
| NFR-14 | Code Quality | Frontend phai duoc lint voi ESLint; TypeScript duoc su dung cho ca client va server. |
| NFR-15 | Observability | Backend phai ghi log su kien quan trong (DB connect, WS connect/disconnect, loi runtime) de debug van hanh. |
| NFR-16 | Scalability (Current Limit) | Realtime state hien tai la in-memory map; he thong chap nhan mat state sau restart va duoc danh dau can nang cap khi scale nhieu instance. |
| NFR-17 | Scalability (Future) | Kien truc phai san sang thay in-memory realtime bang shared store (vi du Redis) de scale ngang trong future versions. |
| NFR-18 | Email Reliability | Neu gui OTP/event email that bai, he thong phai tra loi that bai ro rang cho client va khong crash process. |
| NFR-19 | Privacy | He thong chi luu tru thong tin user can thiet cho nghiep vu (email, displayName, avatar, auth metadata), khong thu thap du lieu ngoai pham vi tinh nang. |
| NFR-20 | Documentation | Tai lieu ky thuat (`SRS`, `implement`, `api_schema`) phai duoc cap nhat dong bo khi thay doi route/schema quan trong. |

## 3. Constraints and Known Trade-offs

- Realtime multiplayer state chua duoc persist sau restart backend.
- JWT chua bat buoc expiration cứng trong logic hien tai.
- Email delivery phu thuoc SMTP provider va network ben ngoai.

## 4. Validation Strategy

- API test thu cong qua Postman/Thunder Client cho auth, room, event, forum, resource.
- E2E smoke test thu cong: login -> create room -> join room -> move multiplayer -> schedule event -> forum post/reply.
- Performance spot-check qua browser devtools + server logs.
