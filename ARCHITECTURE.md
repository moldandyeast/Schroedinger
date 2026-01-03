# ARCHITECTURE

*Staff engineer guide to Schroedinger's codebase*

---

## Philosophy

**File over app.** Your markdown files are the truth. Everything else is a lens.

The system is built on three layers:

```
┌─────────────────────────────────────────────────────────┐
│                      LENSES                              │
│   Multiple interfaces built on top of the same data     │
│   (Drift, Observe, Accelerator, Void, Archive)          │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                      BRIDGE                              │
│   Node.js backend: file watching, embeddings, API       │
│   The single source of truth for the runtime state      │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                      VAULT                               │
│   Plain markdown files. The eternal format.             │
│   Your data. Portable. Future-proof.                    │
└─────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
schroedinger/
├── vault/                    # Your knowledge (markdown files)
│   ├── *.md                  # Knowledge objects (auto-generated IDs)
│   └── _examples/            # Example KOs
│
├── bridge/                   # Backend server
│   ├── src/
│   │   ├── index.ts          # Entry point, orchestration
│   │   ├── server.ts         # Hono HTTP/WebSocket server
│   │   ├── db.ts             # SQLite database operations
│   │   ├── embeddings.ts     # ONNX embedding generation
│   │   ├── parser.ts         # Markdown parsing
│   │   ├── watcher.ts        # File system watcher
│   │   └── types.ts          # Shared types
│   └── state/
│       └── schroedinger.db   # SQLite cache (regenerable)
│
├── lens/                     # Frontend app
│   ├── src/
│   │   ├── App.svelte        # Shell & router
│   │   ├── main.ts           # Entry point
│   │   │
│   │   ├── core/             # Shared infrastructure
│   │   │   ├── index.ts      # Barrel export
│   │   │   ├── api.ts        # Bridge API client
│   │   │   ├── stores.ts     # Global Svelte stores
│   │   │   ├── types.ts      # TypeScript types
│   │   │   └── theme.ts      # Dark/light mode
│   │   │
│   │   ├── components/       # Shared UI components
│   │   │   ├── index.ts      # Barrel export
│   │   │   ├── SearchPanel.svelte
│   │   │   ├── CreatePanel.svelte
│   │   │   ├── EditPanel.svelte
│   │   │   ├── StatusBar.svelte
│   │   │   └── BackButton.svelte
│   │   │
│   │   └── lenses/           # Individual lens apps
│   │       ├── index.ts      # Lens exports
│   │       ├── registry.ts   # Lens configuration
│   │       │
│   │       ├── launcher/     # App store
│   │       │   └── Launcher.svelte
│   │       │
│   │       └── drift/        # Physics canvas lens
│   │           ├── Drift.svelte      # Main component
│   │           ├── Canvas.svelte     # PixiJS canvas
│   │           ├── KOSprite.ts       # Visual KO representation
│   │           ├── physics.ts        # Matter.js physics
│   │           ├── spring.ts         # Animation springs
│   │           ├── CollisionPrompt.svelte
│   │           └── Accelerator.svelte
│   │
│   └── index.html            # HTML shell
│
├── models/                   # ML models
│   ├── all-MiniLM-L6-v2.onnx # Embedding model
│   └── tokenizer.json        # Tokenizer config
│
├── site/                     # Documentation site builder
│   ├── build.js              # Markdown → HTML
│   └── public/               # Built docs
│
├── docs/                     # Built documentation
│   ├── index.html
│   ├── about.html
│   ├── essay.html
│   ├── play.html
│   └── log.html
│
├── state/                    # Runtime state
│   └── schroedinger.db       # Main SQLite database
│
├── ABOUT.md                  # What this is
├── ESSAY.md                  # The philosophy
├── PLAY.md                   # Game design document
├── PLAN.md                   # Development plan
└── ARCHITECTURE.md           # This file
```

---

## Adding a New Lens

1. **Create the lens folder:**
   ```
   lens/src/lenses/your-lens/
   ├── YourLens.svelte    # Main component
   └── index.ts           # Exports
   ```

2. **Register in `registry.ts`:**
   ```typescript
   export const LENSES: LensConfig[] = [
     // ...existing lenses
     {
       id: 'your-lens',
       name: 'Your Lens',
       description: 'What it does',
       icon: '◌',
       color: '#yourcolor',
       colorLight: '#lightvariant',
       ready: true,  // Set to true when ready
     },
   ];
   ```

3. **Add to `lenses/index.ts`:**
   ```typescript
   export { default as YourLens } from './your-lens/YourLens.svelte';
   ```

4. **Add to `App.svelte` router:**
   ```svelte
   {:else if $currentLens === 'your-lens'}
     <YourLens />
   ```

5. **Update types in `core/types.ts`:**
   ```typescript
   export type LensId = 'launcher' | 'drift' | ... | 'your-lens';
   ```

---

## Core Module

The `core/` module provides shared infrastructure:

```typescript
// Import everything you need
import { 
  // API functions
  fetchKOs, createKO, fetchPhysics, connectWebSocket,
  
  // Stores
  kos, selectedKO, currentLens,
  
  // Store helpers
  setKOs, addKO, navigateTo,
  
  // Theme
  theme,
  
  // Types
  type KO, type LensId
} from '../core';
```

### Key Stores

| Store | Type | Purpose |
|-------|------|---------|
| `currentLens` | `LensId` | Current active lens |
| `kos` | `Map<string, KO>` | All knowledge objects |
| `physics` | `Map<string, KOPhysics>` | Physics state per KO |
| `memory` | `Map<string, KOMemory>` | Memory/behavior per KO |
| `selectedKO` | `string \| null` | Currently selected KO |
| `isConnected` | `boolean` | WebSocket connection status |

### Navigation

```typescript
import { navigateTo, currentLens } from '../core';

// Navigate to a lens
navigateTo('drift');

// Check current lens
if ($currentLens === 'launcher') { ... }
```

---

## Shared Components

Use components from `components/`:

```svelte
<script>
  import { SearchPanel, CreatePanel, EditPanel, StatusBar, BackButton } from '../components';
</script>

<BackButton />
<SearchPanel />
<StatusBar />
```

---

## Bridge API

The bridge runs on `localhost:3333` and provides:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/kos` | GET | List all KOs |
| `/api/kos/:id` | GET | Get single KO with memory/physics |
| `/api/kos` | POST | Create new KO |
| `/api/physics` | GET | Get all physics states |
| `/api/physics/:id` | PUT | Update physics |
| `/api/memory` | GET | Get all memory states |
| `/api/observe/:id` | POST | Record observation |
| `/api/collision` | POST | Record collision outcome |
| `/api/synthesis` | POST | Create synthesis from collision |
| `/api/links` | GET | Get all links |
| `/api/similarities` | GET | Get embedding similarities |
| `/api/search` | GET | Search KOs |
| `/ws` | WebSocket | Real-time updates |

---

## WebSocket Messages

The bridge pushes these events:

```typescript
{ type: 'file:created', ko: KO }
{ type: 'file:changed', ko: KO }
{ type: 'file:deleted', ko: { id: string } }
{ type: 'synthesis:created', connection: string }
```

---

## Design Tokens

Use CSS variables for theming:

```css
/* Dark mode (default) */
--bg: #0a0a0a;
--bg-elevated: rgba(20, 20, 20, 0.8);
--border: #252525;
--text-primary: #ffffff;
--text-muted: #666;
--accent: #c9a227;
--success: #44ff88;
--error: #ff4444;

/* Light mode (via data-theme="light") */
--bg: #faf9f7;
--text-primary: #1a1a1a;
/* etc. */
```

---

## Conventions

1. **Files are sacred.** Never modify a user's markdown without explicit action.
2. **Database is a cache.** It can always be regenerated from the vault.
3. **Lenses are disposable.** Build new ones, throw old ones away.
4. **Theme syncs via localStorage.** Key: `schroedinger-theme`
5. **IDs are ULIDs.** Sortable, URL-safe, prefixed with `01`.

---

## Running Locally

```bash
# Terminal 1: Bridge
cd bridge && npm start

# Terminal 2: Lens
cd lens && npm run dev
```

The lens proxies `/api` and `/ws` to the bridge via Vite config.

---

## Key Files to Understand

| File | What it does |
|------|--------------|
| `lens/src/App.svelte` | Shell & router |
| `lens/src/core/stores.ts` | Global state |
| `lens/src/lenses/registry.ts` | Lens configuration |
| `bridge/src/server.ts` | All API endpoints |
| `bridge/src/db.ts` | Database operations |
| `PLAY.md` | Game design philosophy |

---

*Determinism is the enemy of discovery.*

