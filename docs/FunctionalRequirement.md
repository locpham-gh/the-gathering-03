# Functional Requirement Specification

Project: The Gathering

Last updated: 2026-04-23

## 1. Scope

Tai lieu nay liet ke toan bo functional requirements dang co trong codebase hien tai cua The Gathering (apps/client + apps/server). Cac muc duoi day la yeu cau he thong can dam bao de phu hop voi san pham dang chay.

## 2. Actors

- Guest: nguoi chua dang nhap.
- Authenticated User: nguoi da dang nhap qua Google hoac OTP.
- Room Owner: user so huu room.
- Event Host: user tao su kien (co the trung Room Owner).
- System Services: Google Identity, Email SMTP, LiveKit.

## 3. Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | He thong phai cho phep dang nhap bang Google One Tap. | Must | Implemented |
| FR-02 | He thong phai xac thuc Google credential tai backend va cap JWT session token. | Must | Implemented |
| FR-03 | He thong phai cho phep yeu cau OTP qua email dang nhap. | Must | Implemented |
| FR-04 | He thong phai xac minh OTP (6 so, het han) va cap JWT. | Must | Implemented |
| FR-05 | He thong phai luu session user (`user`, `token`) tren local storage de duy tri dang nhap. | Must | Implemented |
| FR-06 | He thong phai cho phep dang xuat va xoa session local. | Must | Implemented |
| FR-07 | He thong phai cho phep cap nhat profile (`displayName`, `avatarUrl`). | Must | Implemented |
| FR-08 | He thong phai bao ve route dashboard/game, khong cho guest truy cap. | Must | Implemented |
| FR-09 | He thong phai cho phep user tao room moi voi `name` va `code`. | Must | Implemented |
| FR-10 | He thong phai cho phep user join room bang room code. | Must | Implemented |
| FR-11 | He thong phai cho phep user xem danh sach room da so huu hoac da tham gia. | Must | Implemented |
| FR-12 | He thong phai cho phep owner doi ten room. | Must | Implemented |
| FR-13 | He thong phai cho phep owner xoa room. | Must | Implemented |
| FR-14 | He thong phai cho phep owner xem danh sach thanh vien room. | Must | Implemented |
| FR-15 | He thong phai cho phep owner kick thanh vien khoi room. | Must | Implemented |
| FR-16 | He thong phai cho phep user vao khong gian 2D theo route `/room/:roomCode`. | Must | Implemented |
| FR-17 | He thong phai tai tilemap (office/classroom) va render game bang PixiJS. | Must | Implemented |
| FR-18 | He thong phai cho phep user chon nhan vat truoc khi vao game. | Should | Implemented |
| FR-19 | He thong phai dong bo vi tri player theo thoi gian thuc qua WebSocket. | Must | Implemented |
| FR-20 | He thong phai thong bao su kien `initial_state`, `player_moved`, `player_left` cho client. | Must | Implemented |
| FR-21 | He thong phai cho phep proximity call va xin LiveKit token tu backend. | Must | Implemented |
| FR-22 | He thong phai cho phep user tao event (theo room co san hoac tao room moi tu event). | Must | Implemented |
| FR-23 | He thong phai cho phep user xem danh sach event cua minh (host hoac guest). | Must | Implemented |
| FR-24 | He thong phai cho phep host xoa event. | Must | Implemented |
| FR-25 | He thong phai gui email moi khi tao event co `guestEmails`. | Should | Implemented |
| FR-26 | He thong phai cho phep user viet topic forum. | Must | Implemented |
| FR-27 | He thong phai cho phep user tra loi topic (thread replies). | Must | Implemented |
| FR-28 | He thong phai cho phep author xoa topic cua chinh minh. | Must | Implemented |
| FR-29 | He thong phai cho phep user truy cap Digital Library trong game (zone `library`). | Must | Implemented |
| FR-30 | He thong phai cho phep tim kiem/filter resources theo text, type, tag. | Must | Implemented |
| FR-31 | He thong phai hien thi danh sach thanh vien room va trang thai online/offline trong RoomSidebar. | Should | Implemented |
| FR-32 | He thong phai cho phep user mo forum va events manager ngay trong RoomSidebar. | Should | Implemented |

## 4. Out of Scope (Current Version)

- Admin dashboard va role-based moderation tong the.
- Service directory UI/API (chi moi co `Service` model).
- Persist realtime player state sau khi server restart.

## 5. Traceability to Main Modules

- Auth: `apps/client/src/components/auth/*`, `apps/server/src/routes/auth.routes.ts`
- Rooms: `apps/client/src/components/dashboard/rooms/*`, `apps/server/src/routes/room.routes.ts`
- Events: `apps/client/src/components/dashboard/events/*`, `apps/server/src/routes/event.routes.ts`
- Forum: `apps/client/src/components/dashboard/CommunityForum.tsx`, `apps/server/src/routes/forum.routes.ts`
- Library: `apps/client/src/components/game/library/*`, `apps/server/src/routes/resource.routes.ts`
- Multiplayer: `apps/client/src/hooks/useMultiplayer.ts`, `apps/server/src/index.ts` (`/ws`)
- Video: `apps/client/src/components/game/ui/LiveKitModal.tsx`, `apps/server/src/index.ts` (`/api/livekit/token`)
