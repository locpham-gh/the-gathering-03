# The Gathering - Virtual Co-Working Space

A Full-Stack Monorepo application combining a declarative 2D game engine (PixiJS) with business SaaS features.

## 🚀 Tech Stack

**Monorepo**: Bun Workspaces
**Frontend**: Vite + React 18 + TailwindCSS + @pixi/react 7
**Backend**: Bun + ElysiaJS + Mongoose (BEMN Stack)
**Database**: MongoDB
**Auth**: Google One Tap OAuth 2.0

## 📁 Architecture

```
/
├── apps/
│   ├── client/       # React SPA (UI + Game Canvas)
│   └── server/       # ElysiaJS REST API
├── docs/             # Technical docs and Phase planning
└── package.json      # Workspace root
```

## ⚙️ Quick Start

### 1. Requirements
Ensure you have [Bun](https://bun.sh/) and [MongoDB](https://www.mongodb.com/try/download/community) installed.

### 2. Configuration
Create a `.env` file from the example files inside both application folders:
- `apps/server/.env` *(needs MONGODB_URI and GOOGLE_CLIENT_ID)*
- `apps/client/.env` *(needs VITE_GOOGLE_CLIENT_ID)*

### 3. Install & Run
```bash
# Install dependencies from root
bun install

# Start Backend Server
cd apps/server
bun run dev

# Start Frontend Server
cd apps/client
bun run dev
```

Visit `http://localhost:5173` to experience The Gathering.
