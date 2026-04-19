# API & WebSocket Documentation

The Gathering uses a hybrid HTTP/WebSocket architecture for social interactions and real-time syncing.

## 📡 WebSocket Protocol (`/ws`)

The server manages real-time positions within isolated rooms. 

### 1. Client Events (Send)
| Event | Payload | Description |
| :--- | :--- | :--- |
| `move` | `{ x, y, isSitting, displayName, avatarUrl }` | Broadcasts current position. Throttled at 50ms. |

### 2. Server Events (Receive)
| Event | Payload | Description |
| :--- | :--- | :--- |
| `initial_state` | `{ players: Record<string, Player> }` | Sent on joining. Contains all active players in the room. |
| `player_moved` | `{ id, x, y, isSitting, displayName }` | Broadcasted when any player moves or sits. |
| `player_left` | `{ id }` | Broadcasted when a player disconnects. |

## 🌐 HTTP Endpoints

### Authentication
- `POST /api/auth/google`: Verifies Google One Tap JWT and upserts the user in MongoDB.

### Resources (Library)
- `GET /api/resources`: Fetches a list of documents/resources available in the library zone.
- `POST /api/resources`: Uploads a new resource (Admin only).

### Multi-room (Rooms)
- `GET /api/rooms`: Lists rooms current user belongs to.
- `POST /api/rooms/join`: Joins a room via invite code.

### LiveKit
- `GET /api/livekit/token?room=...&username=...`: Generates an access token for positional audio/video sessions.

## 🗄 Database (MongoDB)
- **Users**: Identity and Profile (`displayName`, `avatarUrl`).
- **Rooms**: Persistent metadata about workspace rooms and membership.
- **Resources**: Library files and metadata.
