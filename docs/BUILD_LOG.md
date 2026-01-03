# Build Log

*A journal of building Schroedinger.*

---

## The Beginning

Schroedinger started with a question: *What if knowledge tools embraced randomness instead of eliminating it?*

Every note app optimizes for retrieval—finding what you already know you want. But the most valuable insights come from accidents. From stumbling across something you forgot. From juxtapositions you didn't plan.

The core thesis: **Determinism is the enemy of discovery.**

---

## Phase 1: The Bridge

Built the backend first. A Node.js server using Hono for HTTP, better-sqlite3 for persistence, and chokidar for file watching.

The key insight: **the database is a cache, not the source of truth.** Your markdown files are sacred. The SQLite database can always be rebuilt from them. This means no lock-in. Delete the database, restart the server, everything regenerates.

Added ONNX Runtime for local embeddings. The all-MiniLM-L6-v2 model gives us 384-dimensional vectors for semantic similarity. No cloud APIs. Everything runs on your machine.

---

## Phase 2: The Canvas

Chose PixiJS for rendering. It handles thousands of sprites at 60fps. Matter.js for physics—a 2D engine that runs headless on the server and with visuals on the client.

The sprites are simple: dark cards with titles. But they *move*. Entropy drives random drift. High entropy (new objects) means more movement. Low entropy (observed objects) means stability.

Added spring animations for natural feel. When you drag an object, it follows your cursor with a slight lag. When you release, it settles with a bounce.

---

## Phase 3: The Collision

This is the core mechanic. When two objects touch, the simulation pauses. A prompt appears: *What connects these?*

You can:
- **Snap**: Name the connection, create a synthesis
- **Dismiss**: Mark them as incompatible (creates rivalry)
- **Ignore**: Let them pass

Snapping creates a new markdown file—a "bridge note"—that links the two parents. The child starts with high entropy. It's unstable, energetic, seeking its own collisions.

The collision prompt took many iterations. Too intrusive and it breaks flow. Too subtle and you miss it. The current version appears inline, right where the collision happened.

---

## Phase 4: Memory & Traits

Objects remember what happens to them:
- How often they've been observed
- How long you spent with them
- Who they've collided with
- What came of those collisions

From memory, traits emerge:
- **Restless**: Low observation, high drift → seeks collisions
- **Stable**: High observation, many links → resists movement
- **Magnetic**: Many affinities → attracts similar objects
- **Volatile**: Many rivalries → sudden movements, chain reactions
- **Forgotten**: No observation 30+ days → fades, drifts to edges
- **Ancient**: 20+ observations, high mass → gravitational center

Traits aren't assigned. They're computed from behavior. An object becomes Ancient by being observed over time. It becomes Forgotten by being ignored.

---

## Phase 5: Semantic Gravity

Added attraction based on embedding similarity. Similar ideas drift toward each other. Dissimilar ideas ignore each other. Too-similar ideas (>0.9 cosine similarity) actually repel—they're redundant, they need space.

Combined with random drift, this creates emergent clustering. Related ideas form neighborhoods. Outliers float at the edges. The topology of your knowledge becomes visible.

---

## Phase 6: The Launcher

Realized we needed multiple "lenses"—different ways to see the same data. The physics canvas is one lens. But you might also want:
- A passive observer mode
- A focused accelerator for intentional collisions
- A void map showing gaps in your knowledge
- A traditional archive view

Built an app launcher. Each lens is a separate Svelte component with its own purpose. The launcher shows all available lenses, their status, and links to their documentation.

Added dark/light theme. Theming uses CSS variables and `data-theme` attribute, synced via localStorage.

---

## Phase 7: Documentation

Wrote extensive documentation:
- README.md: Quick start
- ABOUT.md: One-page summary
- ESSAY.md: The philosophy
- PLAY.md: Game design document
- ARCHITECTURE.md: Codebase guide

Each lens also has its own doc explaining what it does, how to use it, and the design philosophy behind it.

---

## Lessons Learned

1. **Start with the collision.** The Cerny Method works. Build the core mechanic first, make it feel good, then expand.

2. **Files over apps.** Plain markdown means no lock-in. You can read your notes in any text editor. They'll outlive any software.

3. **Randomness requires tuning.** Too much drift feels chaotic. Too little feels static. The balance took many iterations.

4. **Traits create personality.** When objects have memory and behavior, the system feels alive. This wasn't expected—it emerged from the design.

5. **Multiple lenses > feature creep.** Instead of cramming everything into one interface, separate lenses for separate purposes. Each can be simple.

---

## What's Next

The core loop works: Drift → Collide → Snap → Release → Evolve.

Now we complete the remaining lenses:
- Observe: Watch without intervention
- Accelerator: Focused collision experiments
- Void: Map the embedding space
- Archive: Browse and search

And deepen the agency system:
- Autonomous behaviors (magnetic seeking, volatile reactions)
- Evolution history visualization
- Emergent milestones

The system runs. Time to make it sing.

---

*January 2026*
