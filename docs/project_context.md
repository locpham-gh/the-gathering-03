# The Gathering - Project Context (Updated 2026-04-20)

## 🎯 Current Status
The project has successfully reached a modular UI maturity phase. We have completely overhauled the **Digital Public Library** interface, transitioning from a dark-themed prototype to a polished, professional "Light & Teal" design system. The codebase has also been modernized with **Tailwind CSS v4**.

## 🛠 Tech Stack
- **Monorepo**: Bun Workspaces (v1.3+).
- **Backend**: Bun + ElysiaJS + MongoDB (Mongoose).
- **Frontend**: React 18 + Vite 8 + **Tailwind CSS v4** + Framer Motion.
- **Game Engine**: PixiJS (@pixi/react) for the 2D workspace.
- **Communication**: Native Bun WebSockets for real-time positional sync.
- **Media**: LiveKit (Integrated for proximity-based collaboration).

## 🎨 Design System: "Angular Light"
As of April 20, 2026, the application follows a specific design language:
- **Theme**: Light Mode (Slate-50 background, Slate-900 typography).
- **Primary Color**: Teal (#0D9488) used for active states, primary buttons, and branding accents.
- **Typography**: **Inter** font (imported via Google Fonts). Chosen for its "structural lines" and high legibility in professional UIs.
- **Geometry**: **Angular Design**. We have moved away from round corners. Standard border-radius is `0.375rem` (6px) or lower (`rounded`).
- **Aesthetic**: Minimalist, high contrast, and performance-first.

## 📁 Feature Focus: Digital Public Library
The Library is a key interaction zone in the Gathering Metaverse:
- **Components**:
    - `LibrarySidebar`: Categorization and search by tags.
    - `LibraryHeader`: Sticky navigation with high-opacity backgrounds (no blur for performance).
    - `LibraryCard`: Hardware-accelerated cards for artifacts.
    - `ResourceDetail`: Sharp, angular modal for deep-diving into eBooks/Guides.
- **Performance Optimizations**:
    - **Backdrop Blur removal**: Eliminated from all sticky/animated elements to maintain 60fps scrolling and transitions.
    - **Hardware Acceleration**: Utilized `will-change: transform, opacity` and `overscroll-behavior: contain` for a native-app feel.
    - **Deferred Search**: Uses `useDeferredValue` for non-blocking search filtering.

## ⚙️ Infrastructure Changes (Tailwind v4 Upgrade)
The project now follows a **CSS-First** configuration:
- **No JS Config**: `tailwind.config.js` and `postcss.config.js` have been **deleted**.
- **CSS Entry**: Config is defined within the `@theme` block in `src/index.css`.
- **Vite Integration**: Uses `@tailwindcss/vite` plugin for lightning-fast HMR and build times.
- **Clean Environment**: `tailwindcss-animate` and other v3-only plugins have been removed to ensure build stability.

## 🚀 Roadmap & Next Steps
- **Admin Dashboard**: Future implementation for librarians to upload resources directly.
- **Proximity Audio**: Deepening LiveKit integration for spatial voice chat within the Library zones.
- **Shared Workspace**: Interactive "whiteboard" triggers within the library archive rooms.

---
*Status: Design Reversion & Performance Optimization Complete. Ready for feature expansion.*
