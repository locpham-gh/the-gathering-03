PROJECT ARCHITECTURE & CONTEXT: "THE GATHERING"

Date: March 2026
Project Type: Virtual Co-Working Space (2D Metaverse + SaaS UI)
Target Audience: 30-50 Private Beta Users

1. SYSTEM OVERVIEW & TECH STACK

This is a modern Full-Stack web application combining a declarative 2D game engine with business SaaS features.

Frontend Layer:

Framework: Vite + React (latest) + TypeScript.

Styling: TailwindCSS + Shadcn UI (Glassmorphism design language).

2D Engine: pixi.js + @pixi/react (Declarative WebGL rendering).

Video/Audio RTC: LiveKit SDK (SFU Architecture for scaling up to 100 users).

Backend Layer (BEMN Stack):

Runtime: Bun + ElysiaJS.

Database: MongoDB + Mongoose (NoSQL, embedded documents).

Real-time: Bun native WebSockets (Low-latency player synchronization).

Authentication: Google One Tap (OAuth 2.0) -> Custom JWT Session.

Storage: Cloudinary / AWS S3 (for PDFs, Avatars).

2. DATABASE SCHEMA DESIGN (MONGODB)

We utilize NoSQL advantages by embedding related data to reduce read latency.

User: { \_id, email (unique), displayName, avatarUrl, googleId } (No password field needed due to OAuth).

Event: { \_id, title, date, livekitRoomId, attendees: [User._id] }

Resource (Library): { \_id, title, type (pdf/video), fileUrl, size }

Service (Directory): { \_id, name, provider, contactInfo }

ForumTopic: { \_id, title, authorId, replies: [{ authorId, content, createdAt }] } (Replies are embedded).

3. 2D METAVERSE CORE (PIXIJS ALGORITHMS)

A. Map Rendering (Tiled JSON Parsing):

Data: public/maps/office.json (1D array). Grid size: 32x32 pixels.

Tilesets: Uses Room_Builder_free_32x32.png (Floors/Walls) and Interiors_free_32x32.png (Furniture).

Algorithm: Parse the 1D array into 2D coordinates (x = index % width, y = floor(index / width)) and render via <Sprite /> components.

B. Player Sprite Configuration:

Asset: public/sprites/Adam_16x16.png.

Grid: 24 columns x 7 rows. Cell size: 16x16.

Scale: Player must be scaled by 2 (scale={2}) to match the 32x32 map grid.

Animations: Walking down is Row 2 (Frames 42-47). Rendered using <AnimatedSprite />.

C. Movement & Collision (AABB):

Implement smooth WASD movement via React State (useTick).

AABB Collision: Before applying the next (x, y), check against the bounding boxes of solid tiles (Layer 3 and Layer 4 of the JSON map). Prevent movement if intersecting.

Z-Index Sorting: Dynamically update the player's zIndex based on their y coordinate to ensure they render behind tall furniture when walking upwards.

D. Multiplayer Synchronization:

Network: Send player (x, y) delta to Socket.io at 15-20 ticks per second.

Client-Side Prediction: Use Linear Interpolation (Lerp) current = current + (target - current) \* 0.1 to smoothly animate other players' movements.

4. BUSINESS LOGIC & FEATURE INTEGRATION

1. Auth Flow (Google One Tap):

Frontend triggers Google One Tap UI. Gets Google credential.

Sends token to POST /api/auth/google.

Backend uses google-auth-library to verify. Upserts User in MongoDB.

Backend issues a Custom JWT. Frontend stores it and mounts <GameCanvas />.

2. Interactive Zones (Proximity Triggers):

Define AABB zones for Library, Forum, and Reception.

When player intersects a zone, prompt "Press E".

Pressing 'E' opens the respective React Glassmorphism Modal and pauses player movement.

3. Proximity Video Call (LiveKit):

Algorithm: Calculate Euclidean distance between local player and other players in the game loop.

Trigger: If distance < 100px, trigger React state to open a 1-on-1 LiveKit video modal.

Hysteresis: To prevent flickering, only close the call when distance > 120px.

4. Large Event Hosting:

When walking into the "Event Zone", auto-connect the user to a predefined LiveKit room ID fetched from the MongoDB Event document.

5. DEVELOPMENT PHASES (INSTRUCTIONS FOR AI)

When prompted to write code, strictly follow this modular approach:

Phase 1: Backend Bun/Elysia setup. Mongoose Schemas and Google Auth API.

Phase 2: Vite/React setup. Google One Tap UI and JWT management.

Phase 3: PixiJS Core. Parse Map, render Adam sprite, implement WASD + Collision.

Phase 4: React Modals (UI overlapping the Canvas) and MongoDB data fetching.

Phase 5: Socket.io & LiveKit integration for multiplayer and proximity calls.
