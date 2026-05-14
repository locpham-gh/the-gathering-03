# Functional and Non-Functional Requirements (FR & NFR)

This document outlines the core functional and non-functional requirements for **The Gathering** project, extracted and aligned exactly with the Final SRS.

## 1. Functional Requirements (FR)

Functional requirements define the specific behaviors, capabilities, and functions that the system must perform to satisfy the users' needs. They are organized by feature module.

| Requirement ID | Module | Description | Priority |
|---|---|---|---|
| **FR-AUTH-01** | Authentication | **Register Account:** The system shall allow new users to create memberships via Google or Email verification. | 1 |
| **FR-AUTH-02** | Authentication | **Login Account:** The system shall allow existing members to verify identity via JWT and access the dashboard. | 1 |
| **FR-AUTH-03** | Authentication & Profile | **Update Profile:** The system shall allow members to personalize their display name and visual avatar representation. | 2 |
| **FR-ROOM-01** | Room & Membership | **Create Room:** The system shall allow users to establish a new virtual workspace with a unique shareable access code. | 1 |
| **FR-ROOM-02** | Room & Membership | **Join Room:** The system shall allow users to enter an existing workspace by providing a valid invitation code. | 1 |
| **FR-ROOM-03** | Room & Membership | **Manage Room Members:** The system shall allow Room Owners to moderate occupancy (e.g., kicking users) and update configurations. | 1 |
| **FR-SPACE-01** | Real-time Interaction | **Real-time Movement:** The system shall allow users to navigate their character in the 2D map, including interactions like sitting on furniture. | 1 |
| **FR-SPACE-02** | Real-time Interaction | **Proximity Audio/Video:** The system shall trigger WebRTC LiveKit media connections automatically based on character proximity. | 1 |
| **FR-SPACE-03** | Real-time Interaction | **Phone Interaction:** The system shall display a visual animation when a user interacts with their virtual phone to signal focus. | 1 |
| **FR-SPACE-04** | Real-time Interaction | **Mini-map & Environment:** The system shall provide a spatial overview of the office layout and team distribution. | 2 |
| **FR-SPACE-05** | Real-time Interaction | **Spatial Chat Filtering:** The system shall ensure local chat messages are visible only to nearby participants. | 1 |
| **FR-COL-01** | Collaboration | **Schedule Event:** The system shall allow Event Hosts to organize meetings and automatically send email invitations via Nodemailer. | 2 |
| **FR-COL-02** | Collaboration | **Collaborative Whiteboard:** The system shall synchronize Excalidraw whiteboard elements across all users in a room in real-time. | 1 |
| **FR-COL-03** | Collaboration | **Create Forum Topic:** The system shall allow users to initiate new knowledge-sharing discussions. | 2 |
| **FR-COL-04** | Collaboration | **Reply to Topic:** The system shall allow users to contribute to existing community discussions. | 2 |
| **FR-COL-05** | Collaboration | **Search Digital Library:** The system shall allow users to locate shared team resources by title or tags. | 2 |
| **FR-ADM-01** | Administration | **Admin Management Dashboard:** The system shall provide an interface for Admins to oversee the platform, moderate users, and manage rooms. | 1 |

## 2. Non-Functional Requirements (NFR)

Non-functional requirements specify the quality attributes, performance goals, security measures, and constraints of the system.

### Performance
| Requirement ID | Description |
|---|---|
| **NFR-PERF-01** | The game canvas shall maintain a frame rate of 60 FPS on standard hardware. |
| **NFR-PERF-02** | Avatar position updates shall broadcast to all users in a room with a delay of less than 100ms. |
| **NFR-PERF-03** | REST API endpoints shall respond within 500ms at the 95th percentile under normal conditions. |
| **NFR-PERF-04** | The backend server must start up in less than 2 seconds, including database connection. |

### Security
| Requirement ID | Description |
|---|---|
| **NFR-SEC-01** | All private API endpoints shall require a valid JWT Bearer Token in the Authorization header. |
| **NFR-SEC-02** | The LiveKit API key and secret shall be stored exclusively as server-side environment variables. |
| **NFR-SEC-03** | The server shall implement a CORS policy allowing requests only from the configured frontend URL. |
| **NFR-SEC-04** | The system shall enforce rate-limiting on all public API endpoints to prevent abuse. |

### Availability and Scalability
| Requirement ID | Description |
|---|---|
| **NFR-AVL-01** | The system shall support at least 20 concurrent users per virtual room without significant movement jitter. |
| **NFR-AVL-02** | The WebSocket client shall handle automatic reconnection with exponential backoff if the connection is lost. |
| **NFR-AVL-03** | The frontend shall provide visual feedback during WebSocket reconnection attempts (e.g., blurring avatar). |

### Usability
| Requirement ID | Description |
|---|---|
| **NFR-USA-01** | The UI shall employ a modern "Glassmorphism" aesthetic with semi-transparent backgrounds and background blur. |
| **NFR-USA-02** | The UI shall be responsive, adjusting the dashboard layout for different screen sizes (desktop/tablet). |
| **NFR-USA-03** | The frontend shall display a sidebar in the game view for quick access to forum, participants, and events. |
