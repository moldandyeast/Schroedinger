# SCHROEDINGER

**A local-first knowledge instrument where thoughts exist in superposition until observed.**

[![GitHub](https://img.shields.io/badge/GitHub-moldandyeast%2FSchroedinger-181717?logo=github)](https://github.com/moldandyeast/Schroedinger)

> ⚠️ **Early Build** — This is an active experiment. Core mechanics work, but many features are incomplete. Expect rough edges. See [WHITEPAPER.md](WHITEPAPER.md) for the v2.0 vision.

---

## The Idea

Your notes are plain markdown files. The software provides interactive *lenses*—different ways to see, explore, and play with your knowledge. Objects drift, collide, and form unexpected connections.

**Core thesis**: Determinism is the enemy of discovery.

---

## Quick Start

```bash
# Clone
git clone https://github.com/moldandyeast/Schroedinger.git
cd Schroedinger

# Install everything
npm install
cd bridge && npm install && cd ..
cd lens && npm install && cd ..

# Run (two terminals)
cd bridge && npm start      # Terminal 1: Backend on :3333
cd lens && npm run dev      # Terminal 2: Frontend on :5173

# Open http://localhost:5173
```

---

## Philosophy

**File over app.** Your markdown files are the truth. The database is a cache. The software is disposable. Your notes will outlive any tool.

**Randomness as engine.** Objects drift with entropy. Similar ideas attract via embeddings. Collisions force you to find connections you didn't plan.

**Withered technology.** Markdown, SQLite, local embeddings. Nothing fancy. Everything proven. Radically applied.

Read the full philosophy in [ESSAY.md](ESSAY.md).

---

## Lenses

Schroedinger provides multiple interfaces on top of your files:

| Lens | Status | Description |
|------|--------|-------------|
| **Drift** | ✅ Ready | Physics canvas. Objects wander, collide, synthesize. |
| **Observe** | 🔜 Soon | Watch the system evolve without intervention. |
| **Accelerator** | 🔜 Soon | Focused collision experiments. Find connections. |
| **Void** | 🔜 Soon | Map the embedding space. See what's missing. |
| **Archive** | 🔜 Soon | Browse and search. The traditional view. |

Launch any lens from the app launcher at `http://localhost:5173`.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      LENSES                              │
│   Multiple interfaces on top of your data               │
│   (Svelte + PixiJS + matter.js)                         │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                      BRIDGE                              │
│   Node.js backend: file watching, embeddings, API       │
│   (Hono + SQLite + ONNX Runtime)                        │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                      VAULT                               │
│   Plain markdown files. The eternal format.             │
│   Your data. Portable. Future-proof.                    │
└─────────────────────────────────────────────────────────┘
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full codebase guide.

---

## What's Implemented

### Core System
- ✅ File watcher syncs `vault/*.md` to SQLite
- ✅ ONNX embeddings (all-MiniLM-L6-v2, 384-dim)
- ✅ Semantic similarity search
- ✅ Physics simulation with drift
- ✅ Object memory and behavioral traits
- ✅ WebSocket real-time updates

### Drift Lens
- ✅ PixiJS canvas with pan/zoom
- ✅ KO sprites with physics
- ✅ Collision detection and prompts
- ✅ Synthesis creation (bridge notes)
- ✅ Semantic gravity (similar ideas attract)
- ✅ Affinity/rivalry system
- ✅ Trait visualization (ancient, volatile, magnetic)
- ✅ Particle Accelerator mode
- ✅ Search, create, edit panels

### App Shell
- ✅ Multi-lens launcher
- ✅ Dark/light theme
- ✅ Documentation integration

---

## Controls (Drift Lens)

| Action | Control |
|--------|---------|
| Pan canvas | Drag empty space |
| Zoom | Scroll wheel |
| Select object | Click |
| Move object | Drag |
| Search | `⌘K` |
| Create new | `⌘N` |
| Back to launcher | `⌘⌫` |

### Collision Prompt
- **Snap** — Create a synthesis linking both objects
- **Dismiss** — Create a rivalry (they'll avoid each other)
- **Ignore** — No effect

---

## Documentation

| Document | Description |
|----------|-------------|
| [ABOUT](ABOUT.md) | One-page summary |
| [ESSAY](ESSAY.md) | The philosophy behind Schroedinger |
| [PLAY](PLAY.md) | Game design document |
| [ARCHITECTURE](ARCHITECTURE.md) | Codebase structure for developers |

Each lens also has its own documentation accessible from the launcher.

---

## Constraints

- **No cloud.** Everything runs locally.
- **No accounts.** Single-user, your machine.
- **No proprietary formats.** Markdown + SQLite only.
- **No external APIs.** Embeddings via local ONNX.
- **No determinism.** The system must surprise you.

---

## License

MIT

---

*Determinism is the enemy of discovery.*
