
# **I. INTRODUCTION**

## **1\. Purpose**

The purpose of this project is to provide a virtual co-working platform named **The Gathering** that combines a SaaS-style productivity dashboard with an immersive 2D multiplayer environment. Responding to the needs of remote workers and students, users can collaborate in real-time within a shared digital space. Allowing users to manage virtual offices, schedule events, participate in community forums, and communicate via proximity-based video calls.

This document is used as a commitment between the development team and stakeholders about the output product and the rules of the development process.  
The expected audiences of this document are:
- Mentors and Evaluators of the K26 cohort.
- The Development Team (Group 3).

## **2\. Scope**

This project aims to bridge the gap between static management tools and immersive communication. It provides user authentication via Google and OTP, virtual room management, event scheduling with email notifications, a community forum, and a digital library for resource sharing. In addition, it features a multiplayer 2D office space using PixiJS where users can move, interact with specific zones, and engage in proximity-controlled video conferencing via LiveKit.

## **3\. Definition**

The Gathering system serves three main groups of users: Authenticated Users, Room Owners, and Event Hosts.
- **Authenticated Users**: Can join rooms via codes, participate in the 2D workspace, post in forums, and view resources.
- **Room Owners**: Can manage room settings, including renaming or deleting rooms and managing membership (kicking users).
- **Event Hosts**: Can create and manage scheduled meetings, sending automated invitations to guest emails.

\- **Customer (Authenticated User)**:
• Users can create accounts via Google or Email OTP to log in.
• They can view dashboard information, join rooms, and interact with the forum and library.
• Participate in real-time 2D movement and proximity video calls.

\- **Room Owner**:
- Manage room configurations and access.
- Moderate room members.

\- **Event Host**:
- Schedule and manage events.
- Send invitation emails to participants.

# **II. SYSTEM CONTEXT DIAGRAM**

## **1\. Overview**
The System Context Diagram for **The Gathering** project provides a high-level, visual representation of the platform and its interactions with external entities. Designed as a web-based collaborative environment, The Gathering aims to optimize remote teamwork by integrating a React-based frontend with a high-performance Bun/Elysia backend and third-party communication services.

## **2\. System Boundary**

The Gathering System encompasses all components developed and controlled by the project team:

- **Frontend (apps/client)**: A React-based single-page application (SPA) built with Vite, utilizing PixiJS for 2D rendering and Tailwind CSS for the UI. It handles user interactions, game canvas logic, and real-time state visualization.
- **Backend (apps/server)**: A Bun-based server using the ElysiaJS framework. it manages RESTful APIs for business logic, WebSocket connections for multiplayer sync, and database integration via Mongoose.
- **Database**: A MongoDB instance (hosted on MongoDB Atlas) that stores user profiles, room data, event schedules, forum posts, and resource metadata.

## **3\. External Entities**

The diagram identifies four external entities that interact with The Gathering System:

- **User**: remote workers or students who interact with the dashboard and 2D space to collaborate.
- **Google Identity Service**: A third-party OAuth 2.0 provider used for secure "One Tap" authentication.
- **SMTP Service (Gmail)**: Used for sending OTP codes and event invitations.
- **LiveKit Server**: An external real-time communication platform used to facilitate proximity-based audio/video calls.

## **4\. Interactions**

Each external entity interacts with The Gathering System through bidirectional flows:

- **User**:
  - **Interaction & Control**: Commands sent from User to the system, such as room creation, movement in 2D space, or forum posting.
  - **Real-time Feedback**: Data received by User, including positions of other players, event notifications, and chat messages.
- **Google Identity**:
  - **Auth Request**: The system sends identity tokens to Google for verification.
  - **Profile Data**: Google returns verified user information (email, name, avatar).
- **SMTP Provider**:
  - **Mail Delivery**: The system sends mail payloads (OTP/Invitations) to the provider.
  - **Status**: Confirmation of email transmission.
- **LiveKit**:
  - **Token Request**: The system requests access tokens for specific video rooms.
  - **Media Stream**: The client establishes a direct WebRTC connection for video/audio.

# **III. BUSINESS REQUIREMENT**

## **1\. Business goals**

Business goals articulate the high-level objectives that The Gathering aims to achieve, reflecting its purpose of transforming remote collaboration into a more human-centric experience.

### _1.1 Enhance Remote Presence_

- **Objective**: Provide a sense of "co-presence" by allowing users to see each other's avatars in a shared 2D space.
- **Rationale**: Static tools like Slack or Trello lack the visual feeling of being "in the office." The Gathering addresses this by using PixiJS and WebSockets to sync movements.
- **Detail**: Success is measured by the ability of the system to sync up to 20 users per room with a latency of less than 200ms.

### _1.2 Deliver an Integrated Workflow_

- **Objective**: Combine management tools (Events, Forum, Library) with communication tools (Video Calls) in a single platform.
- **Rationale**: Reducing context switching between different apps improves productivity.
- **Detail**: The MVP will feature at least 4 integrated modules (Rooms, Events, Forum, Library) accessible from a unified dashboard.

### _1.3 Ensure Accessibility and Low Cost_

- **Objective**: Build the system using high-performance but cost-effective tools (Bun, Elysia, MongoDB Atlas free tier).
- **Rationale**: As a student project for K26, the system must be deployable with minimal infrastructure costs.
- **Detail**: Use Bun's native speed to reduce server resource requirements, fitting within free-tier cloud constraints.

### _1.4 Establish Scalability for Virtual Communities_

- **Objective**: Design a modular architecture that can support multiple rooms and hundreds of concurrent users.
- **Rationale**: The platform should be able to scale from a single team to an entire organization or classroom.
- **Detail**: The backend architecture uses domain-driven routing to ensure that adding new features (like a Marketplace or Whiteboard) does not disrupt existing ones.

## **2\. Business constraints**

Business constraints define the limitations that shape The Gathering's development, ensuring goals are achievable within the team's resources and timeline.

### _2.1 Infrastructure Budget_

**Constraint**: Development and initial hosting must rely on free-tier services (e.g., MongoDB Atlas, LiveKit Cloud free tier).

**Impact**: Limits the number of concurrent video participants and total database storage (~512MB), requiring efficient data management.

**Detail**: The team will use open-source alternatives and free tiers of SaaS providers to stay within a $0 budget.

### _2.2 Tight Academic Timeline_

- **Constraint**: The final prototype must be delivered by the end of the K26 semester (May 2025).
- **Impact**: Prioritizes core multiplayer and SaaS features over advanced game mechanics or complex analytics.
- **Detail**: Development is structured into 4-week phases, focusing first on the engine, then on features, and finally on polish.

### _2.3 Team Composition (Group 3)_

- **Constraint**: Four members with defined roles in a monorepo environment.
- **Impact**: Requires a strict Git workflow and monorepo structure to avoid merge conflicts and ensure code quality.
- **Detail**: 
  - **Pham Nguyen Thien Loc**: Project Manager / Coordinator.
  - **Banh Van Tran Phat**: Lead Developer / Backend.
  - **Le Tan Dat**: Developer / Frontend.
  - **Le Thoi Duy**: Developer / Game Engine.

### _2.4 Technology Stack Dependency_

- **Constraint**: The system is built using the Bun runtime and ElysiaJS, which are cutting-edge but have smaller communities compared to Node.js/Express.
- **Impact**: Requires the team to be self-reliant in debugging framework-specific issues.
- **Detail**: The choice of Bun/Elysia ensures superior performance and a modern developer experience, aligning with the "BEMN" (Bun, Elysia, MongoDB, Next/React) stack.

## **3\. Business criteria**

Success criteria provide measurable outcomes to evaluate whether The Gathering meets its business objectives.

### _3.1 Functional Platform Delivery_

- **Criterion**: Deploy a fully functional web application supporting multiplayer interaction and dashboard management.
- **Measure**: Users can log in, create a room, move their avatar, and see others moving in real-time.
- **Detail**: Validation involves a live demo where at least 4 team members interact in the same virtual room simultaneously.

### _3.2 Performance and Latency_

- **Criterion**: Achieve smooth character movement and fast API responses.
- **Measure**: Average API response time < 500ms and WebSocket broadcast latency < 100ms.
- **Detail**: Tested using browser dev tools and server-side logging during peak simulated usage.

### _3.3 User Acceptance_

- **Criterion**: Positive feedback from testers regarding the "fun" and "utility" of the 2D space.
- **Measure**: A survey of fellow K26 students with at least 75% positive rating on usability.
- **Detail**: Conducted post-demo through a feedback form.

# **IV. USER REQUIREMENT**

## **1\. Functional Requirements list**

| **ID** | **Name**                   | **Description**                                                                                        | **Priority** | **Levels of complexity** |
| ------ | -------------------------- | ------------------------------------------------------------------------------------------------------ | ------------ | ------------------------ |
| UC_01  | Register/Login (Google)    | The system allows users to sign up or log in using their Google account (One Tap).                     | 1            | 3                        |
| UC_02  | Register/Login (OTP)       | The system allows users to log in via a one-time password sent to their email.                         | 1            | 4                        |
| UC_03  | Update User Profile        | The system allows users to change their display name and avatar.                                       | 2            | 3                        |
| UC_04  | Create Room                | The system allows users to create a new virtual workspace with a unique code.                          | 1            | 3                        |
| UC_05  | Join Room                  | The system allows users to enter a room by providing a room code.                                      | 1            | 3                        |
| UC_06  | Manage Room (Owner)        | Owners can rename rooms, delete rooms, or kick members.                                                | 2            | 4                        |
| UC_07  | Real-time Movement         | Users can move their character in a 2D map using WASD/Arrow keys.                                      | 1            | 2                        |
| UC_08  | Sync Positions             | The system synchronizes the positions of all users in a room via WebSockets.                           | 1            | 1                        |
| UC_09  | Proximity Video Call       | The system automatically initiates a video call when two users are close to each other.                | 1            | 1                        |
| UC_10  | Schedule Event             | The system allows users to create events with start/end times linked to a room.                        | 2            | 3                        |
| UC_11  | Send Event Invitations     | The system sends invitation emails to a list of guests when an event is created.                       | 2            | 3                        |
| UC_12  | Create Forum Topic         | Users can post new topics in the community forum.                                                      | 2            | 3                        |
| UC_13  | Reply to Topic             | Users can comment on existing forum topics.                                                            | 2            | 3                        |
| UC_14  | Search Digital Library     | Users can search for resources (documents/links) by title, type, or tags.                              | 2            | 3                        |
| UC_15  | Zone Interaction           | Interaction with specific map areas (e.g., Library Zone) triggers UI modals.                           | 2            | 3                        |
| UC_16  | Toggle Theme (Persistence) | Users can switch between Light and Dark mode with choice saved to local storage.                       | 1            | 4                        |
| UC_17  | Fullscreen Overlays        | Immersive fullscreen views for Chat and Calendar modules.                                              | 2            | 3                        |

Table 2: Functional Requirement List

| **Level** | **Description** |
| --------- | --------------- |
| 1         | Must do         |
| 2         | Should do       |
| 3         | Nice to have    |
| 4         | Future release  |

Table 3: Priority Table

| **Level** | **Description**   |
| --------- | ----------------- |
| 1         | Extremely complex |
| 2         | Very complex      |
| 3         | Normal            |
| 4         | Easy              |
| 5         | Extremely easy    |

Table 4: Complexity table

## **2\. Use Cases Diagram**

### **_2.1. Notations_**
(Standard UML notation for Actors, Use Cases, and Boundaries)

### **_2.2. System Overview_**
The system is divided into two main domains: the Dashboard (CRUD operations) and the Game Space (Real-time operations).

### **_2.3 Use case Authentication_**

#### 2.3.1. Use Case Detail
Authentication is the entry point for all system features.

#### 2.3.2. Use Case Description

##### _a) Use case Register/Login via Google_

| **_Use Case ID:_**       | **UC_01**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **_Use Case Name:_**     | Register/Login via Google                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **_Brief Description:_** | The user uses Google One Tap to quickly authenticate and access the system.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **_Actor:_**             | Guest / User                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **_Pre-conditions:_**    | The user has a valid Google account and is on the landing page.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **_Post-conditions:_**   | The user is authenticated, a JWT is issued, and the user is redirected to the dashboard.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **_Main Success Flow:_** | 1\. The user navigates to the landing page.<br><br>2\. The system displays the Google One Tap prompt.<br><br>3\. The user selects their Google account.<br><br>4\. The frontend sends the credential (ID Token) to the backend `/api/auth/google`.<br><br>5\. The backend verifies the token with Google API.<br><br>6\. The backend checks if the user exists; if not, it creates a new user profile.<br><br>7\. The backend generates a JWT and returns it with user data.<br><br>8\. The frontend stores the JWT and redirects to `/home`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **_Alternative Flows:_** | **A1: Manual Login**<br><br>In step 3, if the user ignores the prompt, they can click the "Login with Google" button manually.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **_Exception Flows:_**   | **E1: Invalid Token**<br><br>In step 5, if the token is forged or expired, the backend returns an error, and the system prompts the user to try again.<br><br>**E2: Network Error**<br><br>If the system cannot reach Google's servers, it displays a "Connection Error" message.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

Table 5: Use case Description - Google Login

##### _b) Use case Join Room_

<div class="joplin-table-wrapper"><table><tbody><tr><th><p><strong><em>Use Case ID:</em></strong></p></th><th><p><strong>UC_05</strong></p></th></tr><tr><td><p><strong><em>Use Case Name:</em></strong></p></td><td><p>Join Room</p></td></tr><tr><td><p><strong><em>Brief Description:</em></strong></p></td><td><p>The user enters a room code to access a specific 2D workspace.</p></td></tr><tr><td><p><strong><em>Actor:</em></strong></p></td><td><p>Authenticated User</p></td></tr><tr><td><p><strong><em>Pre-conditions:</em></strong></p></td><td><p>1. The user is logged in.</p><p>2. The user has a valid 6-character room code.</p></td></tr><tr><td><p><strong><em>Post-conditions:</em></strong></p></td><td><p>The user is added to the room membership and redirected to the game canvas.</p></td></tr><tr><td><p><strong><em>Main Success Flow:</em></strong></p></td><td><ol><li>The user enters the room code in the "Join Room" field.</li><li>The user clicks "Join".</li><li>The frontend calls <code>POST /api/rooms/join/:code</code>.</li><li>The backend validates the code and adds the user to the <code>members</code> list.</li><li>The backend returns success.</li><li>The frontend redirects the user to <code>/room/:roomCode</code>.</li></ol></td></tr><tr><td><p><strong><em>Alternative Flows:</em></strong></p></td><td><p>None</p></td></tr><tr><td><p><strong><em>Exception Flows:</em></strong></p></td><td><p><strong>E1: Invalid Code</strong></p><p>In step 4, if the code does not exist, the system displays "Room not found".</p><p><strong>E2: Already a Member</strong></p><p>If the user is already a member, the system simply redirects them without adding them again.</p></td></tr></tbody></table></div>

Table 6: Use case Description - Join Room

### **_2.4. Use case Multiplayer Interaction_**

#### 2.4.1. Use Case Detail
This covers movement and proximity logic.

##### _a) Real-time Position Sync_

| **_Use Case ID:_**       | **UC_08**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **_Use Case Name:_**     | Sync Positions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **_Brief Description:_** | The system broadcasts player positions to all participants in the same room.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **_Actor:_**             | Authenticated User                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **_Pre-conditions:_**    | 1\. The user is inside a room.<br><br>2\. WebSocket connection is established.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **_Post-conditions:_**   | All users see each other's avatars at the correct coordinates.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **_Main Success Flow:_** | 1\. The user moves their character using keys.<br><br>2\. The frontend emits a `move` event via WebSocket with `x, y` coordinates.<br><br>3\. The backend receives the message and updates the in-memory `activePlayers` map for that room.<br><br>4\. The backend broadcasts the `player_moved` event to all other clients in the same room.<br><br>5\. Other clients update the remote player entity on their PixiJS canvas.                                                                                                                                                             |
| **_Alternative Flows:_** | **A1: Sitting Mode**<br><br>In Step 1, if the user presses 'E' near a chair, the `isSitting` flag is sent, changing the avatar animation for everyone.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **_Exception Flows:_**   | **E1: Disconnection**<br><br>If the WebSocket closes, the backend detects the drop and broadcasts a `player_left` event to others.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

Table 7: Use case Description - Sync Positions

# **V. SYSTEM & SOFTWARE REQUIREMENT**

## **1\. Functional System Requirement**

Functional requirements specify the core capabilities of The Gathering, ensuring it meets collaboration and immersive needs.

| ID                        | Descriptions                                                                                                                                                                     | Rationale                                                                                       | Verifiability                                                                                                                                       | Detail                                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| SR-F1: Auth Verification  | The system must verify Google ID tokens on the backend before issuing a session JWT.                                                                                             | Ensures secure access and prevents unauthorized user creation.                                  | Test by sending an invalid token to the endpoint and verifying a 401 response.                                                                     | Uses `@elysiajs/jwt` and Google Auth Library.                                                                  |
| SR-F2: Room Persistence   | The system shall store room metadata and membership in MongoDB.                                                                                                                  | Enabling users to return to their workspaces later.                                             | Create a room, restart the server, and verify the room still exists in the list.                                                                    | Stores Name, Code, OwnerId, and Members array.                                                                 |
| SR-F3: WS Broadcast       | The system shall broadcast position updates to all users in a room with a delay of less than 100ms.                                                                              | Ensuring a smooth "game-like" experience.                                                       | Use `bun test` or manual timing to measure message round-trip time.                                                                                | Uses Elysia's native WebSocket support.                                                                        |
| SR-F4: Email Service      | The system shall send HTML-formatted invitation emails for scheduled events.                                                                                                     | notifying external participants about meetings.                                                 | Create an event with a test email and verify receipt of the invitation.                                                                             | Uses Nodemailer with Gmail SMTP.                                                                               |
| SR-F5: Proximity Logic    | The frontend shall calculate the distance between avatars and trigger a LiveKit token request when the distance < 100 units.                                                     | Enabling spontaneous video communication.                                                       | Move two characters together and verify the LiveKit interface appears.                                                                              | Distance calculation: `Math.sqrt(dx*dx + dy*dy)`.                                                              |

Table 26: Functional System Requirement

## **2\. Non-Functional System Requirements**

Non-functional requirements specify the quality attributes of The Gathering.

| ID                             | Descriptions                                                                                                                                              | Rationale                                                        | Verifiability                                                                               | Detail                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| SR-NF1: Responsiveness         | The system shall respond to REST API requests in under 500ms (p95) under normal conditions.                                                               | Ensures a snappy user experience in the dashboard.               | Measure response times using Chrome Network tab during testing.                             | Optimized by Bun's fast I/O.                                                 |
| SR-NF2: Real-time Concurrency | The system shall support at least 20 concurrent users per virtual room without significant movement jitter.                                               | Crucial for classroom or small team collaboration.               | Simulate 20 WS clients and observe broadcast frequency.                                     | WebSocket state is handled in-memory for speed.                              |
| SR-NF3: Security (Data)        | All private endpoints (Rooms, Profile, Events) must require a valid Bearer Token in the Authorization header.                                             | Protects user privacy and room security.                         | Attempt to access `/api/rooms` without a token and verify 401 error.                        | Verified via `isAuth` middleware.                                            |
| SR-NF4: Maintainability       | The codebase must follow a modular structure with separate controllers and routes for each domain.                                                        | Facilitates future expansion by the K26 team.                    | Review file structure: `controllers/`, `routes/`, `models/`.                                | Adheres to Domain-Driven Design principles.                                  |

Table 27: Non-Functional System Requirements

## **3\. System Constraints**

| ID                          | Descriptions                                                                                                                           | Rationale                                               | Impact                                                                         | Verifiability                                                             |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| SR-C1: Network dependency   | The system requires a stable internet connection for WebSocket and WebRTC (LiveKit).                                                   | Real-time features cannot function offline.             | Users with unstable Wi-Fi may experience avatar "teleporting".                 | Test by throttling network and observing behavior.                        |
| SR-C2: Browser Compatibility| The system is designed for modern evergreen browsers (Chrome, Edge, Firefox).                                                          | Relies on advanced WebGL (PixiJS) and WebRTC features.  | May not work on legacy browsers or some restricted corporate networks.          | Test on latest versions of target browsers.                               |
| SR-C3: Selective Persistence | Only critical real-time data (player positions) are persisted in MongoDB; other ephemeral states (emotes) reset on restart.        | Balances DB write load with user convenience.           | Users reappear at their last known coordinates upon reconnection.             | Restart server and observe player spawn position.                         |
| SR-C4: Storage Limits       | Document uploads in the library are restricted by the free-tier database limits (~512MB total).                                         | Cost-effectiveness constraint.                           | Limits the size and number of resources shared.                                | Monitor MongoDB Atlas storage dashboard.                                  |

Table 28: System Constraints

## **4\. Backend Software Requirements**

The backend, built with Bun and Elysia, handles logic, auth, and state.

| Requirement Types              | ID                                                                                                                                                                                                                     | Descriptions                                                                                                                                                                                                              | Rationale                                                                                     | Verifiability                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Functional<br><br>Requirements | **SWR1**                                                                                                                                                                                                               | The server shall handle WebSocket connections on `/ws`, managing a room-based pub/sub system for position updates.                                                                                                        | Core of the multiplayer experience.                                                           | Connect two clients to the same room and verify position sync.                     |
| **SWR2**                       | The server shall integrate with `LiveKit-server-sdk` to issue JWT access tokens for video sessions on demand.                                                                                                          | Facilitates secure video conferencing.                                                                                                                                                                                    | Verify token generation via the `/api/livekit/token` endpoint.                                |
| **SWR3**                       | The server shall use Mongoose to manage schemas for Users, Rooms, Events, ForumTopics, and Resources.                                                                                                                  | Ensures data consistency and easy querying.                                                                                                                                                                               | Review `models/` directory for schema definitions.                                            |
| Non-Functional Requirements    | **SWR4**                                                                                                                                                                                                               | The server must startup in less than 2 seconds, including database connection.                                                                                                                                            | Enables rapid deployment and scaling.                                                         | Measure time from `bun start` to "Listening on port...".                           |
| **SWR5**                       | The server shall implement a CORS policy allowing requests only from the configured `CLIENT_URL`.                                                                                                                      | Prevents Cross-Origin attacks.                                                                                                                                                                                            | Test API from an unauthorized domain and verify rejection.                                   |
| Interface Requirements         | **SWR6**                                                                                                                                                                                                               | The API shall use JSON for all data exchanges, following standard HTTP status codes (200, 201, 400, 401, 404, 500).                                                                                                       | Ensures compatibility with React frontend.                                                    | Review API responses in Postman or DevTools.                                      |

Table 29: Backend Software Requirements

## **5\. Frontend Software Requirements**

The frontend provides the user interface and the 2D game canvas.

| Requirement Types              | ID                                                                                                                                                                                       | Descriptions                                                                                                                                                                                     | Rationale                                                       | Verifiability                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Functional<br><br>Requirements | **SWR7**                                                                                                                                                                                 | The frontend shall render a 2D tilemap using PixiJS, handling sprite animations for player movement (walking, sitting).                                                                          | Visual core of the virtual space.                               | Observe avatar animations during movement and interaction.                         |
| **SWR8**                       | The frontend shall use `AuthContext` to manage global login state and persist the JWT in `localStorage`.                                                                                 | Maintains session across page refreshes.                                                                                                                                                         | Refresh the page and verify the user remains logged in.         |
| **SWR9**                       | The frontend shall display a sidebar in the game view for quick access to the room forum, participants list, and event schedule.                                                         | Improves usability by keeping tools accessible within the game.                                                                                                                                  | Open the sidebar tabs and verify content loading.                |
| Non-Functional Requirements    | **SWR10**                                                                                                                                                                                | The game canvas shall maintain a frame rate of 60 FPS on standard hardware.                                                                                                                      | Ensures a smooth visual experience without lag.                 | Use Chrome's FPS meter during gameplay.                                            |
| **SWR11**                      | The UI shall be responsive, adjusting the dashboard layout for different screen sizes (desktop/tablet).                                                                                  | Ensures accessibility on various devices.                                                                                                                                                         | Resize the browser window and observe layout changes.           |
| Interface Requirements         | **SWR12**                                                                                                                                                                                | The frontend shall communicate with the backend using a centralized `apiFetch` wrapper that automatically attaches the Authorization header.                                                 | Simplifies API interaction and ensures secure requests.         | Review `lib/api.ts` code.                                                         |

Table 30: Frontend Software Requirements

## **6\. Real-time Communication Requirements**

| Requirement Types              | ID                                                                                                                                                                                       | Descriptions                                                                                                                                                                                     | Rationale                                                       | Verifiability                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Functional<br><br>Requirements | **SWR13**                                                                                                                                                                                | The client shall connect to the LiveKit cloud when the proximity threshold is met, subscribing to the neighbor's video/audio track.                                                              | Enables proximity calling.                                      | Verify "Joining Video Room" notification when approaching another player.          |
| **SWR14**                      | The WebSocket hook shall handle automatic reconnection with exponential backoff if the connection is lost.                                                                               | Ensures stability in unstable network conditions.                                                                                                                                                | Manually disconnect Wi-Fi and observe reconnection attempts.    |
| Non-Functional Requirements    | **SWR15**                                                                                                                                                                                | The proximity call system shall use AEC (Acoustic Echo Cancellation) and noise suppression provided by the LiveKit SDK.                                                                          | Ensures high audio quality for professional meetings.           | Subjective test of audio clarity in a noisy environment.                           |

Table 31: Real-time Communication Software Requirements