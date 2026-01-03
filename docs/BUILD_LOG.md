# BUILD LOG

*A chronicle of Schroedinger's construction*

---

## Session 1: Genesis

**Date**: January 3, 2026

### Phase 0: Foundation

Created project structure:

```
schroedinger/
├── bridge/           # Backend server
├── lens/             # Frontend UI
├── vault/            # User's markdown files
├── state/            # SQLite database
└── models/           # ONNX embedding model
```

Established technology stack:
- **Bridge**: Node.js + Hono + better-sqlite3 + chokidar + onnxruntime-node
- **Lens**: Svelte 5 + Vite + PixiJS 8 + matter.js

### Phase 1: The Bridge

Built the backend server:

1. **Database Layer** (`db.ts`)
   - SQLite schema for KOs, links, memory, physics
   - CRUD operations for all entities
   - Embedding storage in memory (embeddings are regenerated on startup)
   - Similarity computation via cosine distance
   - Trait computation based on memory state

2. **File Watcher** (`watcher.ts`)
   - chokidar watching vault/*.md
   - Parse YAML frontmatter + markdown content
   - Sync to database on add/change/delete
   - Generate embeddings on file changes

3. **REST API** (`server.ts`)
   - Full CRUD for KOs, links, physics, memory
   - Discovery endpoints (search, similar, random, forgotten, orphans)
   - Collision and synthesis recording
   - Accelerator endpoint for focused collisions

4. **WebSocket** (`index.ts`)
   - Real-time broadcast of file changes
   - Connection management

5. **Embeddings** (`embeddings.ts`)
   - ONNX Runtime with all-MiniLM-L6-v2
   - Simple WordPiece tokenizer
   - Mean pooling + L2 normalization
   - 384-dimensional vectors

### Phase 2: The Lens

Built the frontend:

1. **Canvas** (`Canvas.svelte`)
   - PixiJS Application with pan/zoom
   - Physics simulation loop with matter.js
   - Link visualization (curved edges)
   - Semantic similarity lines
   - Sprite management

2. **KO Sprites** (`KOSprite.ts`)
   - Visual representation of knowledge objects
   - Drag and drop with spring physics
   - Trait-based visuals (shimmer, sparks, glow)
   - Hover observation tracking

3. **Physics Engine** (`physics.ts`)
   - matter.js wrapper
   - Drift simulation with entropy
   - Semantic gravity based on embeddings
   - Affinity attraction / rivalry repulsion
   - Autonomous behaviors (magnetic seeking, volatile impulses)

4. **UI Components**
   - `CollisionPrompt.svelte` — Snap/Dismiss/Ignore dialog
   - `SearchPanel.svelte` — Live search with debounce
   - `CreatePanel.svelte` — New thought modal
   - `EditPanel.svelte` — Sidebar with content, memory, traits
   - `Accelerator.svelte` — Focus mode with relatives + strangers

5. **State Management** (`stores.ts`)
   - Svelte stores for KOs, physics, memory, links
   - Similarity store for physics calculations
   - UI state (selected, hovered, active collision)

### Vault Contents

Created initial Knowledge Objects:

1. `welcome.md` — Introduction to Schroedinger
2. `mark-cerny-method.md` — Find the fun first
3. `gunpei-yokoi.md` — Lateral thinking with withered technology
4. `godels-incompleteness.md` — Embrace the gaps
5. `randomness-and-emergence.md` — Determinism is the enemy
6. `fischli-weiss.md` — How to work better

---

## Implementation Details

### What Works

| Feature | Status | Notes |
|---------|--------|-------|
| File → Database sync | ✅ | Via chokidar, handles add/change/delete |
| Markdown parsing | ✅ | YAML frontmatter + content extraction |
| Embedding generation | ✅ | ONNX + all-MiniLM-L6-v2 |
| REST API | ✅ | All endpoints implemented |
| WebSocket | ✅ | Real-time file change notifications |
| PixiJS canvas | ✅ | Smooth rendering, pan/zoom |
| matter.js physics | ✅ | Both server (drift) and client (interaction) |
| Collision detection | ✅ | With cooldown to prevent spam |
| Synthesis creation | ✅ | Creates markdown file + links |
| Memory tracking | ✅ | Observations, collisions, affinities |
| Trait computation | ✅ | Based on memory state |
| Autonomous behaviors | ✅ | Magnetic seeking, volatile impulses |
| Search | ✅ | LIKE-based, could use FTS5 |
| Similarity | ✅ | In-memory cosine similarity |

### What's Stubbed

| Feature | Status | Notes |
|---------|--------|-------|
| FTS5 search | 🟡 | Schema ready, using LIKE for now |
| sqlite-vec | 🟡 | Using in-memory embeddings instead |
| Void visualization | ❌ | Not implemented |
| Observation mode | ❌ | Auto-play not implemented |

### Dependencies

```json
// Bridge
{
  "hono": "^4.6.0",
  "@hono/node-server": "^1.13.0",
  "@hono/node-ws": "^1.0.0",
  "chokidar": "^4.0.0",
  "better-sqlite3": "^11.0.0",
  "onnxruntime-node": "^1.19.0",
  "ulid": "^2.3.0",
  "yaml": "^2.6.0",
  "glob": "^11.0.0"
}

// Lens
{
  "pixi.js": "^8.5.0",
  "matter-js": "^0.20.0",
  "svelte": "^5.0.0",
  "vite": "^5.4.0"
}
```

### Model Files

Downloaded from Hugging Face:
- `models/all-MiniLM-L6-v2.onnx` — 86MB
- `models/tokenizer.json` — 455KB

---

## Design Decisions

### Why In-Memory Embeddings?

sqlite-vec requires compilation and adds complexity. For a prototype with <10k objects, in-memory cosine similarity is fast enough and simpler to implement. The embeddings are regenerated on startup from the ONNX model.

### Why Node.js Instead of Bun?

Bun wasn't installed on the development machine. The code is designed to work on both, but was tested on Node.js 22 with tsx for TypeScript execution.

### Why matter.js on Both Sides?

Server-side matter.js handles drift simulation (objects move when you're not looking). Client-side matter.js handles interaction physics (drag, collision detection). Same engine ensures consistent behavior.

### Why Curved Lines for Links?

Curved lines (quadratic bezier) look more organic than straight lines. The curvature is subtle (10% offset from midpoint) but makes the canvas feel more alive.

---

## Lessons Learned

1. **chokidar's glob patterns are unreliable** — Watching the directory directly with manual filtering works better
2. **PixiJS 8 has a new API** — Graphics methods changed from v7
3. **Svelte 5 uses `mount` not `new App`** — Component instantiation changed
4. **ONNX tokenization is tricky** — Had to implement basic WordPiece tokenizer

---

## Next Steps

- [ ] Add FTS5 for proper full-text search
- [ ] Implement void visualization
- [ ] Add observation mode (auto-play)
- [ ] Improve trait visuals
- [ ] Add keyboard shortcuts for power users
- [ ] Consider mobile/touch support
- [ ] Add export/import for vault migration

