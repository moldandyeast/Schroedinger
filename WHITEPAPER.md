# SCHROEDINGER v2.0 WHITEPAPER

*A local-first knowledge instrument where thoughts exist in superposition until observed.*

**Build Date**: January 4, 2026  
**Status**: Ready for Tomorrow

---

## Executive Summary

Schroedinger is a personal knowledge system that rejects the fundamental assumption of every note-taking app: that organizing information is the goal. Instead, Schroedinger uses **physics, randomness, and emergence** to help you discover connections you didn't know existed.

Your notes are plain markdown files. The software provides interactive *lenses*—different ways to see, explore, and play with your knowledge. Objects drift, collide, and synthesize. The system has memory. It develops personality.

**The core thesis**: Determinism is the enemy of discovery.

---

## Part I: Philosophy

### The Problem with Tools for Thought

Every knowledge tool optimizes for **retrieval**—finding what you already know you want. Search boxes. Folder hierarchies. Tags. Links. All assume you know what you're looking for.

But the most valuable insights aren't retrieved. They're **encountered**. You stumble across something forgotten. You see two ideas adjacent for the first time. You realize something you didn't know you knew.

### Game Follows Play

The Bauhaus gave us *Form follows Function*—the aesthetic of the machine age. We propose a new principle:

> **Game follows Play.**

Every game is downstream of free play. Football didn't begin with FIFA rules—it began with humans kicking round objects for millennia. The game came after the play.

Schroedinger doesn't design for predetermined outcomes. It designs for **productive accidents**. It increases the surface area for luck. It creates spaces where you can stumble into what's next.

### The Quantum Metaphor

The name isn't decorative. The quantum metaphor runs deep:

| Concept | In Schroedinger |
|---------|-----------------|
| **Superposition** | Before observation, a thought exists in potential. It might connect to anything. |
| **Entropy** | New thoughts are unstable, energetic. Observation decreases entropy—they settle. |
| **Wave function** | Each thought has a "spread" of meanings via embeddings. Similar thoughts overlap. |
| **Observation** | Looking at a thought changes it. Attention increases mass, decreases entropy. |

### Withered Technology

Gunpei Yokoi's philosophy: Take mature, cheap technology and use it in radical new ways. The Game Boy beat color handhelds with a boring monochrome LCD.

| Withered Tech | Radical Application |
|---------------|---------------------|
| Markdown | Thoughts with physics, drifting in space |
| SQLite | Embeddings, memories, relationships in one file |
| matter.js | Physics simulation for thought interaction |
| ONNX | Local embeddings, no cloud dependency |

These technologies will exist in 50 years. Your notes will too.

---

## Part II: Current State (v0.1.0)

### What's Working

**Core System**
- ✅ File watcher syncs `vault/*.md` to SQLite
- ✅ ONNX embeddings (all-MiniLM-L6-v2, 384 dimensions)
- ✅ Semantic similarity search
- ✅ Physics simulation with drift
- ✅ Object memory and behavioral traits
- ✅ WebSocket real-time updates

**Drift Lens**
- ✅ PixiJS canvas with pan/zoom
- ✅ KO sprites with physics
- ✅ Collision detection and prompts
- ✅ Synthesis creation (bridge notes)
- ✅ Semantic gravity (similar ideas attract)
- ✅ Affinity/rivalry system
- ✅ Trait visualization (ancient, volatile, magnetic)
- ✅ Particle Accelerator mode
- ✅ Search, create, edit panels

**App Shell**
- ✅ Multi-lens launcher
- ✅ Dark/light theme
- ✅ Documentation integration

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      LENSES                              │
│   Svelte + PixiJS + matter.js                           │
│   Multiple interfaces on the same data                  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                      BRIDGE                              │
│   Hono + SQLite + ONNX Runtime                          │
│   File watching, embeddings, API, WebSocket             │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                      VAULT                               │
│   Plain markdown files. Your data. Eternal.            │
└─────────────────────────────────────────────────────────┘
```

### Data Model

**Knowledge Object (KO)**
```typescript
{
  id: string;              // ULID
  title: string;
  content: string;
  type: 'fragment' | 'synthesis' | 'observation';
  tags: string[];
  created_at: string;
  updated_at: string;
  file_path: string;
}
```

**Physics State**
```typescript
{
  ko_id: string;
  position_x: number;      // Canvas position
  position_y: number;
  velocity_x: number;
  velocity_y: number;
  mass: number;            // Based on observation count
  entropy: number;         // Decreases with observation
  is_anchored: boolean;
}
```

**Memory State**
```typescript
{
  ko_id: string;
  observation_count: number;
  last_observed: string;
  total_observation_time: number;
  collision_count: number;
  drift_distance: number;
  affinity_scores: { [koId]: number };
  rivalry_scores: { [koId]: number };
  behavioral_traits: {
    restless?: boolean;    // Moves faster, seeks collisions
    stable?: boolean;      // Resists movement
    magnetic?: boolean;    // Actively seeks high-affinity targets
    volatile?: boolean;    // Sudden movements, chain reactions
    forgotten?: boolean;   // Fades, drifts to edges
    ancient?: boolean;     // Gold border, gravitational center
  };
  evolution_history: Event[];
}
```

### Core Loop

```
        ┌──────────────────────┐
        │                      │
        ▼                      │
   ┌─────────┐           ┌─────────┐
   │  DRIFT  │──────────▶│ COLLIDE │
   └─────────┘           └─────────┘
        ▲                      │
        │                      ▼
   ┌─────────┐           ┌─────────┐
   │ RELEASE │◀──────────│  SNAP   │
   └─────────┘           └─────────┘
        │                      
        ▼                      
   ┌─────────┐                 
   │ EVOLVE  │  ← Objects remember and adapt
   └─────────┘                 
```

1. **Drift** — Objects move via entropy, semantic gravity, and traits
2. **Collide** — When two objects touch, physics pauses for decision
3. **Snap** — Name the connection, create a synthesis
4. **Release** — New synthesis enters with high entropy
5. **Evolve** — Objects remember; affinities and traits emerge

---

## Part III: What's Missing

### Critical Gaps

1. **Only one complete lens (Drift)** — Four other lenses are planned but unbuilt
2. **Physics runs only in frontend** — No background evolution when app is closed
3. **No persistence of similarity matrix** — Recalculated on each startup
4. **No autonomous observation mode** — User must always be present
5. **No gap analysis** — Can't see what's missing from your knowledge

### User Friction Points

- Collision prompts interrupt flow too often
- No way to batch-process multiple collisions
- Physics sometimes too chaotic, sometimes too static
- Traits don't feel impactful enough
- No satisfying feedback for emergent milestones

---

## Part IV: v2.0 Vision

### Design Principles for v2.0

1. **The canvas should feel alive when you return** — Background evolution is mandatory
2. **Reduce friction, increase serendipity** — Fewer prompts, more ambient discovery
3. **Traits must be visible and meaningful** — Objects should look and behave distinctly
4. **The void is luminous** — Show gaps in your knowledge as opportunities
5. **Polish one thing completely** — Better to have 2 perfect lenses than 5 mediocre ones

### New Lenses to Build

#### 1. Observe Lens (Priority: HIGH)
*Watch the system evolve without intervention.*

**Core concept**: A screensaver for your knowledge. Leave it running; collisions resolve autonomously based on embedding similarity. Return to find new syntheses.

**Features**:
- Auto-pilot mode: collisions resolve based on similarity threshold
- Time controls: 1x, 10x, 100x speed
- Heatmaps: visualize collision frequency over time
- Event log: "While you were away..." summary
- Ambient music/sounds that respond to system activity

**Implementation notes**:
- Move physics to Bridge (background process)
- Add `/api/autopilot` endpoint with configurable thresholds
- Store collision history with timestamps
- WebSocket push for major events

#### 2. Void Lens (Priority: HIGH)
*Map the embedding space. See what's missing.*

**Core concept**: 2D projection of your knowledge graph. Clusters reveal what you know; gaps reveal what you don't.

**Features**:
- t-SNE or UMAP projection of embeddings
- Cluster detection and automatic labeling
- Gap highlighting: "You have 0 notes about X"
- Orphan islands: isolated thoughts waiting for connection
- Zoom from macro (all knowledge) to micro (single cluster)

**Implementation notes**:
- Pre-compute projections on Bridge startup
- Store projection coordinates in database
- Regenerate on new KO or significant change
- Use WebGL for smooth rendering of 1000+ points

#### 3. Archive Lens (Priority: MEDIUM)
*The traditional view. Browse and search.*

**Core concept**: For when you actually need to find something specific. A concession to utility.

**Features**:
- List/grid view toggle
- Sort by: date, title, mass, entropy, observation count
- Filter by: type, tags, trait, has-links, orphan
- Full-text search with highlighted matches
- Quick preview on hover
- Bulk actions: tag, delete, merge

**Implementation notes**:
- FTS5 extension for SQLite (already simple LIKE search)
- Virtual scrolling for large vaults
- Keyboard navigation (vim-style: j/k/enter)

#### 4. Accelerator Lens (Priority: MEDIUM)
*Focused collision experiments.*

**Core concept**: Deliberate discovery. Pick an anchor thought, see what strangers might connect.

**Features**:
- Full-screen focused mode (not a panel)
- Visual similarity dial showing semantic distance
- "Collision candidates" ranked by dissimilarity (find the unexpected)
- Batch mode: queue 5 candidates, rapid-fire snap/dismiss
- History: track tried pairs, prevent repeats
- "Surprise me" button for maximum entropy

**Implementation notes**:
- Extend existing Accelerator panel to full lens
- Add collision history table
- Compute "interestingness" score (high semantic distance + low rivalry)

### Backend Improvements

#### Background Physics (Critical)
Move simulation to Bridge so the canvas evolves even when frontend is closed.

```typescript
// New Bridge module: physics-worker.ts
class PhysicsWorker {
  private interval: NodeJS.Timer;
  private running = false;
  
  start(tickMs = 100): void {
    this.running = true;
    this.interval = setInterval(() => this.tick(), tickMs);
  }
  
  tick(): void {
    // Load positions from DB
    // Apply drift, semantic gravity, affinities
    // Detect collisions
    // Auto-resolve if in autopilot mode
    // Save positions back to DB
    // Broadcast updates via WebSocket
  }
}
```

#### Persistent Embeddings
Store embeddings in SQLite (as BLOB) instead of in-memory cache.

```sql
CREATE TABLE embeddings (
  ko_id TEXT PRIMARY KEY,
  vector BLOB NOT NULL,  -- 384 * 4 bytes = 1536 bytes per KO
  updated_at TEXT NOT NULL
);
```

#### Collision Queue
For auto-pilot mode, maintain a queue of pending collisions with similarity scores.

```typescript
interface PendingCollision {
  koIdA: string;
  koIdB: string;
  similarity: number;
  timestamp: string;
  resolved: boolean;
  outcome?: 'synthesis' | 'dismiss' | 'ignore';
}
```

### Frontend Improvements

#### Visual Polish

**Object States** (make traits visually obvious)
| Trait | Visual Treatment |
|-------|------------------|
| Restless | Constant subtle vibration, particles trailing |
| Stable | Solid border, no animation, slight shadow |
| Magnetic | Pulsing blue glow, connection lines to affinities |
| Volatile | Red shimmer, occasional sparks |
| Forgotten | Low opacity (40%), grayscale, smaller size |
| Ancient | Gold border, corona effect, subtle glow |

**Ambient Effects**
- Background particle field that responds to overall entropy
- Subtle sound design for collisions, synthesis, trait changes
- Screen-edge vignette that pulses with system activity

#### Reduced Friction

**Smart Collision Filtering**
- Skip prompts for very low similarity (< 0.2)
- Auto-dismiss if both have high rivalry
- Auto-suggest connection name based on content analysis

**Batch Processing**
- "Session mode": collect collisions, resolve at end
- Swipe gestures: left = dismiss, right = snap, up = ignore
- Keyboard shortcuts: 1 = snap, 2 = dismiss, 3 = ignore

### Milestones & Feedback

Add non-gamified acknowledgment of emergent events:

| Milestone | Trigger | Feedback |
|-----------|---------|----------|
| First Synthesis | Create first connection | Subtle confetti, warm message |
| Network | 10 KOs with links | "A web is forming" |
| Constellation | 5+ mutual affinities | "A constellation has emerged" |
| Ancient One | First Ancient trait | "This thought has become a gravity well" |
| Resurrection | Forgotten KO synthesizes | "An old friend returns" |
| Chain Reaction | 3+ volatile cascade | "A cascade!" |

---

## Part V: Technical Decisions for v2.0

### Keep (Working Well)
- Markdown as source of truth
- SQLite as cache/state store
- Hono for API server
- Svelte for UI
- matter.js for physics
- ONNX for local embeddings
- WebSocket for real-time sync

### Change
- Move physics loop to Bridge (background process)
- Persist embeddings to SQLite (not in-memory)
- Add FTS5 for proper full-text search
- Use Web Workers for heavy frontend computation
- Add IndexedDB as client-side cache

### Consider
- **Electron wrapper**: For true background process + system tray
- **Plugin system**: Let users build custom lenses
- **Export to static site**: Share your knowledge graph
- **Import from Obsidian/Roam**: Migration paths

---

## Part VI: Build Plan for Tomorrow

### Morning (4 hours)

**Hour 1-2: Backend Foundations**
- [ ] Create `physics-worker.ts` with background simulation
- [ ] Add `embeddings` table to SQLite schema
- [ ] Migrate in-memory embedding cache to persistent storage
- [ ] Add `/api/autopilot` endpoints (start, stop, configure)

**Hour 2-3: Observe Lens MVP**
- [ ] Create `lens/src/lenses/observe/Observe.svelte`
- [ ] Connect to background physics via WebSocket
- [ ] Add time controls (pause, 1x, 10x)
- [ ] Display real-time collision events

**Hour 3-4: Auto-Resolve Logic**
- [ ] Implement similarity-based auto-synthesis
- [ ] Add "while you were away" summary endpoint
- [ ] Create collision history table

### Afternoon (4 hours)

**Hour 4-5: Void Lens MVP**
- [ ] Add UMAP projection to Bridge (use `umap-js`)
- [ ] Store projections in database
- [ ] Create `lens/src/lenses/void/Void.svelte`
- [ ] Render points with WebGL (PixiJS)

**Hour 5-6: Void Interactivity**
- [ ] Click point to see KO details
- [ ] Hover to highlight similar KOs
- [ ] Cluster coloring by semantic grouping
- [ ] Gap detection: sparse regions

**Hour 6-7: Visual Polish**
- [ ] Implement trait-specific visual effects
- [ ] Add particle background to Drift
- [ ] Sound design (optional but powerful)

**Hour 7-8: Integration & Testing**
- [ ] Test with 100+ KOs
- [ ] Fix physics balance (not too chaotic, not too static)
- [ ] Performance profiling
- [ ] Final polish pass

### Success Criteria

**Minimum Viable v2.0**
- [ ] Observe lens functional: can leave running, return to new syntheses
- [ ] Void lens functional: can see knowledge topology
- [ ] Background physics works: canvas evolves when tab is closed
- [ ] Traits are visually distinct

**Stretch Goals**
- [ ] Archive lens (basic list view)
- [ ] Sound design
- [ ] Electron wrapper for system tray

---

## Appendix A: API Reference

### Core Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/kos` | List all KOs |
| GET | `/api/kos/:id` | Single KO with memory/physics |
| POST | `/api/kos` | Create new KO |
| PUT | `/api/kos/:id` | Update KO |
| DELETE | `/api/kos/:id` | Delete KO |

### Discovery
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/random?n=5` | Random KOs |
| GET | `/api/orphans` | Unlinked KOs |
| GET | `/api/forgotten?days=30` | Unobserved KOs |
| GET | `/api/strangers/:id?n=3` | Unlinked to anchor |
| GET | `/api/similar/:id?n=5` | Semantically similar |

### Physics & Memory
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/physics` | All physics states |
| PUT | `/api/physics/:id` | Update position/velocity |
| GET | `/api/memory` | All memory states |
| POST | `/api/observe/:id` | Record observation |
| POST | `/api/collision` | Record collision outcome |

### New for v2.0
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/autopilot/start` | Start background physics |
| POST | `/api/autopilot/stop` | Stop background physics |
| GET | `/api/autopilot/status` | Current state + recent events |
| GET | `/api/projections` | 2D embedding projections |
| GET | `/api/gaps` | Sparse regions in embedding space |

---

## Appendix B: File Structure (v2.0)

```
schroedinger/
├── vault/                          # Your markdown files
├── state/
│   └── schroedinger.db             # SQLite (now includes embeddings)
├── models/
│   ├── all-MiniLM-L6-v2.onnx
│   └── tokenizer.json
├── bridge/
│   └── src/
│       ├── index.ts                # Entry point
│       ├── server.ts               # Hono API
│       ├── db.ts                   # SQLite operations
│       ├── embeddings.ts           # ONNX inference
│       ├── parser.ts               # Markdown parsing
│       ├── watcher.ts              # File system watcher
│       ├── physics-worker.ts       # NEW: Background physics
│       ├── projections.ts          # NEW: UMAP/t-SNE
│       └── types.ts
├── lens/
│   └── src/
│       ├── App.svelte
│       ├── main.ts
│       ├── core/                   # Shared infra
│       ├── components/             # Shared UI
│       └── lenses/
│           ├── launcher/
│           ├── drift/              # ✅ Complete
│           ├── observe/            # 🆕 v2.0
│           ├── void/               # 🆕 v2.0
│           ├── archive/            # 🆕 v2.0
│           └── accelerator/        # Enhanced
```

---

## Appendix C: The Contract

### What We Guarantee

1. **Your files are sacred.** We never modify markdown without explicit action.
2. **The database is a cache.** Delete it; we rebuild from files.
3. **The software is disposable.** Your notes will outlive any tool.
4. **No cloud, no accounts, no sync.** Your data never leaves your machine.
5. **No proprietary formats.** Markdown + SQLite forever.

### What We Don't Promise

- Organization (that's not the point)
- Determinism (that's the enemy)
- Control (that kills discovery)
- Productivity (we optimize for surprise)

---

## Appendix D: Design Language

### Colors
```css
/* Dark Mode */
--bg: #0a0a0a;
--bg-elevated: rgba(20, 20, 20, 0.95);
--border: #252525;
--text-primary: #ffffff;
--text-muted: #888888;
--accent: #c9a227;           /* Gold - for Ancient */
--success: #44ff88;          /* Green - for synthesis */
--error: #ff4444;            /* Red - for volatile */
--magnetic: #4488ff;         /* Blue - for attraction */
--void: #ff8844;             /* Orange - for gaps */
```

### Typography
```css
/* Headers */
font-family: 'Literata', Georgia, serif;

/* UI / Mono */
font-family: 'JetBrains Mono', monospace;
```

### Motion
- Drift: Perlin noise-based, organic movement
- Collisions: Bounce with 0.4 restitution
- UI transitions: 200ms ease-out
- Entropy shimmer: CSS animation, 2s cycle

---

## Closing

Schroedinger v2.0 is not about adding features. It's about deepening the core experience:

> **Objects that feel alive. A canvas that surprises you. Discovery you didn't plan.**

Tomorrow we build the Observe lens (let it run) and the Void lens (see what's missing). We move physics to the background. We make traits visible.

The goal is not to help you find what you're looking for.
The goal is to help you find what you weren't.

---

*Determinism is the enemy of discovery.*

---

**Prepared for build session: January 4, 2026**

