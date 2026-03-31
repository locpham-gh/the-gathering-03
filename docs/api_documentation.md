# API Documentation - The Gathering

This document lists all available API endpoints for The Gathering backend.  
**Base URL:** `http://localhost:3000`

---

## 🔐 Authentication

### **Verify Google Token**

Authenticates the user using Google One Tap credential and returns a custom JWT session.

- **URL:** `/api/auth/google`
- **Method:** `POST`
- **Body:**

  ```json
  {
    "credential": "GOOGLE_ID_TOKEN_HERE"
  }
  ```

- **Response:**

  ```json
  {
    "success": true,
    "user": { "id": "...", "email": "...", "displayName": "...", "avatarUrl": "..." },
    "token": "JWT_TOKEN_HERE"
  }
  ```

---

## 📚 Library (Resources)

### **Get All Resources**

Fetches the list of library items (PDFs, Videos).

- **URL:** `/api/resources`
- **Method:** `GET`
- **Response:**

  ```json
  {
    "success": true,
    "resources": [
      { "_id": "...", "title": "...", "type": "pdf|video", "fileUrl": "...", "size": 123 }
    ]
  }
  ```

---

## 💬 Forum (Discussions)

### **Get All Topics**

Lists all discussion topics with their authors and replies.

- **URL:** `/api/forum/topics`
- **Method:** `GET`

### **Create New Topic**

Creates a new discussion thread.

- **URL:** `/api/forum/topics`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Body:**

  ```json
  {
    "title": "My New Topic"
  }
  ```

### **Add Reply to Topic**

Posts a reply to an existing topic.

- **URL:** `/api/forum/topics/:id/replies`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Body:**

  ```json
  {
    "content": "This is my reply content."
  }
  ```

---

## 📹 RTC (LiveKit)

### **Get LiveKit Token**

Generates an access token to join a video conferencing room.

- **URL:** `/api/livekit/token`
- **Method:** `GET`
- **Query Params:**
  - `room`: Name of the room.
  - `username`: Identity of the user.
- **Response:**

  ```json
  {
    "token": "LIVEKIT_JWT_TOKEN"
  }
  ```

---

## 🔌 WebSockets (Real-time)

### **Player Sync**

Handles real-time position synchronization.

- **URL:** `ws://localhost:3000/ws`
- **Protocol:** `ws`
- **Pub/Sub Channel:** `global-presence`
- **Messages:**
  - **Client Outbound (`move`):**

    ```json
    {
      "type": "move",
      "payload": { "x": 100, "y": 200 }
    }
    ```

  - **Server Inbound (`player_moved`):**

    ```json
    {
      "type": "player_moved",
      "payload": { "id": "WS_ID", "x": 100, "y": 200 }
    }
    ```
