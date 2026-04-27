# Non-Functional Requirement Specification

Project: The Gathering

Last updated: 2026-04-23

## 1. Scope

This document describes the non-functional requirements for the The Gathering system, aligned with its current architecture (Bun + Elysia + React + Pixi + MongoDB + WebSocket + LiveKit).

## 2. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Availability | The system must operate in dev/staging environments with a target uptime >= 99.0% during defined operational hours. |
| NFR-02 | Startup | The backend must start successfully with valid `.env` configuration and connect to MongoDB before serving business requests. |
| NFR-03 | API Performance | Standard CRUD APIs (`/api/rooms`, `/api/events`, `/api/forum/topics`, `/api/resources`) should achieve p95 < 500ms under average load (excluding external network latency). |
| NFR-04 | Real-time Latency | WebSocket `move` -> `player_moved` messages must have low perceived latency, targeting <= 200ms on stable LAN/Internet. |
| NFR-05 | Client UX | The main interface pages (landing, home, game) must be responsive on common desktops and laptops, maintaining layout integrity at viewports >= 1280x720. |
| NFR-06 | Browser Compatibility | The web application must function on current versions of Chrome and Edge (latest 2 major versions). |
| NFR-07 | Security - Auth | All protected routes must require a valid JWT via the `Authorization: Bearer <token>` header. |
| NFR-08 | Security - Input Validation | APIs must validate body/query schemas using Elysia `t.Object(...)` for endpoints with critical input data. |
| NFR-10 | Security - Secret Management | Do not hardcode production credentials in source; sensitive information (`JWT_SECRET`, SMTP, LiveKit keys) must be retrieved from environment variables. |
| NFR-10 | Data Integrity | Critical unique fields must be constrained at the DB level (`users.email`, `rooms.code`). |
| NFR-11 | Error Handling | The API must return appropriate status codes (4xx/5xx) and structured error payloads (`success: false`, `error/message`) for client consumption. |
| NFR-12 | Session Persistence | Login state must be maintained after browser refresh via local storage token/user data. |
| NFR-13 | Maintainability | Source code must be modularized by domain (auth, room, event, forum, resource, game) for easier testing and extension. |
| NFR-14 | Code Quality | Frontend must be linted with ESLint; TypeScript must be used for both client and server. |
| NFR-15 | Observability | The backend must log critical events (DB connection, WS connect/disconnect, runtime errors) for operational debugging. |
| NFR-16 | Scalability (Current Limit) | Real-time state is currently an in-memory map; the system accepts state loss upon restart and is marked for upgrade when scaling to multiple instances. |
| NFR-17 | Scalability (Future) | The architecture should be prepared to replace in-memory real-time state with a shared store (e.g., Redis) to enable horizontal scaling in future versions. |
| NFR-18 | Email Reliability | If sending OTP/event emails fails, the system must return a clear error to the client without crashing the process. |
| NFR-19 | Privacy | The system only stores user information necessary for business logic (email, displayName, avatar, auth metadata), without collecting data outside the feature scope. |
| NFR-20 | Documentation | Technical documentation (`SRS`, `implement`, `api_schema`) must be updated synchronously when critical routes or schemas change. |
| NFR-21 | Visual Excellence | The system must provide a "Premium" aesthetic with modern typography (Inter/Outfit), high-quality icons, and smooth UI transitions to enhance the professional co-working feel. |

## 3. Constraints and Known Trade-offs

- Real-time multiplayer state is not persisted after a backend restart.
- JWT does not currently enforce a strict expiration date in the existing logic.
- Email delivery depends on the SMTP provider and external network.

## 4. Validation Strategy

- Manual API testing via Postman/Thunder Client for auth, room, event, forum, and resources.
- Manual E2E smoke tests: login -> create room -> join room -> move multiplayer -> schedule event -> forum post/reply.
- Performance spot-checks via browser devtools and server logs.
