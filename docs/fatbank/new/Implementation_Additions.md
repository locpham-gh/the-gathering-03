### Realm and Room Management Implementation
Manages the lifecycle, configuration, and access control of virtual workspaces.
- **Creation & Templates:** Users can instantiate new rooms based on predefined templates (e.g., Office, Home, Blank). The backend creates a new Room document in MongoDB, initializing the grid dimensions and default collision boundaries.
- **Access Control:** Each room generates a unique 6-character shareable code. The ElysiaJS backend validates this code and user membership before authorizing a WebSocket upgrade for that specific room session.
- **Lifecycle & Ownership:** Room owners possess elevated privileges, allowing them to update metadata, manage members, or trigger a safe deletion which cascades to remove all associated events and resources.

### Collaborative Whiteboard Implementation
Provides a real-time brainstorming surface synchronized across all active room members.
- **Excalidraw Integration:** The frontend embeds the `@excalidraw/excalidraw` React component within a fullscreen overlay, which is triggered when a user presses the interaction key ('E') near the whiteboard zone on the map.
- **Real-time Sync:** Drawing elements (strokes, text, shapes) are broadcasted instantly to other participants via a dedicated WebSocket event (`whiteboard_update`), ensuring a seamless and conflict-free collaborative experience.
- **State Persistence:** The entire whiteboard scene is serialized into a JSON object and managed by the backend's periodic persistence mechanism.

### System Stability and State Persistence (Snapshot Loop)
Ensures data reliability and optimizes server performance without requiring external in-memory stores like Redis.
- **30-Second Snapshot Loop:** Instead of executing a database write for every single avatar step or whiteboard stroke, the backend aggregates these highly frequent changes in memory.
- **Batch Processing:** A periodic background worker runs every 30 seconds to identify "dirty" room states. It executes bulk writes to MongoDB Atlas, persisting the latest coordinates of all players and the current whiteboard data.
- **Fault Tolerance:** If a client disconnects or the server restarts, users seamlessly spawn at their last known coordinates upon their next login.

### Admin Management Dashboard Implementation
Provides centralized platform oversight and governance capabilities.
- **Role-Based Access Control (RBAC):** Custom ElysiaJS middleware intercepts requests to `/api/admin/*`, verifying the `isAdmin` boolean flag within the user's decoded JWT payload before granting access.
- **Moderation Interface:** A dedicated React dashboard allows administrators to view high-level system metrics, update user roles, issue account bans, and forcefully remove inappropriate rooms or forum content to maintain a safe community environment.

---

### 4.10. Implementation Challenges and Resolutions

**Challenge 1: High-Frequency WebSocket Synchronization and Rendering Lag**
Broadcasting avatar coordinates at 20Hz for up to 20 concurrent users per room initially caused high CPU utilization on the server and choppy rendering on the client side.
* **Resolution:** We implemented client-side movement throttling and linear interpolation (Lerp) within PixiJS to mathematically smooth out avatar movements between network ticks. On the backend, implementing the in-memory 30-second snapshot loop drastically reduced database I/O bottlenecks.

**Challenge 2: Spatial Audio and Proximity Calculations**
Accurately replicating natural distance-based audio decay using incoming WebRTC audio streams proved mathematically complex.
* **Resolution:** We leveraged the native Web Audio API, tying the LiveKit incoming audio tracks to an exponential gain node (`ExponentialRampToValueAtTime`). The volume dynamically adjusts based on the Pythagorean distance calculated between avatar coordinates on the PixiJS canvas, filtering out chat entirely beyond the 250px radius.

**Challenge 3: Bridging React DOM and PixiJS WebGL States**
Sharing real-time state between the standard React UI (modals, chat) and the PixiJS game canvas often led to redundant and expensive DOM re-renders.
* **Resolution:** We strictly decoupled the logic. React Contexts (`AuthContext`, `MapContext`) were used for static/global states. For high-frequency game logic, we utilized `useRef` and direct event listeners (`CustomEvent`) to pass data from React down to the PixiJS application instance without triggering the React render cycle.
