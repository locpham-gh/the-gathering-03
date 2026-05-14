# User Scenarios - The Gathering

This document defines specific user scenarios extracted from the Functional Requirements (FR). Each scenario follows the **BDD (Behavior-Driven Development)** structure: **GIVEN - WHEN - THEN** to ensure clarity for development and testing.

---

## 1. Join Virtual Space (FR-ROOM-02)

### Scenario 1: Happy Path — Successful Entry

- **GIVEN:** Phát has a valid invitation link or access code for the "Design Team" room.
- **WHEN:** Phát enters the code and clicks "Join Room."
- **THEN:** The system authenticates the code, loads the 2D map, and Phát's avatar appears at the spawn point.

### Scenario 2: Exception — Invalid Access Code

- **GIVEN:** Phát enters an expired or incorrect invitation code.
- **WHEN:** Phát clicks "Join Room."
- **THEN:** The system displays an error message: "Invalid Access Code" and prevents entry to the space.

### Scenario 3: Exception — Missing Permissions (Media Access)

- **GIVEN:** Phát joins a room but has disabled camera/microphone permissions in his browser.
- **WHEN:** Phát enters the proximity zone of another user.
- **THEN:** The system displays a warning notification: "Media access required for spatial communication," and his avatar shows a "muted" status icon.

---

## 2. Spatial Communication (FR-SPACE-02)

### Scenario 1: Proximity Video Linking

- **GIVEN:** Phát and Minh are in the same virtual office but far apart (no active connection).
- **WHEN:** Phát walks his avatar toward Minh until they are within the 3-tile interaction radius.
- **THEN:** The system automatically initializes a LiveKit session, and both users' webcams/microphones activate in a floating video tile.

### Scenario 2: Natural Disconnection

- **GIVEN:** Phát and Minh are currently in an active proximity video call.
- **WHEN:** Minh walks away from Phát, moving beyond the 5-tile disconnection threshold.
- **THEN:** The system terminates the WebRTC session and hides the video tiles, returning to silent 2D navigation.

---

## 3. Collaboration & Tools (FR-COL-02)

### Scenario 1: Opening the Shared Whiteboard

- **GIVEN:** A team is gathered in the "Brainstorming Zone" on the map.
- **WHEN:** One team member interacts with the virtual Whiteboard object.
- **THEN:** The Excalidraw interface opens for all users currently in that zone, synchronizing all strokes and shapes in real-time.

---

## 4. Admin Governance (FR-ADM-01)

### Scenario 1: Admin Dashboard Access (Alternate Path)

- **GIVEN:** Minh is logged in with an account that has the `admin` role.
- **WHEN:** Minh navigates to the dashboard or clicks the "Admin Panel" link in the sidebar.
- **THEN:** The system injects the Administrative Sidebar and allows Minh to view system throughput charts and moderate users.

### Scenario 2: Restricting Access (Exception Path)

- **GIVEN:** Phát is logged in with a standard `user` role.
- **WHEN:** Phát attempts to manually access the `/admin` URL route.
- **THEN:** The system detects the insufficient role and redirects Phát back to the `/home` dashboard with a "Permission Denied" notification.

---

## 5. Focus & Signaling (FR-SPACE-03)

### Scenario 1: Toggling "Busy" State

- **GIVEN:** Phát is in a proximity call with Minh but needs to focus on a private task.
- **WHEN:** Phát clicks the "Virtual Phone" icon on his interface.
- **THEN:** Phát's avatar performs a "talking on phone" animation, and his proximity audio is automatically lowered to signal he is occupied.
