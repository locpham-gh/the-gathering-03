# IV. IMPLEMENTATION

## 4.1. Introduction
This section details the technical implementation of "The Gathering," a virtual co-working and social platform. The system is built using a modern full-stack architecture with Bun as the runtime, ElysiaJS for the backend, and React with PixiJS for the immersive 2D frontend.

## 4.2. Project Setup and Configuration
The project is organized as a monorepo to ensure tight integration between the client and server.

- **Runtime**: Bun (chosen for performance and native TypeScript support).
- **Package Management**: Bun install.
- **Environment Configuration**:
  - `apps/server/.env`: Contains MongoDB URI, JWT Secret, Google Client ID, SMTP credentials, and LiveKit keys.
  - `apps/client/.env`: Contains API Base URL and Public API keys.
- **Scripts**:
  - `bun run dev`: Starts both backend and frontend concurrently from the root.

## 4.3. Authentication Implementation
The system implements a multi-modal authentication flow to ensure ease of access and security.

- **Google One Tap**: Integrated on the landing page to provide a zero-friction entry. The backend verifies the Google ID Token using `google-auth-library`.
- **Email OTP**: A fallback/alternative method using Nodemailer to send 6-digit codes.
- **JWT Issuance**: Upon successful verification, the server issues a JWT using the `@elysiajs/jwt` plugin.
- **Persistence**: Tokens are stored in the browser's `localStorage` and managed via a global `AuthContext` in React.

## 4.4. 2D Map Implementation
The core experience is built on a high-performance 2D engine.

- **Rendering Engine**: PixiJS with `@pixi/react` for declarative component management.
- **Map Loading**: Supports both Tiled JSON maps and high-quality image backgrounds for aesthetics.
- **Multiplayer Sync**: Positions are updated at 20Hz via WebSockets.
- **Advanced Interactions**:
  - **Directional Seat Snapping**: Uses map entity metadata to align player sprites automatically when sitting (E key).
  - **Spatial Chat**: Filters messages based on a 250px radius using Pythagoras' theorem on the client side.

## 4.5. LiveKit Integration
Real-time media is handled via the LiveKit SFU architecture.

- **SFU Model**: Ensures O(N) bandwidth scaling for multi-user calls.
- **Spatial Video Overlay**: A custom React component that maps remote participant coordinates from the game world to screen space, rendering video tracks as floating circles above avatars.
- **Spatial Audio**: Powered by the Web Audio API with exponential gain nodes to simulate distance-based volume decay.

## 4.6. Event Management Implementation
Allows users to schedule and coordinate collaborative sessions.

- **Logic**: Linked to specific Rooms via MongoDB ObjectIDs.
- **Notifications**: Automatic email invitations sent to a `guestEmails` array upon event creation.
- **Dashboard**: A unified view for managing both hosted and invited events.

## 4.7. Digital Library Implementation
A centralized repository for shared documents and links.

- **Zone Trigger**: Interaction is restricted to the `library` physics zone in the 2D map.
- **Search Engine**: Implements MongoDB text indexing on `title`, `tags`, and `description`.
- **UI**: A searchable grid interface optimized for quick resource discovery.

## 4.8. Community Forum Implementation
Asynchronous communication through threads and replies.

- **Hierarchy**: Topics contain an array of nested replies.
- **Moderation**: Authors can delete their own content; Admins have full control over all forum data.
- **Persistence**: Real-time refreshes after every post/reply action.

## 4.9. Frontend State Management
Ensures a smooth and reactive user experience.

- **AuthContext**: Manages user session and login/logout logic across the entire app.
- **useMultiplayer Hook**: Encapsulates all WebSocket logic, including position interpolation (Lerp), message de-duplication, and state cleanup.
- **Local State**: Used for UI-specific toggles (modals, tabs, theme switches).
- **Theme Persistence**: Dark/Light mode preference is saved to `localStorage` and applied via CSS variables.

## 4.10. Implementation Challenges and Resolutions

| Challenge | Resolution |
|-----------|------------|
| **Black Map Issue** | Resolved by setting `pointer-events: none` on full-screen LiveKit overlays and adjusting z-index layers to ensure the PixiJS canvas remains interactable. |
| **Video Lag in Proximity** | Implemented a coordinate-to-pixel conversion loop that updates the `SpatialVideoOverlay` position only when movement is detected, reducing DOM churn. |
| **State Loss on Restart** | Replaced the need for Redis with a lightweight "Periodic Snapshot" system that saves all active player coordinates to MongoDB every 30 seconds. |
| **Duplicate Chat Messages** | Implemented client-side `msgId` generation and a de-duplication filter in the `useMultiplayer` hook to handle broadcased loops. |
| **Directional Snapping Logic** | Created a orientation map in the map configuration file that maps chair IDs to sprite frames (Up/Down/Left/Right). |
