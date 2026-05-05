# Use Case Specification (SRS Table Format) - The Gathering

Version: 3.0

Last updated: 2026-04-23

## 1. Purpose

This document specifies use cases using the standard SRS table format to facilitate academic review and easier documentation management.

## 2. Actors

- Guest: Unauthenticated user.
- Authenticated User: User who has successfully logged in.
- Room Owner: The owner of a specific room.
- Event Host: The creator of an event.
- Google Identity: Authentication service for verifying Google tokens.
- SMTP Provider: Email service for sending OTPs and event invitations.
- LiveKit: Real-time video/audio communication service.

## 3. Use Case Overview

| Use Case ID | Use Case Name | Primary Actor | Priority |
|---|---|---|---|
| UC-01 | Login with Google | Guest | Must |
| UC-02 | Login with Email OTP | Guest | Must |
| UC-03 | Update Profile | Authenticated User | Must |
| UC-04 | Create Room | Authenticated User | Must |
| UC-05 | Join Room by Code | Authenticated User | Must |
| UC-06 | Manage Room Members | Room Owner | Must |
| UC-07 | Enter 2D Room | Authenticated User | Must |
| UC-08 | Sync Multiplayer Position | Authenticated User | Must |
| UC-09 | Start Proximity Call | Authenticated User | Must |
| UC-10 | Schedule Event | Event Host | Must |
| UC-11 | Manage Own Events | Event Host | Must |
| UC-12 | Post/Reply Forum Topic | Authenticated User | Must |
| UC-13 | Access Digital Library | Authenticated User | Must |
| UC-14 | Toggle Light/Dark Theme | Authenticated User | Must |
| UC-15 | Open Fullscreen Chat/Calendar | Authenticated User | Should |
| UC-16 | Use Collaborative Whiteboard | Authenticated User | Must |
| UC-17 | Manage Platform (Admin) | Admin | Must |
| UC-18 | View Mini-map & Environment | Authenticated User | Should |
| UC-19 | Phone Interaction (Q Key) | Authenticated User | Must |
| UC-20 | Spatial Chat Filtering | Authenticated User | Must |
| UC-21 | Directional Seat Snapping | Authenticated User | Must |
| UC-22 | Web Audio Spatial Engine | Authenticated User | Must |
| UC-23 | Spatial Video Overlay | Authenticated User | Must |
| UC-24 | Glassmorphic UI Interaction | Authenticated User | Should |
| UC-25 | Periodic State Snapshots | System | Must |
| UC-26 | API Rate Limiting | System | Must |

## 4. Use Case Diagram

```mermaid
usecaseDiagram
    actor "User" as U
    actor "Room Owner" as O
    actor "Event Host" as H
    actor "Admin" as A
    actor "System" as S

    package "The Gathering" {
        usecase "UC-01 Login" as UC1
        usecase "UC-03 Update Profile" as UC3
        usecase "UC-04 Create Room" as UC4
        usecase "UC-05 Join Room" as UC5
        usecase "UC-07 Enter 2D Room" as UC7
        usecase "UC-08 Sync Position" as UC8
        usecase "UC-09 Proximity Call" as UC9
        usecase "UC-10 Schedule Event" as UC10
        usecase "UC-12 Forum Post" as UC12
        usecase "UC-13 Digital Library" as UC13
        usecase "UC-16 Whiteboard" as UC16
        usecase "UC-17 Admin Panel" as UC17
        usecase "UC-19 Phone Animation" as UC19
        usecase "UC-20 Spatial Chat" as UC20
        usecase "UC-21 Seat Snapping" as UC21
        usecase "UC-22 Spatial Audio" as UC22
        usecase "UC-23 Spatial Video Overlay" as UC23
        usecase "UC-25 State Snapshots" as UC25
    }

    U --> UC1
    U --> UC3
    U --> UC5
    U --> UC7
    U --> UC8
    U --> UC9
    U --> UC12
    U --> UC13
    U --> UC16
    U --> UC19
    U --> UC20
    U --> UC21
    U --> UC22
    U --> UC23

    U <|-- O
    O --> UC4
    
    U <|-- H
    H --> UC10

    U <|-- A
    A --> UC17

    S --> UC25
```

## 5. Detailed Use Cases (SRS Tables)

### UC-01 - Login with Google

| Field | Description |
|---|---|
| Use Case ID | UC-01 |
| Use Case Name | Login with Google |
| Primary Actor | Guest |
| Supporting Actors | Google Identity |
| Preconditions | User is on the landing page; stable internet connection; Google script loaded successfully. |
| Trigger | User clicks the Google Login button. |
| Basic Flow | 1. User selects Google login.<br>2. Client receives Google credential.<br>3. Client calls `POST /api/auth/google`.<br>4. Server verifies the token with Google Identity.<br>5. Server upserts the user and generates a JWT.<br>6. Client saves the `token` and `user` in local storage.<br>7. Client navigates to `/home`. |
| Alternative Flow | A1. User cancels the Google popup -> stays on landing page, not logged in.<br>A2. User has a valid session -> skips login, enters `/home` directly. |
| Exception Flow | E1. Invalid Google token -> API returns `401`, client displays error message.<br>E2. Network error/API timeout -> client displays notification and allows retry. |
| Postconditions | User successfully logged in with a JWT session. |

### UC-02 - Login with Email OTP

| Field | Description |
|---|---|
| Use Case ID | UC-02 |
| Use Case Name | Login with Email OTP |
| Primary Actor | Guest |
| Supporting Actors | SMTP Provider |
| Preconditions | User provides a valid email; SMTP service is correctly configured. |
| Trigger | User enters email and requests OTP. |
| Basic Flow | 1. User enters email.<br>2. Client calls `POST /api/auth/otp/request`.<br>3. Server generates a 6-digit OTP, sets 5-minute expiry, and saves to DB.<br>4. Server sends OTP via email.<br>5. User enters OTP.<br>6. Client calls `POST /api/auth/otp/verify`.<br>7. Server verifies OTP and returns JWT + user data.<br>8. Client saves session and redirects to `/home`. |
| Alternative Flow | A1. User enters a different email before verifying OTP.<br>A2. User switches to Google login instead of OTP. |
| Exception Flow | E1. Invalid email format -> client prevents submission.<br>E2. Incorrect/expired OTP -> API returns error, user re-enters OTP.<br>E3. Email delivery failure -> API returns error, user retries OTP request. |
| Postconditions | User successfully logged in via OTP, session created. |

### UC-03 - Update Profile

| Field | Description |
|---|---|
| Use Case ID | UC-03 |
| Use Case Name | Update Profile |
| Primary Actor | Authenticated User |
| Preconditions | User is logged in with a valid JWT. |
| Trigger | User opens the profile tab and clicks Save Changes. |
| Basic Flow | 1. User opens the profile page.<br>2. User modifies `displayName` and/or `avatarUrl`.<br>3. Client calls `PUT /api/auth/profile` with JWT.<br>4. Server updates user in DB.<br>5. Client updates AuthContext and local storage.<br>6. UI displays a success notification. |
| Alternative Flow | A1. User only updates one field (`displayName` or `avatarUrl`). |
| Exception Flow | E1. Invalid JWT -> unauthorized.<br>E2. Invalid input -> update fails, error message displayed. |
| Postconditions | New profile information is used across the dashboard and game rooms. |

### UC-04 - Create Room

| Field | Description |
|---|---|
| Use Case ID | UC-04 |
| Use Case Name | Create Room |
| Primary Actor | Authenticated User |
| Preconditions | User is successfully logged in. |
| Trigger | User clicks Create/Start Instant on the dashboard. |
| Basic Flow | 1. User enters a room name (optional).<br>2. User selects a map type (Office, Café, Garden, etc.).<br>3. Client generates a room code and calls `POST /api/rooms`.<br>4. Server creates the room with selected mapType, sets owner = user, and initial members = [owner].<br>5. Client refreshes the room list.<br>6. Client redirects user to `/room/:code`. |
| Alternative Flow | A1. User does not enter a room name -> system uses a default name. |
| Exception Flow | E1. Duplicate room code or invalid data -> API returns error, user retries.<br>E2. Database connection error -> room creation fails. |
| Postconditions | A new room exists and the user becomes the Room Owner. |

### UC-05 - Join Room by Code

| Field | Description |
|---|---|
| Use Case ID | UC-05 |
| Use Case Name | Join Room by Code |
| Primary Actor | Authenticated User |
| Preconditions | User is logged in and has a valid room code. |
| Trigger | User enters code and clicks Join, or accesses `/room/:roomCode` directly. |
| Basic Flow | 1. Client navigates to the room route based on the code.<br>2. Client calls `POST /api/rooms/join/:code`.<br>3. Server finds the room by code.<br>4. If the user is not already a member, server adds them to `members`.<br>5. User enters the game room successfully. |
| Alternative Flow | A1. User is already a member -> skip addition step, enter room normally. |
| Exception Flow | E1. Room code does not exist -> API returns `404`.<br>E2. Invalid token -> API returns `401`. |
| Postconditions | User becomes a member of the room (if they weren't already). |

### UC-06 - Manage Room Members

| Field | Description |
|---|---|
| Use Case ID | UC-06 |
| Use Case Name | Manage Room Members |
| Primary Actor | Room Owner |
| Preconditions | User is the owner of the room. |
| Trigger | Owner opens the Room Management Modal. |
| Basic Flow | 1. Owner opens the room management modal.<br>2. Client calls `GET /api/rooms/:id/members` to fetch the member list.<br>3. Owner renames the room -> `PATCH /api/rooms/:id`.<br>4. Owner kicks a member -> `POST /api/rooms/:id/kick`.<br>5. Client reloads the member list after changes. |
| Alternative Flow | A1. Owner views the list without making any updates. |
| Exception Flow | E1. Non-owner tries to update/kick -> API returns `403`.<br>E2. Room does not exist -> `404`. |
| Postconditions | Room configuration and member list are updated according to the owner's actions. |

### UC-07 - Enter 2D Room

| Field | Description |
|---|---|
| Use Case ID | UC-07 |
| Use Case Name | Enter 2D Room |
| Primary Actor | Authenticated User |
| Preconditions | User logged in; room code valid; map assets exist. |
| Trigger | User navigates to route `/room/:roomCode`. |
| Basic Flow | 1. Client loads map JSON/Image based on room mapType.<br>2. Client renders PixiJS stage, layers, and entities.<br>3. User chooses a character if not previously selected.<br>4. Mini-map and Day/Night overlay are initialized.<br>5. RoomSidebar displays participants/forum/events.<br>6. User begins moving in the 2D world. |
| Alternative Flow | A1. User leaves the room using the leave button -> redirects to `/home`. |
| Exception Flow | E1. Error loading map/assets -> displays fallback loading/error state.<br>E2. Token expired -> redirects to login page. |
| Postconditions | User is active and interacting within the game room. |

### UC-08 - Sync Multiplayer Position

| Field | Description |
|---|---|
| Use Case ID | UC-08 |
| Use Case Name | Sync Multiplayer Position |
| Primary Actor | Authenticated User |
| Supporting Actors | WebSocket Server |
| Preconditions | User is in a room; WS connection successful. |
| Trigger | User moves or changes state (sitting/standing). |
| Basic Flow | 1. Client opens connection `WS /ws?room=<code>`.<br>2. Server sends `initial_state`.<br>3. Client sends `move` payload at 20Hz throttle.<br>4. Server updates `activePlayers` in-memory.<br>5. Server broadcasts `player_moved` to the room.<br>6. Clients render new player positions.<br>7. When a user disconnects, server broadcasts `player_left`. |
| Alternative Flow | A1. User remains idle; no new move messages are sent. |
| Exception Flow | E1. WS connection lost -> sync interrupted until reconnection.<br>E2. Server restart -> in-memory state reset. |
| Post-conditions | All users see each other's avatars at the correct coordinates; the system saves the last known position to MongoDB upon disconnect. |

### UC-09 - Start Proximity Call

| Field | Description |
|---|---|
| Use Case ID | UC-09 |
| Use Case Name | Start Proximity Call |
| Primary Actor | Authenticated User |
| Supporting Actors | LiveKit |
| Preconditions | Other players nearby based on proximity logic; LiveKit environment configured. |
| Trigger | System detects players within proximity range. |
| Basic Flow | 1. Client identifies the nearest target player.<br>2. Client calls `GET /api/livekit/token?room=...&username=...`.<br>3. Server generates and returns LiveKit JWT token.<br>4. Client opens LiveKit modal and joins calling room.<br>5. Users exchange real-time voice/video. |
| Alternative Flow | A1. User moves away from proximity range -> disconnects call and closes modal. |
| Exception Flow | E1. Unable to fetch token -> call does not start.<br>E2. LiveKit server unavailable -> join fails. |
| Postconditions | User joins the call room when proximity conditions are met. |

### UC-10 - Schedule Event

| Field | Description |
|---|---|
| Use Case ID | UC-10 |
| Use Case Name | Schedule Event |
| Primary Actor | Event Host |
| Supporting Actors | SMTP Provider |
| Preconditions | User logged in; has event creation permissions. |
| Trigger | Host clicks Save in the Schedule Event Modal. |
| Basic Flow | 1. Host enters event details (title, description, start/end).<br>2. Host selects existing room or creates new one (`roomId=new`).<br>3. Host enters guest email list.<br>4. Client calls `POST /api/events`.<br>5. Server creates event (and new room if required).<br>6. Server sends invitation emails to the guest list.<br>7. Client displays success notification and refreshes list. |
| Alternative Flow | A1. Host omits guest emails -> event created without sending invitations.<br>A2. Host creates event from room list or room sidebar. |
| Exception Flow | E1. End time <= start time -> client prevents submission.<br>E2. SMTP error -> API returns error regarding email/event creation. |
| Postconditions | Event saved to DB and visible in Events Manager. |

### UC-11 - Manage Own Events

| Field | Description |
|---|---|
| Use Case ID | UC-11 |
| Use Case Name | Manage Own Events |
| Primary Actor | Event Host |
| Preconditions | User is successfully logged in. |
| Trigger | User opens the Events tab. |
| Basic Flow | 1. Client calls `GET /api/events`.<br>2. System displays upcoming/past events.<br>3. User opens event details from the card.<br>4. If user is the host, they can delete it (`DELETE /api/events/:id`).<br>5. List reloads after deletion. |
| Alternative Flow | A1. User views events without making any changes. |
| Exception Flow | E1. Non-host tries to delete event -> `403`.<br>E2. Event was already deleted -> `404`. |
| Postconditions | User's event list is accurately updated. |

### UC-12 - Post/Reply Forum Topic

| Field | Description |
|---|---|
| Use Case ID | UC-12 |
| Use Case Name | Post/Reply Forum Topic |
| Primary Actor | Authenticated User |
| Preconditions | User logged in with a valid JWT. |
| Trigger | User submits a new topic or reply. |
| Basic Flow | 1. Client fetches topic list (`GET /api/forum/topics`).<br>2. User creates a topic (`POST /api/forum/topics`).<br>3. User replies to a topic (`POST /api/forum/topics/:id/replies`).<br>4. Author can delete their own topic (`DELETE /api/forum/topics/:id`).<br>5. Feed reloads with fresh data. |
| Alternative Flow | A1. User reads forum without posting or replying. |
| Exception Flow | E1. Missing token -> unauthorized for post/reply/delete actions.<br>E2. Deleting topic as non-author -> forbidden. |
| Postconditions | Topic and replies are saved and displayed in the forum feed. |

### UC-13 - Access Digital Library

| Field | Description |
|---|---|
| Use Case ID | UC-13 |
| Use Case Name | Access Digital Library |
| Primary Actor | Authenticated User |
| Preconditions | User is in a game room; enters the `library` zone. |
| Trigger | User interacts with the library zone (E key). |
| Basic Flow | 1. System opens the Library Modal.<br>2. Client calls `GET /api/resources` with filters `search/type/tag`.<br>3. Server returns filtered resources.<br>4. Client displays cards and resource details.<br>5. User searches for desired documents. |
| Alternative Flow | A1. User clears filters to return to the full list. |
| Exception Flow | E1. No matching resources found -> displays empty state.<br>E2. API error -> displays data fetch fail notification. |
### UC-16 - Use Collaborative Whiteboard

| Field | Description |
|---|---|
| Use Case ID | UC-16 |
| Use Case Name | Use Collaborative Whiteboard |
| Primary Actor | Authenticated User |
| Preconditions | User is in a game room; enters the `whiteboard` zone. |
| Trigger | User interacts with the whiteboard zone (E key). |
| Basic Flow | 1. System opens the Whiteboard Modal (Excalidraw).<br>2. Client fetches existing state from server/DB.<br>3. User draws/edits elements on the board.<br>4. Changes are broadcast to all other users in the room via WebSocket.<br>5. Server persists the latest state to MongoDB. |
| Postconditions | All users in the room see synchronized whiteboard content. |

### UC-17 - Manage Platform (Admin)

| Field | Description |
|---|---|
| Use Case ID | UC-17 |
| Use Case Name | Manage Platform (Admin) |
| Primary Actor | Admin |
| Preconditions | User has `isAdmin: true` flag. |
| Trigger | Admin navigates to `/admin`. |
| Basic Flow | 1. Admin views platform statistics (users, rooms).<br>2. Admin manages user accounts (Ban/Delete/Promote).<br>3. Admin manages active rooms.<br>4. Admin moderates forum topics and replies. |
| Postconditions | Platform state is updated based on admin actions. |


### UC-21 - Directional Seat Snapping

| Field | Description |
|---|---|
| Use Case ID | UC-21 |
| Use Case Name | Directional Seat Snapping |
| Primary Actor | Authenticated User |
| Preconditions | User is near a chair defined in map data; room is active. |
| Trigger | User presses the 'E' key. |
| Basic Flow | 1. Client detects proximity to a seat entity.<br>2. Client calculates target position and orientation (Up/Down/Left/Right) from map config.<br>3. Character "snaps" to the position and updates sprite frame.<br>4. State is synced via WebSocket `move` event with `isSitting: true` and `direction`. |
| Postconditions | User is seated in the correct direction; others see the seated animation. |

### UC-22 - Web Audio Spatial Engine

| Field | Description |
|---|---|
| Use Case ID | UC-22 |
| Use Case Name | Web Audio Spatial Engine |
| Primary Actor | Authenticated User |
| Preconditions | User is in a room with other participants or audio sources. |
| Basic Flow | 1. Client initializes Web Audio Context.<br>2. Client calculates distance and X-offset to target players.<br>3. PannerNode adjusts stereo balance.<br>4. GainNode applies exponential volume decay based on distance.<br>5. Audio is rendered in real-time as users move. |
| Postconditions | Immersive 2D spatial audio experience. |

### UC-23 - Spatial Video Overlay

| Field | Description |
|---|---|
| Use Case ID | UC-23 |
| Use Case Name | Spatial Video Overlay |
| Primary Actor | Authenticated User |
| Preconditions | Proximity video call is active. |
| Basic Flow | 1. Client receives video track from LiveKit.<br>2. Client converts world coordinates of the remote player to screen pixels.<br>3. Video track is rendered in a floating circle above the avatar.<br>4. Position updates every frame during movement. |
| Postconditions | Video follows the avatar on the game canvas. |
| **_Alternative Flows:_** | A1. User minimizes the video overlay -> overlay hidden but call remains active. |

### UC-24 - Glassmorphic UI Interaction

| Field | Description |
|---|---|
| Use Case ID | UC-24 |
| Use Case Name | Glassmorphic UI Interaction |
| Primary Actor | Authenticated User |
| Preconditions | User is logged in and interacting with the dashboard or game room. |
| Trigger | User opens a modal, sidebar, or bottom control bar. |
| Basic Flow | 1. User clicks on a UI trigger.<br>2. System renders the target component with `backdrop-filter: blur()`.<br>3. User interacts with buttons/fields inside the glassmorphic container.<br>4. System applies hover/active transitions to maintain premium aesthetic. |
| Postconditions | Consistent, high-end visual experience across all system interfaces. |

### UC-25 - Periodic State Snapshots

| Field | Description |
|---|---|
| Use Case ID | UC-25 |
| Use Case Name | Periodic State Snapshots |
| Primary Actor | System |
| Preconditions | System is running; active rooms or player sessions exist. |
| Trigger | 30-second interval timer (snapshot loop). |
| Basic Flow | 1. System background task triggers every 30 seconds.<br>2. System iterates through `activePlayers` and `whiteboardStates` in memory.<br>3. System writes serialized state data to MongoDB collections.<br>4. System logs success/failure of the snapshot. |
| Exception Flow | E1. Database timeout -> system skips current snapshot and retries in the next interval. |
| Postconditions | Volatile in-memory state is persisted, allowing recovery after server restarts. |

### UC-26 - API Rate Limiting

| Field | Description |
|---|---|
| Use Case ID | UC-26 |
| Use Case Name | API Rate Limiting |
| Primary Actor | System |
| Preconditions | System is exposed to public network traffic. |
| Trigger | Incoming HTTP/WebSocket request. |
| Basic Flow | 1. Client sends request to the server.<br>2. Rate-limit middleware checks client IP against current request count.<br>3. If below threshold, request proceeds to controller.<br>4. If threshold exceeded, server returns `429 Too Many Requests`. |
| Postconditions | Server protected against brute-force attacks and resource exhaustion. |


## 6. Traceability

- Functional requirements mapping: `docs/FunctionalRequirement.md`.
- Architecture and interfaces: `docs/SRS_2.md`, `docs/diagram.md`, `docs/api_schema_2026.md`.
