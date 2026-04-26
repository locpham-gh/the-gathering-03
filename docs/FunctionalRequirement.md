# Functional Requirement Specification

Project: The Gathering

Last updated: 2026-04-23

## 1. Scope

This document lists all functional requirements currently in the The Gathering codebase (apps/client + apps/server). These requirements define the system capabilities to ensure compliance with the running product.

## 2. Actors

- Guest: Unauthenticated user.
- Authenticated User: User who has logged in via Google or OTP.
- Room Owner: User who owns a room.
- Event Host: User who creates an event (can be the same as the Room Owner).
- System Services: Google Identity, Email SMTP, LiveKit.

## 3. Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | The system must allow login via Google One Tap. | Must | Implemented |
| FR-02 | The system must verify Google credentials at the backend and issue a JWT session token. | Must | Implemented |
| FR-03 | The system must allow requesting an OTP via login email. | Must | Implemented |
| FR-04 | The system must verify the OTP (6 digits, expiry checked) and issue a JWT. | Must | Implemented |
| FR-05 | The system must save user session data (`user`, `token`) in local storage to maintain login state. | Must | Implemented |
| FR-06 | The system must allow logging out and clearing the local session. | Must | Implemented |
| FR-07 | The system must allow profile updates (`displayName`, `avatarUrl`). | Must | Implemented |
| FR-08 | The system must protect dashboard/game routes from guest access. | Must | Implemented |
| FR-09 | The system must allow users to create new rooms with a `name` and `code`. | Must | Implemented |
| FR-10 | The system must allow users to join a room by room code. | Must | Implemented |
| FR-11 | The system must allow users to view a list of rooms they own or have joined. | Must | Implemented |
| FR-12 | The system must allow the owner to rename a room. | Must | Implemented |
| FR-13 | The system must allow the owner to delete a room. | Must | Implemented |
| FR-14 | The system must allow the owner to view the list of room members. | Must | Implemented |
| FR-15 | The system must allow the owner to kick members from a room. | Must | Implemented |
| FR-16 | The system must allow users to enter the 2D space via the `/room/:roomCode` route. | Must | Implemented |
| FR-17 | The system must load the tilemap (office/classroom) and render the game using PixiJS. | Must | Implemented |
| FR-18 | The system should allow users to select a character before entering the game. | Should | Implemented |
| FR-19 | The system must synchronize player positions in real-time via WebSocket. | Must | Implemented |
| FR-20 | The system must notify clients of `initial_state`, `player_moved`, and `player_left` events. | Must | Implemented |
| FR-21 | The system must support proximity calls and fetch LiveKit tokens from the backend. | Must | Implemented |
| FR-22 | The system must allow users to create events (linking to an existing room or creating a new room for the event). | Must | Implemented |
| FR-23 | The system must allow users to view their list of events (as host or guest). | Must | Implemented |
| FR-24 | The system must allow hosts to delete events. | Must | Implemented |
| FR-25 | The system should send invitation emails when creating an event that includes `guestEmails`. | Should | Implemented |
| FR-26 | The system must allow users to post forum topics. | Must | Implemented |
| FR-27 | The system must allow users to reply to topics (thread replies). | Must | Implemented |
| FR-28 | The system must allow authors to delete their own topics. | Must | Implemented |
| FR-29 | The system must allow users to access the Digital Library in-game (within the `library` zone). | Must | Implemented |
| FR-30 | The system must allow searching/filtering resources by text, type, and tag. | Must | Implemented |
| FR-31 | The system should display room members and their online/offline status in the RoomSidebar. | Should | Implemented |
| FR-32 | The system should allow users to open the forum and events manager directly within the RoomSidebar. | Should | Implemented |
| FR-33 | The system must allow users to toggle between Light and Dark themes in the 2D space. | Must | Implemented |
| FR-34 | The system must save and persist the user's theme preference. | Must | Implemented |
| FR-35 | The system must provide fullscreen immersive views for Chat and Calendar modules. | Must | Implemented |

## 4. Out of Scope (Current Version)

- Overall admin dashboard and role-based moderation.
- Service directory UI/API (only the `Service` model is implemented).
- persistence of real-time positions is implemented; full state (emotes, current zone) persistence is future work.

## 5. Traceability to Main Modules

- Auth: `apps/client/src/components/auth/*`, `apps/server/src/routes/auth.routes.ts`
- Rooms: `apps/client/src/components/dashboard/rooms/*`, `apps/server/src/routes/room.routes.ts`
- Events: `apps/client/src/components/dashboard/events/*`, `apps/server/src/routes/event.routes.ts`
- Forum: `apps/client/src/components/dashboard/CommunityForum.tsx`, `apps/server/src/routes/forum.routes.ts`
- Library: `apps/client/src/components/game/library/*`, `apps/server/src/routes/resource.routes.ts`
- Multiplayer: `apps/client/src/hooks/useMultiplayer.ts`, `apps/server/src/index.ts` (`/ws`)
- Video: `apps/client/src/components/game/ui/LiveKitModal.tsx`, `apps/server/src/index.ts` (`/api/livekit/token`)
