# User Scenarios - The Gathering

This document outlines the core user journeys of **The Gathering** platform, structured as a feature demonstration (Slides).

---

## Scenario 1: Call (Spatial Communication)
*The primary experience of finding and talking to people in a 2D environment.*

### 1.1: Call Finding Flow
**Persona:** Phát — A new user looking for his team.
- **Context:** Just registered and logged into The Gathering. Looking for a suitable colleague to talk with.
- **The Flow:**
    1. **Login**: Authenticates via Google or OTP.
    2. **View Dashboard**: Browse active workspaces and personal rooms.
    3. **Locate Team**: Enters a specific room and uses the map to find colleague avatars.
    4. **Engagement**: Approaches an avatar to initiate the connection.

### 1.2: Call Features Flow
**Persona:** Phát & Minh — Collaborating in real-time.
- **The Flow:**
    1. **Matching (Proximity)**: Avatars move into the communication radius (Spatial Matching).
    2. **View Profile**: Hover over avatar to see status and role.
    3. **Collaborative Action**: Enter a "Meeting Zone" to trigger shared tools (Whiteboard/Screen Share).
    4. **End Call**: Walk away from the proximity zone to naturally disconnect.
    5. **History & Rating**: View the conversation summary or leave an emoji reaction.

---

## Scenario 2: Profile Setup
*The first step for every new user to establish their identity.*

**Persona:** An — A new user setting up her professional brand.
- **The Flow:**
    1. **Authentication**: Success login for the first time.
    2. **Identity Creation**: System prompts for "Display Name" and "Organization".
    3. **Avatar Customization**: Choosing a sprite from the library (Adam, Ash, Lucy, etc.).
    4. **Status Sync**: Setting an "Active" or "Focus" status to show on the map.

---

## Scenario 3: Workspace Management (Account Setup)
*Managing the rooms and environments where work happens.*

**Persona:** Phát — A Team Lead organizing his digital office.
- **The Flow:**
    1. **Room Creation**: Selects a layout (Office, Cafe, Classroom).
    2. **Event Scheduling**: Sets a time for the weekly standup.
    3. **Access Control**: Adds team emails to the whitelist for private access.
    4. **Knowledge Base**: Adds shared resources to the "Resource Vault" (Library).

---

## Scenario 4: Admin Features (Mainframe Governance)
*Overseeing the platform health and community safety.*

**Persona:** System Operator — Managing the global instance.
- **Features:**
    - **View Statistics Data**: Monitor user density and platform growth charts.
    - **Manage Accounts**: Resetting roles, banning bad actors, or auditing signups.
    - **Manage Profile**: Overriding system-wide settings.
    - **Content Moderation**: Deleting inappropriate forum topics or archive clusters.
