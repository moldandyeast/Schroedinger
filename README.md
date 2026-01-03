# SCHROEDINGER

**A Local-First Knowledge Instrument**

Version: 0.1.0  
Status: Working Prototype  
License: MIT

---

## What This Is

Schroedinger is a personal knowledge system where your thoughts exist as plain markdown files on your computer. No database lock-in. No cloud sync. No account. Just a folder of files that you can open with any text editor, today or fifty years from now.

The software provides an interactive canvas where notes have physics, drift randomly over time, collide to form unexpected connections, and develop their own behaviors and memories.

**The core thesis**: determinism is the enemy of discovery.

---

## Quick Start

```bash
# Clone and install
git clone <repo>
cd schroedinger
npm install
cd bridge && npm install
cd ../lens && npm install
cd ..

# Run both servers
npm run dev

# Open http://localhost:5173
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      THE LENS                           │
│            (Svelte 5 + PixiJS 8 + matter.js)           │
│                                                         │
│    Canvas  ←→  Search  ←→  Edit Panel  ←→  Accelerator │
│                                                         │
│                   WebSocket + REST                      │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│                 THE BRIDGE                              │
│          (Node.js + Hono + SQLite + ONNX)              │
│                                                         │
│  • File watcher (chokidar)                              │
│  • Vector embeddings (all-MiniLM-L6-v2)                 │
│  • Physics simulation (matter.js)                       │
│  • Object memory & agency system                        │
│  • localhost:3333                                       │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│               THE SUBSTRATE                             │
│               (Your Local Folder)                       │
│                                                         │
│  /vault/*.md           (Your thoughts - sacred)         │
│  /state/schroedinger.db (Cache - can be rebuilt)        │
│  /models/*.onnx        (Embedding model)                │
└─────────────────────────────────────────────────────────┘
```

---

## What's Implemented

### Bridge (Backend)

| Feature | Status | Description |
|---------|--------|-------------|
| File Watcher | ✅ | Syncs vault/*.md to SQLite via chokidar |
| REST API | ✅ | Full CRUD for KOs, links, physics, memory |
| WebSocket | ✅ | Real-time updates on file changes |
| Embeddings | ✅ | ONNX Runtime + all-MiniLM-L6-v2 (384-dim) |
| Similarity Search | ✅ | Cosine similarity in-memory |
| Full-Text Search | ✅ | LIKE-based (FTS5 ready) |
| Physics State | ✅ | Persisted positions/velocities |
| Memory System | ✅ | Observations, collisions, affinities, rivalries |
| Trait Computation | ✅ | Restless, stable, magnetic, volatile, forgotten, ancient |

### Lens (Frontend)

| Feature | Status | Description |
|---------|--------|-------------|
| Canvas | ✅ | PixiJS 8 with pan/zoom |
| KO Sprites | ✅ | Cards with physics, spring animations |
| Drag & Drop | ✅ | Drag to move, positions saved |
| Collision Detection | ✅ | matter.js collision events |
| Collision Prompt | ✅ | Snap (synthesize) or Dismiss |
| Search Panel | ✅ | Live search with debounce |
| Create Panel | ✅ | New thought dialog (⌘N) |
| Edit Panel | ✅ | Sidebar with content, memory, traits, physics |
| Link Visualization | ✅ | Curved edges between connected KOs |
| Semantic Gravity | ✅ | Attraction based on embedding similarity |
| Similarity Lines | ✅ | Faint lines between similar (>0.6) KOs |
| Observation Glow | ✅ | Hover glow, records observation time |
| Trait Visuals | ✅ | Shimmer, sparks, border colors |
| Particle Accelerator | ✅ | Focus mode with relatives + strangers |
| Autonomous Behaviors | ✅ | Magnetic seeks, volatile chain reactions |

---

## Technology Stack

### Bridge

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 22+ (tsx for dev) |
| HTTP Server | Hono |
| Database | SQLite (better-sqlite3) |
| File Watcher | chokidar |
| Embeddings | onnxruntime-node + all-MiniLM-L6-v2 |
| Physics | matter.js (headless) |

### Lens

| Component | Technology |
|-----------|------------|
| Framework | Svelte 5 |
| Bundler | Vite 5 |
| Rendering | PixiJS 8 |
| Physics | matter.js |
| State | Svelte stores |

---

## Folder Structure

```
schroedinger/
├── vault/                    # Your knowledge objects (SACRED)
│   └── *.md                  
├── state/
│   └── schroedinger.db       # SQLite database (can be rebuilt)
├── models/
│   ├── all-MiniLM-L6-v2.onnx # Embedding model (86MB)
│   └── tokenizer.json        # Tokenizer config
├── bridge/
│   ├── src/
│   │   ├── index.ts          # Entry point, server setup
│   │   ├── server.ts         # Hono routes
│   │   ├── watcher.ts        # File system observer
│   │   ├── db.ts             # SQLite operations + memory
│   │   ├── embeddings.ts     # ONNX embedding pipeline
│   │   ├── parser.ts         # Markdown + YAML frontmatter
│   │   └── types.ts          # TypeScript types
│   └── package.json
├── lens/
│   ├── src/
│   │   ├── App.svelte        # Main application
│   │   ├── main.ts           # Entry point
│   │   └── lib/
│   │       ├── Canvas.svelte       # PixiJS canvas + physics loop
│   │       ├── KOSprite.ts         # Knowledge object visual
│   │       ├── CollisionPrompt.svelte
│   │       ├── SearchPanel.svelte
│   │       ├── CreatePanel.svelte
│   │       ├── EditPanel.svelte
│   │       ├── Accelerator.svelte
│   │       ├── api.ts              # API client
│   │       ├── physics.ts          # matter.js wrapper
│   │       ├── spring.ts           # Animation springs
│   │       ├── stores.ts           # Svelte stores
│   │       └── types.ts            # TypeScript types
│   ├── package.json
│   └── vite.config.ts
├── docs/                     # Documentation site source
├── package.json              # Root scripts
├── README.md                 # This file
├── PLAY.md                   # Game design document
├── ESSAY.md                  # Philosophy
└── ABOUT.md                  # Summary
```

---

## API Reference

### Knowledge Objects

```
GET    /api/kos                    # List all KOs
GET    /api/kos/:id                # Get KO with memory + physics
POST   /api/kos                    # Create KO
PUT    /api/kos/:id                # Update KO
DELETE /api/kos/:id                # Delete KO
```

### Discovery

```
GET    /api/search?q=term          # Full-text search
GET    /api/similar/:id?n=5        # Semantic nearest neighbors
GET    /api/similarities           # All pairwise similarities
GET    /api/random?n=5             # Random KOs
GET    /api/forgotten?days=30      # Unobserved KOs
GET    /api/orphans                # KOs with no links
GET    /api/accelerator/:id        # Anchor + relatives + strangers
```

### Relationships

```
GET    /api/links                  # All links
POST   /api/links                  # Create link
DELETE /api/links/:source/:target  # Remove link
```

### Physics & Memory

```
GET    /api/physics                # All positions/velocities
PUT    /api/physics/:id            # Update position
PUT    /api/physics                # Batch update positions
POST   /api/observe/:id            # Record observation
POST   /api/collision              # Record collision outcome
POST   /api/synthesis              # Create synthesis (bridge note)
```

### WebSocket

```
WS     /ws
  → connected
  → file:created, file:changed, file:deleted
  → ko:observed, ko:collided
  → synthesis:created
  → link:created, link:deleted
```

---

## Database Schema

```sql
-- Core knowledge objects
CREATE TABLE kos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  type TEXT DEFAULT 'fragment',
  tags TEXT DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE
);

-- Explicit links between KOs
CREATE TABLE links (
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  link_type TEXT DEFAULT 'explicit',
  created_at TEXT NOT NULL,
  PRIMARY KEY (source_id, target_id)
);

-- Object memory and behavior
CREATE TABLE ko_memory (
  ko_id TEXT PRIMARY KEY,
  observation_count INTEGER DEFAULT 0,
  last_observed TEXT,
  total_observation_time INTEGER DEFAULT 0,
  collision_count INTEGER DEFAULT 0,
  drift_distance REAL DEFAULT 0,
  affinity_scores TEXT DEFAULT '{}',
  rivalry_scores TEXT DEFAULT '{}',
  behavioral_traits TEXT DEFAULT '{}',
  evolution_history TEXT DEFAULT '[]'
);

-- Physics state
CREATE TABLE ko_physics (
  ko_id TEXT PRIMARY KEY,
  position_x REAL DEFAULT 0,
  position_y REAL DEFAULT 0,
  velocity_x REAL DEFAULT 0,
  velocity_y REAL DEFAULT 0,
  mass REAL DEFAULT 1.0,
  entropy REAL DEFAULT 1.0,
  is_anchored INTEGER DEFAULT 0
);
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `⌘N` / `Ctrl+N` | Create new thought |
| `Escape` | Close panels, deselect |
| Scroll | Zoom canvas |
| Drag canvas | Pan view |
| Drag KO | Move object |

---

## How It Works

1. **Thoughts drift** based on entropy (new = high entropy = more movement)
2. **Similar thoughts attract** via semantic gravity from embeddings
3. **Collisions trigger prompts** — snap to synthesize, dismiss to create rivalry
4. **Objects remember** — observations reduce entropy, collisions build relationships
5. **Traits emerge** — behaviors like "restless" or "magnetic" develop over time
6. **Autonomous behaviors** — magnetic objects seek affinities, volatile ones cause chain reactions

---

## Constraints

- **No cloud sync**: Use Syncthing or Dropbox on the folder if needed
- **No accounts**: Single-user, local-first
- **No proprietary formats**: Markdown + SQLite only
- **No external APIs**: All AI runs locally via ONNX
- **No determinism**: The system must surprise you

---

## References

- [Mark Cerny - Developing Your Game Idea](https://www.youtube.com/watch?v=Tk2TDPwV3Ho)
- [Gunpei Yokoi - Lateral Thinking with Withered Technology](https://en.wikipedia.org/wiki/Gunpei_Yokoi)
- [Fischli & Weiss - How to Work Better](https://publicdelivery.org/fischli-weiss-how-to-work-better/)
- [Gödel's Incompleteness Theorems](https://en.wikipedia.org/wiki/G%C3%B6del%27s_incompleteness_theorems)
