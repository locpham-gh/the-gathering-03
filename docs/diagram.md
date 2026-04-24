# System Diagrams - The Gathering

Last updated: 2026-04-23

## 1. System Context

```mermaid
flowchart LR
		U[User] -->|Browser| C[Client App\nReact + Vite + Pixi]
		C -->|REST| S[Server App\nBun + Elysia]
		C -->|WebSocket| S
		S --> DB[(MongoDB)]
		S --> GI[Google Identity]
		S --> SMTP[SMTP Provider]
		S --> LKS[LiveKit Server]
		C --> LKR[LiveKit Room]
		LKS --> LKR
```

## 2. Container Diagram

```mermaid
flowchart TB
		subgraph Client[apps/client]
			P1[Pages\nindex/home/game]
			P2[AuthContext]
			P3[Dashboard Components]
			P4[Game Canvas + Entities]
			P5[API Layer\nlib/api.ts]
			P6[WS Hook\nuseMultiplayer.ts]
		end

		subgraph Server[apps/server]
			Q1[index.ts]
			Q2[Routes\nauth room event forum resource]
			Q3[Controllers]
			Q4[Models\nUser Room Event ForumTopic Resource Service]
			Q5[Email Service]
			Q6[WS Engine\nactivePlayers Map]
		end

		P1 --> P2
		P1 --> P3
		P1 --> P4
		P3 --> P5
		P4 --> P6
		P5 --> Q2
		P6 --> Q6
		Q2 --> Q3
		Q3 --> Q4
		Q2 --> Q5
```

## 3. Auth Flow (Google + OTP)

```mermaid
flowchart TD
		A[Landing] --> B{Login method}
		B -->|Google| C[Receive Google credential]
		C --> D[POST /api/auth/google]
		D --> E[Verify token with Google]
		E --> F[Upsert user + issue JWT]
		F --> G[Save token/user in localStorage]
		G --> H[Go to /home]

		B -->|Email OTP| I[POST /api/auth/otp/request]
		I --> J[Generate OTP + store expiry]
		J --> K[Send OTP email]
		K --> L[POST /api/auth/otp/verify]
		L --> F
```

## 4. Room Lifecycle

```mermaid
stateDiagram-v2
		[*] --> Created: POST /api/rooms
		Created --> Joined: POST /api/rooms/join/:code
		Joined --> Active: Enter /room/:roomCode
		Active --> Updated: PATCH /api/rooms/:id
		Active --> MemberRemoved: POST /api/rooms/:id/kick
		MemberRemoved --> Active
		Updated --> Active
		Active --> Deleted: DELETE /api/rooms/:id
		Deleted --> [*]
```

## 5. Multiplayer WebSocket Sequence

```mermaid
sequenceDiagram
		participant U1 as User A Client
		participant WS as Elysia WS Server
		participant U2 as User B Client

		U1->>WS: connect /ws?room=abc
		WS-->>U1: initial_state
		U2->>WS: connect /ws?room=abc
		WS-->>U2: initial_state

		U1->>WS: message type=move payload{x,y,...}
		WS-->>U1: player_moved (broadcast)
		WS-->>U2: player_moved (broadcast)

		U2->>WS: disconnect
		WS-->>U1: player_left
```

## 6. Event Scheduling Sequence

```mermaid
sequenceDiagram
		participant C as Client
		participant API as Server /api/events
		participant DB as MongoDB
		participant M as SMTP

		C->>API: POST /api/events (title, time, roomId, guests)
		API->>DB: Create Event (and create Room if roomId=new)
		DB-->>API: Event saved
		API->>M: Send invitation emails
		M-->>API: Send result
		API-->>C: success / error
```

## 7. Forum Flow

```mermaid
flowchart LR
		A[User] --> B[GET /api/forum/topics]
		A --> C[POST /api/forum/topics]
		A --> D[POST /api/forum/topics/:id/replies]
		A --> E[DELETE /api/forum/topics/:id]
		E --> F{Author?}
		F -->|Yes| G[Delete success]
		F -->|No| H[Forbidden]
```

## 8. Digital Library Flow

```mermaid
flowchart TD
		A[Player in Game] --> B[Enter Library Zone]
		B --> C[Open Library Modal]
		C --> D[GET /api/resources?search&type&tag]
		D --> E[Render cards]
		E --> F[Open resource detail]
```

## 9. Data Model (Logical ERD)

```mermaid
erDiagram
		USERS ||--o{ ROOMS : owns
		USERS }o--o{ ROOMS : joins
		USERS ||--o{ EVENTS : hosts
		ROOMS ||--o{ EVENTS : has
		USERS ||--o{ FORUMTOPICS : writes
		FORUMTOPICS ||--o{ REPLIES : has
		USERS ||--o{ REPLIES : writes

		USERS {
			string email
			string displayName
			string avatarUrl
			string googleId
			string otpCode
			date otpExpiresAt
		}
		ROOMS {
			string name
			string code
			objectId ownerId
			objectId[] members
		}
		EVENTS {
			string title
			objectId roomId
			objectId hostId
			date startTime
			date endTime
			string[] guestEmails
		}
		FORUMTOPICS {
			string title
			objectId authorId
		}
		REPLIES {
			objectId authorId
			string content
			date createdAt
		}
		RESOURCES {
			string title
			string contentType
			string fileUrl
			string[] tags
		}
```
