# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

## 1. Introduction

### 1.1 Purpose
The purpose of this project is to provide a virtual co-working platform named **The Gathering** that combines a SaaS-style productivity dashboard with an immersive 2D multiplayer environment. Responding to the needs of remote workers and students, users can collaborate in real-time within a shared digital space. Allowing users to manage virtual offices, schedule events, participate in community forums, and communicate via proximity-based video calls.

### 1.2 Scope
This project aims to bridge the gap between static management tools and immersive communication. It provides user authentication via Google and OTP, virtual room management, event scheduling with email notifications, a community forum, and a digital library for resource sharing. In addition, it features a multiplayer 2D office space using PixiJS where users can move, interact with specific zones, and engage in proximity-controlled video conferencing via LiveKit.

### 1.3 Definitions and Abbreviations
| **Term** | **Definition** |
| --- | --- |
| Avatar | The 2D sprite representing a user on the metaverse map. |
| Co-presence | The awareness of other users working simultaneously in the same virtual space. |
| Proximity audio/video | Media connection that activates automatically based on avatar spatial distance. |
| Zone | A functionally distinct area within the 2D map with specific behavioral rules. |
| JWT | JSON Web Token - stateless authentication credential. |
| OTP | One-Time Password - used for email verification. |
| WASD | Keyboard movement keys: W (up), A (left), S (down), D (right). |
| MVP | Minimum Viable Product. |
| SRS | Software Requirements Specification. |

### 1.4 References
- IEEE Std 830-1998: Recommended Practice for Software Requirements Specifications
- LiveKit documentation: https://docs.livekit.io
- PixiJS v7 documentation: https://pixijs.com/guides

---

## 2. Overall description

### 2.1 System Context
The Gathering operates as a web-based collaborative environment integrating a React-based frontend with a high-performance Bun/Elysia backend and third-party communication services.

*[Chèn hình ảnh: Sơ đồ System Context Diagram tại đây]*

- **Frontend (apps/client)**: A React-based SPA built with Vite, utilizing PixiJS for 2D rendering and Tailwind CSS.
- **Backend (apps/server)**: A Bun-based server using ElysiaJS framework for RESTful APIs and WebSocket.
- **Database**: MongoDB Atlas for storing user profiles, room data, schedules, forums, etc.
- **External Services**: Google Identity (OAuth 2.0), SMTP Service (Gmail for OTP/Invitations), LiveKit Server (WebRTC streams).

### 2.2 User Classes and Characteristics
- **Guest / User**: Can register via Google or Email OTP.
- **Authenticated User**: Can join rooms via codes, participate in the 2D workspace, post in forums, and view resources.
- **Room Owner**: Can manage room settings, including renaming or deleting rooms and managing membership (kicking users).
- **Event Host**: Can create and manage scheduled meetings, sending automated invitations to guest emails.
- **Admins**: Have full platform oversight, including user management, room monitoring, and forum moderation.

### 2.3 Assumptions and Constraints
- **Infrastructure Budget**: Development and initial hosting must rely on free-tier services (e.g., MongoDB Atlas, LiveKit Cloud free tier), limiting max concurrent video participants and total storage (~512MB).
- **Selective Persistence**: Critical real-time data (player positions, whiteboard) are persisted in MongoDB via 30s snapshots using a periodic loop in `server/src/index.ts` to balance DB write load.
- **Browser Compatibility**: Designed for modern evergreen browsers (Chrome, Edge, Firefox). Relies on WebGL and WebRTC.
- **Network dependency**: Requires a stable internet connection for WebSocket and WebRTC (LiveKit).

---

## 3. Specific requirements (Functional Requirements)

*[Chèn hình ảnh: Sơ đồ Global Use Case Diagram tại đây]*

### 3.1 Authentication & User Profile (AUTH/PROF)

*[Chèn hình ảnh: Sơ đồ Use Case Diagram - Authentication & Profile tại đây]*

| **ID** | **Requirement** | **Priority** |
| --- | --- | --- |
| FR-AUTH-01 | **Register Account**: Allow new users to create memberships via Google or Email verification (OTP). | High |
| FR-AUTH-02 | **Login Account**: Allow existing members to verify identity and access the dashboard. | High |
| FR-AUTH-03 | **Update Profile**: Allow members to personalize their display name and visual avatar. | Medium |
| FR-AUTH-04 | **Status Selection**: Allow users to set their focus status, which reflects in real-time. | Medium |

### 3.2 Room & Membership Management (ROOM)

*[Chèn hình ảnh: Sơ đồ Use Case Diagram - Room Management tại đây]*

| **ID** | **Requirement** | **Priority** |
| --- | --- | --- |
| FR-ROOM-01 | **Create Room**: Establish a new virtual workspace with a unique shareable access code. | High |
| FR-ROOM-02 | **Join Room**: Enter an existing workspace by providing a valid invitation code. | High |
| FR-ROOM-03 | **Manage Room Members**: Workspace managers (Room Owners) can moderate occupancy and update workspace configurations. | High |

### 3.3 Real-time Interaction & Spatial Media (SPACE)

*[Chèn hình ảnh: Sơ đồ Use Case Diagram - Spatial Interaction tại đây]*

| **ID** | **Requirement** | **Priority** |
| --- | --- | --- |
| FR-SPACE-01 | **Real-time Movement**: Navigate the character in the 2D map using WASD/Arrows, including interactions like sitting on furniture. | High |
| FR-SPACE-02 | **Proximity Audio/Video**: Spontaneous verbal/visual collaboration occurs when team members approach each other. System triggers LiveKit connection when distance < 100 units. | High |
| FR-SPACE-03 | **Phone Interaction**: Signal status or focus through a visual animation (Shortcut: Q) to the team. | High |
| FR-SPACE-04 | **Mini-map & Environment**: Provide a spatial overview map of the office layout and team distribution. | Medium |
| FR-SPACE-05 | **Spatial Chat Filtering**: Localized chat messages visible only to nearby participants within a designated "hearing" radius. | High |

### 3.4 Collaboration & Community Features (COL)

*[Chèn hình ảnh: Sơ đồ Use Case Diagram - Collaboration Module tại đây]*

| **ID** | **Requirement** | **Priority** |
| --- | --- | --- |
| FR-COL-01 | **Schedule Event**: Organize team meetings and automatically send HTML email invitations to participants. | Medium |
| FR-COL-02 | **Collaborative Whiteboard**: Real-time visual brainstorming (via Excalidraw) synchronized across the team. | High |
| FR-COL-03 | **Create Forum Topic**: Initiate new knowledge-sharing discussions in the community forum. | Medium |
| FR-COL-04 | **Reply to Topic**: Contribute to existing community discussions. | Medium |
| FR-COL-05 | **Search Digital Library**: Locate shared team resources, documents, or links by title or tags. | Medium |

### 3.5 Administrative & System Control (ADM)

*[Chèn hình ảnh: Sơ đồ Use Case Diagram - Administration Module tại đây]*

| **ID** | **Requirement** | **Priority** |
| --- | --- | --- |
| FR-ADM-01 | **Admin Management Dashboard**: Specialized oversight interface for platform moderation and management. | High |
| FR-ADM-02 | **Monitor Content**: Admin can manage all user accounts, rooms, and delete inappropriate forum topics. | High |

---

## 4. Non-Functional Requirements

### 4.1 Performance & Concurrency
- **NFR-PERF-01**: The system shall respond to REST API requests in under 500ms (p95) under normal conditions.
- **NFR-PERF-02**: The system shall support at least 20 concurrent users per virtual room without significant movement jitter, broadcasting position updates with a delay of less than 100ms.
- **NFR-PERF-03**: The game canvas shall maintain a frame rate of 60 FPS on standard hardware.

### 4.2 Security
- **NFR-SEC-01**: All private endpoints (Rooms, Profile, Events) must require a valid Bearer Token in the Authorization header.
- **NFR-SEC-02**: The system must verify Google ID tokens on the backend before issuing a session JWT.
- **NFR-SEC-03**: The server shall enforce rate-limiting on all public API endpoints to protect against DDoS attacks.
- **NFR-SEC-04**: The server shall implement a CORS policy allowing requests only from the configured client URL.

### 4.3 Maintainability & Structure
- **NFR-MAIN-01**: The codebase must follow a modular structure with separate controllers and routes for each domain (Domain-Driven Design).

---

## 5. External Interface & System Requirements

### 5.1 User Interface
The system utilizes a modern "Glassmorphism" UI style (semi-transparent backgrounds with backdrop blur) to provide a premium, immersive experience. The UI shall be responsive, adjusting the dashboard layout for different screen sizes.

### 5.2 Backend API Interface
The backend (Bun/Elysia) exposes a RESTful JSON API. All data exchanges follow standard HTTP status codes.
- **Centralized Fetch**: The frontend shall communicate with the backend using a centralized `apiFetch` wrapper that automatically attaches the Authorization header.

### 5.3 WebSocket Interface
- The server shall handle WebSocket connections on `/ws`, managing a room-based pub/sub system for position updates.
- The frontend WebSocket hook shall handle automatic reconnection with exponential backoff if the connection is lost.
- Visual feedback (blurring avatar, "Connecting..." icon) shall be provided during reconnection attempts.

### 5.4 LiveKit Interface
- The client shall connect to the LiveKit cloud when the proximity threshold is met (< 100 units), subscribing to the neighbor's video/audio track.
- The server shall integrate with `LiveKit-server-sdk` to issue JWT access tokens for video sessions on demand.
- The proximity call system shall use AEC (Acoustic Echo Cancellation) and noise suppression provided by the LiveKit SDK.

### 5.5 Google OAuth Interface
Google One Tap OAuth2 is implemented. The system verifies identity tokens via Google Auth Library before granting access.

### 5.6 Email Interface
The system shall send HTML-formatted invitation emails for scheduled events and OTP codes using Nodemailer with Gmail SMTP.
