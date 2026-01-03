# BUILD PLAN

**Schroedinger: Implementation Roadmap**

---

## Overview

This plan builds Schroedinger from zero to first playable in **8 weeks**, with an additional 4 weeks for the agency system. We follow the Cerny Method: validate the core mechanic (collision) before building infrastructure.

**Total Timeline**: 12 weeks  
**Core Team**: 1-2 developers  
**First Playable**: Week 8

---

## Phase 0: Project Setup (Day 1-2)

### Goals
- Repository structure
- Development environment
- Basic tooling

### Tasks

```bash
# Initialize monorepo
mkdir schroedinger && cd schroedinger
git init

# Create structure
mkdir -p vault state bridge/src lens/src

# Initialize bridge (Bun)
cd bridge
bun init
bun add hono @hono/node-ws chokidar better-sqlite3 ulid
bun add -d typescript @types/better-sqlite3

# Initialize lens (Svelte + Vite)
cd ../lens
bun create vite . --template svelte-ts
bun add pixi.js matter-js
bun add -d @sveltejs/vite-plugin-svelte
```

### Deliverables
- [ ] Monorepo with `bridge/` and `lens/` packages
- [ ] TypeScript configured in both packages
- [ ] Basic `package.json` scripts for dev/build
- [ ] `.gitignore` (ignore `state/`, `node_modules/`)
- [ ] Empty `vault/` with a sample `.md` file

### File Structure After Phase 0
```
schroedinger/
├── vault/
│   └── welcome.md           # Sample KO
├── state/                    # Will contain schroedinger.db
├── bridge/
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── lens/
│   ├── src/
│   │   ├── App.svelte
│   │   └── main.ts
│   ├── package.json
│   └── vite.config.ts
├── README.md
├── PLAY.md
├── ESSAY.md
├── ABOUT.md
└── PLAN.md
```

---

## Phase 1: The Bridge Foundation (Week 1-2)

### Goals
- SQLite database with schema
- File watcher syncing vault → database
- REST API for CRUD operations
- WebSocket for real-time updates

### Week 1: Database + File Watcher

#### Day 1-2: SQLite Schema

```typescript
// bridge/src/db.ts
import Database from 'better-sqlite3';

export function initDB(path: string) {
  const db = new Database(path);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS kos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      type TEXT DEFAULT 'fragment',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      file_path TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS links (
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      link_type TEXT DEFAULT 'explicit',
      created_at TEXT NOT NULL,
      PRIMARY KEY (source_id, target_id)
    );

    CREATE TABLE IF NOT EXISTS ko_memory (
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

    CREATE TABLE IF NOT EXISTS ko_physics (
      ko_id TEXT PRIMARY KEY,
      position_x REAL DEFAULT 0,
      position_y REAL DEFAULT 0,
      velocity_x REAL DEFAULT 0,
      velocity_y REAL DEFAULT 0,
      mass REAL DEFAULT 1.0,
      entropy REAL DEFAULT 1.0,
      is_anchored INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_kos_type ON kos(type);
    CREATE INDEX IF NOT EXISTS idx_kos_updated ON kos(updated_at);
  `);
  
  return db;
}
```

#### Day 3-4: Markdown Parser + File Watcher

```typescript
// bridge/src/parser.ts
import { readFile } from 'fs/promises';
import { createHash } from 'crypto';
import { ulid } from 'ulid';

interface ParsedKO {
  id: string;
  title: string;
  content: string;
  contentHash: string;
  type: string;
  tags: string[];
  createdAt: string;
}

export async function parseMarkdown(filePath: string): Promise<ParsedKO> {
  const raw = await readFile(filePath, 'utf-8');
  const hash = createHash('sha256').update(raw).digest('hex');
  
  // Parse YAML frontmatter
  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  let metadata: any = {};
  let content = raw;
  
  if (frontmatterMatch) {
    // Simple YAML parsing (or use yaml package)
    const yamlStr = frontmatterMatch[1];
    content = raw.slice(frontmatterMatch[0].length).trim();
    // Parse YAML...
  }
  
  return {
    id: metadata.id || ulid(),
    title: metadata.title || extractTitle(content),
    content,
    contentHash: hash,
    type: metadata.type || 'fragment',
    tags: metadata.tags || [],
    createdAt: metadata.created || new Date().toISOString(),
  };
}

// bridge/src/watcher.ts
import chokidar from 'chokidar';
import { parseMarkdown } from './parser';
import { upsertKO, deleteKO } from './db';

export function watchVault(vaultPath: string, onChange: (event: any) => void) {
  const watcher = chokidar.watch(`${vaultPath}/**/*.md`, {
    persistent: true,
    ignoreInitial: false,
  });

  watcher.on('add', async (path) => {
    const ko = await parseMarkdown(path);
    upsertKO(ko, path);
    onChange({ type: 'file:created', ko });
  });

  watcher.on('change', async (path) => {
    const ko = await parseMarkdown(path);
    upsertKO(ko, path);
    onChange({ type: 'file:changed', ko });
  });

  watcher.on('unlink', (path) => {
    deleteKO(path);
    onChange({ type: 'file:deleted', path });
  });

  return watcher;
}
```

#### Day 5: Initial Sync on Startup

```typescript
// bridge/src/sync.ts
import { glob } from 'glob';
import { parseMarkdown } from './parser';

export async function initialSync(vaultPath: string, db: Database) {
  const files = await glob(`${vaultPath}/**/*.md`);
  
  for (const file of files) {
    const ko = await parseMarkdown(file);
    upsertKO(db, ko, file);
    
    // Initialize physics with random position
    initPhysics(db, ko.id, {
      position_x: Math.random() * 1000 - 500,
      position_y: Math.random() * 1000 - 500,
      entropy: 1.0,
    });
    
    // Initialize empty memory
    initMemory(db, ko.id);
  }
}
```

### Week 2: REST API + WebSocket

#### Day 1-2: Hono Server

```typescript
// bridge/src/server.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';

const app = new Hono();
const { upgradeWebSocket, injectWebSocket } = createNodeWebSocket({ app });

app.use('*', cors());

// REST endpoints
app.get('/api/kos', (c) => {
  const kos = getAllKOs(db);
  return c.json(kos);
});

app.get('/api/kos/:id', (c) => {
  const ko = getKO(db, c.req.param('id'));
  if (!ko) return c.notFound();
  return c.json(ko);
});

app.post('/api/kos', async (c) => {
  const body = await c.req.json();
  const ko = createKO(db, body);
  broadcast({ type: 'ko:created', ko });
  return c.json(ko, 201);
});

app.put('/api/kos/:id', async (c) => {
  const body = await c.req.json();
  const ko = updateKO(db, c.req.param('id'), body);
  broadcast({ type: 'ko:updated', ko });
  return c.json(ko);
});

app.delete('/api/kos/:id', (c) => {
  deleteKO(db, c.req.param('id'));
  broadcast({ type: 'ko:deleted', id: c.req.param('id') });
  return c.json({ ok: true });
});

// Physics endpoints
app.get('/api/physics', (c) => {
  const physics = getAllPhysics(db);
  return c.json(physics);
});

app.put('/api/physics/:id', async (c) => {
  const body = await c.req.json();
  updatePhysics(db, c.req.param('id'), body);
  return c.json({ ok: true });
});

// Observation endpoint
app.post('/api/observe/:id', (c) => {
  recordObservation(db, c.req.param('id'));
  return c.json({ ok: true });
});

// WebSocket
const clients = new Set<WebSocket>();

app.get('/ws', upgradeWebSocket((c) => ({
  onOpen(ws) {
    clients.add(ws);
  },
  onClose(ws) {
    clients.delete(ws);
  },
})));

function broadcast(message: any) {
  const json = JSON.stringify(message);
  for (const client of clients) {
    client.send(json);
  }
}

// Start server
const server = serve({ fetch: app.fetch, port: 3333 });
injectWebSocket(server);
console.log('Bridge running on http://localhost:3333');
```

#### Day 3-4: Random & Discovery Endpoints

```typescript
// Additional endpoints
app.get('/api/random', (c) => {
  const n = parseInt(c.req.query('n') || '5');
  const kos = getRandomKOs(db, n);
  return c.json(kos);
});

app.get('/api/orphans', (c) => {
  const kos = getOrphans(db);
  return c.json(kos);
});

app.get('/api/forgotten', (c) => {
  const days = parseInt(c.req.query('days') || '30');
  const kos = getForgotten(db, days);
  return c.json(kos);
});
```

#### Day 5: Integration Testing

- [ ] Test file creation → database insert
- [ ] Test file modification → database update
- [ ] Test file deletion → database delete
- [ ] Test WebSocket broadcasts on all changes
- [ ] Test REST API CRUD operations

### Phase 1 Deliverables
- [ ] SQLite database with full schema
- [ ] File watcher syncing vault to database
- [ ] REST API for all CRUD operations
- [ ] WebSocket broadcasting changes
- [ ] Random KO endpoint working
- [ ] Physics state persisted between sessions

---

## Phase 2: The Canvas (Week 3-4)

### Goals
- PixiJS canvas rendering KOs as sprites
- Drag interaction with matter.js physics
- Real-time sync with bridge via WebSocket
- Spring animations for natural feel

### Week 3: Basic Canvas

#### Day 1-2: PixiJS Setup

```typescript
// lens/src/lib/canvas.ts
import { Application, Container, Graphics, Text } from 'pixi.js';

export async function createCanvas(element: HTMLElement) {
  const app = new Application();
  
  await app.init({
    resizeTo: element,
    backgroundColor: 0x0a0a0a, // Near black
    antialias: true,
    resolution: window.devicePixelRatio || 1,
  });
  
  element.appendChild(app.canvas);
  
  // Create layers
  const world = new Container();
  app.stage.addChild(world);
  
  // Enable panning
  let isDragging = false;
  let lastPosition = { x: 0, y: 0 };
  
  app.canvas.addEventListener('pointerdown', (e) => {
    if (e.target === app.canvas) {
      isDragging = true;
      lastPosition = { x: e.clientX, y: e.clientY };
    }
  });
  
  app.canvas.addEventListener('pointermove', (e) => {
    if (isDragging) {
      const dx = e.clientX - lastPosition.x;
      const dy = e.clientY - lastPosition.y;
      world.x += dx;
      world.y += dy;
      lastPosition = { x: e.clientX, y: e.clientY };
    }
  });
  
  app.canvas.addEventListener('pointerup', () => {
    isDragging = false;
  });
  
  return { app, world };
}
```

#### Day 3-4: KO Sprite Class

```typescript
// lens/src/lib/KOSprite.ts
import { Container, Graphics, Text } from 'pixi.js';
import type { KO, KOPhysics } from './types';

export class KOSprite extends Container {
  private bg: Graphics;
  private title: Text;
  private ko: KO;
  private physics: KOPhysics;
  
  constructor(ko: KO, physics: KOPhysics) {
    super();
    this.ko = ko;
    this.physics = physics;
    
    // Background card
    this.bg = new Graphics();
    this.drawCard();
    this.addChild(this.bg);
    
    // Title text
    this.title = new Text({
      text: ko.title,
      style: {
        fontFamily: 'Charter, Georgia, serif',
        fontSize: 14,
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: 180,
      }
    });
    this.title.x = 10;
    this.title.y = 10;
    this.addChild(this.title);
    
    // Position from physics
    this.x = physics.position_x;
    this.y = physics.position_y;
    
    // Make interactive
    this.eventMode = 'static';
    this.cursor = 'grab';
    
    this.on('pointerdown', this.onDragStart, this);
    this.on('pointerup', this.onDragEnd, this);
    this.on('pointerupoutside', this.onDragEnd, this);
  }
  
  private drawCard() {
    const alpha = Math.max(0.3, 1 - this.physics.entropy * 0.5);
    this.bg.clear();
    this.bg.roundRect(0, 0, 200, 80, 8);
    this.bg.fill({ color: 0x1a1a1a, alpha });
    this.bg.stroke({ color: 0x333333, width: 1, alpha });
  }
  
  private onDragStart(event: any) {
    this.cursor = 'grabbing';
    this.alpha = 0.8;
    // Start drag...
  }
  
  private onDragEnd() {
    this.cursor = 'grab';
    this.alpha = 1;
    // End drag, save new position...
  }
  
  update(dt: number) {
    // Apply entropy shimmer
    if (this.physics.entropy > 0.5) {
      this.x += (Math.random() - 0.5) * this.physics.entropy * 0.5;
      this.y += (Math.random() - 0.5) * this.physics.entropy * 0.5;
    }
  }
}
```

#### Day 5: Load KOs from Bridge

```typescript
// lens/src/lib/api.ts
const API_URL = 'http://localhost:3333';
const WS_URL = 'ws://localhost:3333/ws';

export async function fetchKOs() {
  const res = await fetch(`${API_URL}/api/kos`);
  return res.json();
}

export async function fetchPhysics() {
  const res = await fetch(`${API_URL}/api/physics`);
  return res.json();
}

export function connectWebSocket(onMessage: (data: any) => void) {
  const ws = new WebSocket(WS_URL);
  ws.onmessage = (e) => onMessage(JSON.parse(e.data));
  return ws;
}

// lens/src/App.svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { createCanvas } from './lib/canvas';
  import { KOSprite } from './lib/KOSprite';
  import { fetchKOs, fetchPhysics, connectWebSocket } from './lib/api';

  let container: HTMLElement;
  let world: Container;
  let sprites: Map<string, KOSprite> = new Map();

  onMount(async () => {
    const { app, world: w } = await createCanvas(container);
    world = w;
    
    // Load initial data
    const [kos, physics] = await Promise.all([
      fetchKOs(),
      fetchPhysics()
    ]);
    
    const physicsMap = new Map(physics.map(p => [p.ko_id, p]));
    
    for (const ko of kos) {
      const p = physicsMap.get(ko.id) || defaultPhysics(ko.id);
      const sprite = new KOSprite(ko, p);
      sprites.set(ko.id, sprite);
      world.addChild(sprite);
    }
    
    // WebSocket for real-time updates
    connectWebSocket((data) => {
      if (data.type === 'file:created') {
        // Add new sprite
      } else if (data.type === 'file:changed') {
        // Update existing sprite
      } else if (data.type === 'file:deleted') {
        // Remove sprite
      }
    });
    
    // Animation loop
    app.ticker.add((ticker) => {
      for (const sprite of sprites.values()) {
        sprite.update(ticker.deltaMS);
      }
    });
  });
</script>

<div bind:this={container} class="canvas-container"></div>

<style>
  .canvas-container {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #0a0a0a;
  }
</style>
```

### Week 4: Physics + Drag

#### Day 1-2: matter.js Integration

```typescript
// lens/src/lib/physics.ts
import Matter from 'matter-js';

const { Engine, World, Bodies, Body, Events } = Matter;

export function createPhysicsEngine() {
  const engine = Engine.create({
    gravity: { x: 0, y: 0 } // No gravity, we use semantic gravity
  });
  
  return engine;
}

export function createKOBody(id: string, x: number, y: number, mass: number) {
  const body = Bodies.rectangle(x, y, 200, 80, {
    friction: 0.1,
    frictionAir: 0.05,
    restitution: 0.3,
    mass,
    label: id,
  });
  
  return body;
}

export function applyStochasticDrift(body: Body, entropy: number, dt: number) {
  // Random force based on entropy
  const force = {
    x: (Math.random() - 0.5) * entropy * 0.0001 * dt,
    y: (Math.random() - 0.5) * entropy * 0.0001 * dt,
  };
  Body.applyForce(body, body.position, force);
}
```

#### Day 3-4: Drag with Springs

```typescript
// lens/src/lib/spring.ts
export class Spring {
  current: number;
  target: number;
  velocity: number = 0;
  stiffness: number;
  damping: number;
  
  constructor(initial: number, stiffness = 170, damping = 26) {
    this.current = initial;
    this.target = initial;
    this.stiffness = stiffness;
    this.damping = damping;
  }
  
  update(dt: number) {
    const force = (this.target - this.current) * this.stiffness;
    const damping = this.velocity * this.damping;
    const acceleration = force - damping;
    
    this.velocity += acceleration * dt / 1000;
    this.current += this.velocity * dt / 1000;
    
    return this.current;
  }
  
  setTarget(value: number) {
    this.target = value;
  }
}

// Update KOSprite to use springs for drag
class KOSprite {
  private springX: Spring;
  private springY: Spring;
  private isDragging = false;
  
  onDragStart(event: any) {
    this.isDragging = true;
    // Disable springs during drag
  }
  
  onDragMove(event: any) {
    if (this.isDragging) {
      // Direct position update
      this.x = event.global.x;
      this.y = event.global.y;
    }
  }
  
  onDragEnd() {
    this.isDragging = false;
    // Re-enable springs, they'll settle to physics position
    this.springX.setTarget(this.physicsBody.position.x);
    this.springY.setTarget(this.physicsBody.position.y);
  }
  
  update(dt: number) {
    if (!this.isDragging) {
      this.x = this.springX.update(dt);
      this.y = this.springY.update(dt);
    }
  }
}
```

#### Day 5: Save Position on Drag End

```typescript
// When drag ends, persist to bridge
async function onDragEnd(koId: string, x: number, y: number) {
  await fetch(`${API_URL}/api/physics/${koId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ position_x: x, position_y: y }),
  });
}
```

### Phase 2 Deliverables
- [ ] PixiJS canvas with pan/zoom
- [ ] KOs rendered as styled cards
- [ ] Drag interaction with physics
- [ ] Spring animations for smooth movement
- [ ] Entropy shimmer effect
- [ ] Position persisted on drag end
- [ ] Real-time sync via WebSocket

---

## Phase 3: Core Mechanics (Week 5-6)

### Goals
- Collision detection between KOs
- Synthesis UI for creating connections
- Stochastic drift simulation
- Bridge Note generation

### Week 5: Collision + Synthesis

#### Day 1-2: Collision Detection

```typescript
// lens/src/lib/collision.ts
import Matter from 'matter-js';

export function setupCollisionDetection(
  engine: Matter.Engine,
  onCollision: (idA: string, idB: string) => void
) {
  Matter.Events.on(engine, 'collisionStart', (event) => {
    for (const pair of event.pairs) {
      const idA = pair.bodyA.label;
      const idB = pair.bodyB.label;
      onCollision(idA, idB);
    }
  });
}

// Track active collisions
const activeCollisions = new Map<string, { idA: string, idB: string, startTime: number }>();

function onCollision(idA: string, idB: string) {
  const key = [idA, idB].sort().join(':');
  
  if (!activeCollisions.has(key)) {
    activeCollisions.set(key, {
      idA,
      idB,
      startTime: Date.now(),
    });
    
    // Show collision UI after short delay (to filter drive-bys)
    setTimeout(() => {
      if (activeCollisions.has(key)) {
        showCollisionPrompt(idA, idB);
      }
    }, 500);
  }
}
```

#### Day 3-4: Collision Prompt UI

```svelte
<!-- lens/src/lib/CollisionPrompt.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let koA: KO;
  export let koB: KO;
  export let position: { x: number, y: number };
  
  const dispatch = createEventDispatcher();
  let connection = '';
  
  function snap() {
    dispatch('snap', { koA, koB, connection });
  }
  
  function dismiss() {
    dispatch('dismiss', { koA, koB });
  }
  
  function ignore() {
    dispatch('ignore', { koA, koB });
  }
</script>

<div 
  class="collision-prompt" 
  style="left: {position.x}px; top: {position.y}px"
>
  <div class="prompt-header">
    <span class="title-a">{koA.title}</span>
    <span class="connector">↔</span>
    <span class="title-b">{koB.title}</span>
  </div>
  
  <input 
    type="text" 
    bind:value={connection}
    placeholder="What connects these?"
    on:keydown={(e) => e.key === 'Enter' && snap()}
  />
  
  <div class="actions">
    <button class="snap" on:click={snap} disabled={!connection}>
      Snap
    </button>
    <button class="dismiss" on:click={dismiss}>
      Dismiss
    </button>
    <button class="ignore" on:click={ignore}>
      Ignore
    </button>
  </div>
</div>

<style>
  .collision-prompt {
    position: absolute;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 16px;
    min-width: 300px;
    z-index: 100;
    transform: translate(-50%, -50%);
  }
  
  .prompt-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-family: 'Charter', serif;
  }
  
  input {
    width: 100%;
    padding: 8px;
    background: #0a0a0a;
    border: 1px solid #333;
    border-radius: 4px;
    color: white;
    font-family: 'Charter', serif;
  }
  
  .actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }
  
  button {
    flex: 1;
    padding: 8px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
  }
  
  .snap {
    background: #2d5a27;
    color: white;
  }
  
  .dismiss {
    background: #5a2727;
    color: white;
  }
  
  .ignore {
    background: #333;
    color: #888;
  }
</style>
```

#### Day 5: Bridge Note Creation

```typescript
// bridge/src/synthesis.ts
import { writeFile } from 'fs/promises';
import { ulid } from 'ulid';

export async function createBridgeNote(
  vaultPath: string,
  koA: KO,
  koB: KO,
  connection: string
) {
  const id = ulid();
  const now = new Date().toISOString();
  
  const content = `---
id: ${id}
title: "${connection}"
type: synthesis
created: ${now}
parents:
  - ${koA.id}
  - ${koB.id}
---

# ${connection}

This synthesis connects:
- [[${koA.title}]]
- [[${koB.title}]]

---

*Created through collision on ${now}*
`;

  const filename = `${id.slice(0, 8)}-${slugify(connection)}.md`;
  await writeFile(`${vaultPath}/${filename}`, content);
  
  // Create links in database
  createLink(db, koA.id, id, 'collision');
  createLink(db, koB.id, id, 'collision');
  
  // Update memory: increment collision count, add affinity
  recordCollision(db, koA.id, koB.id, 'synthesis');
  
  return id;
}
```

### Week 6: Drift + Random Injection

#### Day 1-2: Server-Side Drift Simulation

```typescript
// bridge/src/drift.ts
import Matter from 'matter-js';

let engine: Matter.Engine;
let bodies: Map<string, Matter.Body> = new Map();

export function initDriftSimulation(db: Database) {
  engine = Matter.Engine.create({
    gravity: { x: 0, y: 0 }
  });
  
  // Load all physics states
  const physicsStates = getAllPhysics(db);
  const memories = getAllMemory(db);
  
  for (const p of physicsStates) {
    const memory = memories.find(m => m.ko_id === p.ko_id);
    const traits = JSON.parse(memory?.behavioral_traits || '{}');
    
    const body = Matter.Bodies.rectangle(
      p.position_x,
      p.position_y,
      200, 80,
      {
        friction: 0.1,
        frictionAir: 0.02 * (traits.stable ? 2 : 1) * (traits.restless ? 0.5 : 1),
        mass: p.mass,
        label: p.ko_id,
      }
    );
    
    bodies.set(p.ko_id, body);
    Matter.World.add(engine.world, body);
  }
}

export function tickDrift(dt: number) {
  // Apply stochastic forces to all bodies
  for (const [id, body] of bodies) {
    const physics = getPhysics(db, id);
    const memory = getMemory(db, id);
    const traits = JSON.parse(memory?.behavioral_traits || '{}');
    
    // Base random drift
    let noiseScale = physics.entropy * 0.00005;
    
    // Trait modifiers
    if (traits.restless) noiseScale *= 2;
    if (traits.stable) noiseScale *= 0.3;
    if (traits.volatile) noiseScale *= 1.5 + Math.random();
    
    const force = {
      x: (Math.random() - 0.5) * noiseScale * dt,
      y: (Math.random() - 0.5) * noiseScale * dt,
    };
    
    Matter.Body.applyForce(body, body.position, force);
  }
  
  // Step physics
  Matter.Engine.update(engine, dt);
  
  // Save positions to database periodically
  // (batch update every few seconds, not every frame)
}

// Run drift in background
setInterval(() => {
  tickDrift(100); // 100ms ticks
}, 100);

// Persist positions every 5 seconds
setInterval(() => {
  for (const [id, body] of bodies) {
    updatePhysics(db, id, {
      position_x: body.position.x,
      position_y: body.position.y,
      velocity_x: body.velocity.x,
      velocity_y: body.velocity.y,
    });
  }
  broadcast({ type: 'physics:update', positions: getAllPhysics(db) });
}, 5000);
```

#### Day 3-4: Random Endpoint Enhancement

```typescript
// bridge/src/random.ts
export function getRandomKOs(db: Database, n: number): KO[] {
  // Pure random selection
  const stmt = db.prepare(`
    SELECT * FROM kos
    ORDER BY RANDOM()
    LIMIT ?
  `);
  return stmt.all(n);
}

export function getStrangers(db: Database, anchorId: string, n: number): KO[] {
  // Get KOs that are NOT linked to anchor and have low affinity
  const stmt = db.prepare(`
    SELECT k.* FROM kos k
    LEFT JOIN links l ON (l.source_id = ? AND l.target_id = k.id) 
                      OR (l.target_id = ? AND l.source_id = k.id)
    LEFT JOIN ko_memory m ON m.ko_id = k.id
    WHERE k.id != ?
      AND l.source_id IS NULL
    ORDER BY RANDOM()
    LIMIT ?
  `);
  return stmt.all(anchorId, anchorId, anchorId, n);
}

export function getRelatives(db: Database, anchorId: string, n: number): KO[] {
  // Get linked or high-affinity KOs
  const stmt = db.prepare(`
    SELECT k.* FROM kos k
    JOIN links l ON (l.source_id = ? AND l.target_id = k.id) 
                 OR (l.target_id = ? AND l.source_id = k.id)
    WHERE k.id != ?
    ORDER BY RANDOM()
    LIMIT ?
  `);
  return stmt.all(anchorId, anchorId, anchorId, n);
}
```

#### Day 5: Particle Accelerator Mode

```svelte
<!-- lens/src/lib/Accelerator.svelte -->
<script lang="ts">
  import { fetchKO, getRelatives, getStrangers } from './api';
  
  export let anchorId: string;
  
  let anchor: KO;
  let relatives: KO[] = [];
  let strangers: KO[] = [];
  let active = false;
  
  async function start() {
    anchor = await fetchKO(anchorId);
    relatives = await getRelatives(anchorId, 3);
    strangers = await getStrangers(anchorId, 3);
    
    // Position all 7 with high velocity
    const all = [anchor, ...relatives, ...strangers];
    for (let i = 0; i < all.length; i++) {
      const angle = (i / all.length) * Math.PI * 2;
      const radius = 300;
      
      setPhysics(all[i].id, {
        position_x: Math.cos(angle) * radius,
        position_y: Math.sin(angle) * radius,
        velocity_x: (Math.random() - 0.5) * 10,
        velocity_y: (Math.random() - 0.5) * 10,
      });
    }
    
    active = true;
  }
</script>

{#if !active}
  <button on:click={start}>Start Accelerator</button>
{:else}
  <div class="accelerator-ui">
    <div class="legend">
      <span class="anchor">Anchor: {anchor.title}</span>
      <span class="relatives">Relatives: {relatives.length}</span>
      <span class="strangers">Strangers: {strangers.length}</span>
    </div>
    <p>Find a connection between the anchor and a stranger!</p>
  </div>
{/if}
```

### Phase 3 Deliverables
- [ ] Collision detection between KOs
- [ ] Collision prompt UI (snap/dismiss/ignore)
- [ ] Bridge Note creation on snap
- [ ] Affinity/rivalry tracking in memory
- [ ] Server-side drift simulation with noise
- [ ] Random + Stranger endpoints
- [ ] Basic Particle Accelerator mode

---

## Phase 4: First Playable (Week 7-8)

### Goals
- Observation tracking
- Basic trait computation
- Visual polish
- End-to-end testing
- First external playtest

### Week 7: Memory + Traits

#### Day 1-2: Observation Tracking

```typescript
// bridge/src/memory.ts
export function recordObservation(db: Database, koId: string, durationMs: number) {
  const stmt = db.prepare(`
    UPDATE ko_memory SET
      observation_count = observation_count + 1,
      last_observed = ?,
      total_observation_time = total_observation_time + ?
    WHERE ko_id = ?
  `);
  stmt.run(new Date().toISOString(), durationMs, koId);
  
  // Decrease entropy
  const physics = db.prepare(`
    UPDATE ko_physics SET
      entropy = MAX(0.1, entropy - 0.05),
      mass = mass + 0.01
    WHERE ko_id = ?
  `);
  physics.run(koId);
  
  // Recompute traits
  recomputeTraits(db, koId);
}

export function recordCollision(
  db: Database, 
  koIdA: string, 
  koIdB: string, 
  outcome: 'synthesis' | 'dismiss' | 'ignore'
) {
  // Update collision counts
  const stmt = db.prepare(`
    UPDATE ko_memory SET
      collision_count = collision_count + 1
    WHERE ko_id IN (?, ?)
  `);
  stmt.run(koIdA, koIdB);
  
  // Update affinities/rivalries
  if (outcome === 'synthesis') {
    updateAffinity(db, koIdA, koIdB, 0.1);
    updateAffinity(db, koIdB, koIdA, 0.1);
  } else if (outcome === 'dismiss') {
    updateRivalry(db, koIdA, koIdB, 0.1);
    updateRivalry(db, koIdB, koIdA, 0.1);
  }
  
  // Recompute traits
  recomputeTraits(db, koIdA);
  recomputeTraits(db, koIdB);
}
```

#### Day 3-4: Trait Computation

```typescript
// bridge/src/traits.ts
interface Traits {
  restless: boolean;
  stable: boolean;
  magnetic: boolean;
  volatile: boolean;
  forgotten: boolean;
  ancient: boolean;
}

export function computeTraits(memory: KOMemory, physics: KOPhysics): Traits {
  const daysSinceObserved = memory.last_observed
    ? (Date.now() - new Date(memory.last_observed).getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;
  
  const affinities = JSON.parse(memory.affinity_scores || '{}');
  const rivalries = JSON.parse(memory.rivalry_scores || '{}');
  
  const affinityCount = Object.keys(affinities).length;
  const rivalryCount = Object.keys(rivalries).length;
  const linkCount = affinityCount; // Approximation
  
  return {
    restless: memory.observation_count < 3 && memory.drift_distance > 500,
    stable: memory.observation_count > 10 && linkCount > 3,
    magnetic: affinityCount > 5,
    volatile: rivalryCount > 3,
    forgotten: daysSinceObserved > 30,
    ancient: memory.observation_count > 20 && physics.mass > 2,
  };
}

export function recomputeTraits(db: Database, koId: string) {
  const memory = getMemory(db, koId);
  const physics = getPhysics(db, koId);
  const traits = computeTraits(memory, physics);
  
  const stmt = db.prepare(`
    UPDATE ko_memory SET behavioral_traits = ? WHERE ko_id = ?
  `);
  stmt.run(JSON.stringify(traits), koId);
}
```

#### Day 5: Trait Visualization

```typescript
// lens/src/lib/KOSprite.ts
class KOSprite {
  updateFromTraits(traits: Traits) {
    // Visual modifiers based on traits
    
    if (traits.forgotten) {
      this.alpha = 0.4;
      this.filters = [new BlurFilter(1)];
    }
    
    if (traits.ancient) {
      // Golden border
      this.bg.stroke({ color: 0xd4af37, width: 2 });
    }
    
    if (traits.volatile) {
      // Add spark particles occasionally
      if (Math.random() < 0.02) {
        this.emitSpark();
      }
    }
    
    if (traits.magnetic) {
      // Soft glow
      this.filters = [new GlowFilter({ color: 0x4488ff, strength: 0.3 })];
    }
  }
  
  update(dt: number) {
    // Different motion patterns per trait
    if (this.traits.restless) {
      // Faster, more erratic movement
      this.noiseScale = 2;
    } else if (this.traits.stable) {
      this.noiseScale = 0.3;
    }
    
    // Apply noise
    this.x += (Math.random() - 0.5) * this.noiseScale;
    this.y += (Math.random() - 0.5) * this.noiseScale;
  }
}
```

### Week 8: Polish + Playtest

#### Day 1-2: Visual Polish

- [ ] Dark theme refinement (#0a0a0a background)
- [ ] Typography: Charter for content, JetBrains Mono for metadata
- [ ] Smooth fade-in on canvas load
- [ ] Connection lines between linked KOs
- [ ] Void visualization (gaps in clusters)
- [ ] Entropy shimmer effect tuning

#### Day 3: Performance Optimization

- [ ] Sprite pooling for 1000+ KOs
- [ ] Viewport culling (don't render off-screen)
- [ ] Batched physics updates
- [ ] Debounced position saves

#### Day 4: End-to-End Testing

- [ ] Create 50 test markdown files
- [ ] Verify all sync correctly to database
- [ ] Test collision → synthesis → bridge note flow
- [ ] Test observation tracking
- [ ] Test trait computation
- [ ] Test Accelerator mode with strangers

#### Day 5: First Playtest

- [ ] Deploy to test environment
- [ ] Get 2-3 people to use for 30 minutes each
- [ ] Observe: Do collisions feel satisfying?
- [ ] Observe: Does drift feel right?
- [ ] Observe: Are surprises happening?
- [ ] Collect feedback and prioritize fixes

### Phase 4 Deliverables
- [ ] Observation tracking with entropy decay
- [ ] Trait computation (all 6 traits)
- [ ] Trait visualizations
- [ ] Polished dark UI
- [ ] Performance handles 1000+ KOs
- [ ] End-to-end flow working
- [ ] **First external playtest completed**

---

## Phase 5: Agency System (Week 9-12)

### Goals
- Semantic gravity (vector embeddings)
- Autonomous behaviors
- Evolution history
- Ecosystem visualization

### Week 9-10: Vector Embeddings

#### Setup ONNX Runtime

```typescript
// bridge/src/vectors.ts
import * as ort from 'onnxruntime-node';
import { readFile } from 'fs/promises';

let session: ort.InferenceSession;

export async function initEmbeddings() {
  // Download all-MiniLM-L6-v2 ONNX model
  session = await ort.InferenceSession.create('./models/all-MiniLM-L6-v2.onnx');
}

export async function embed(text: string): Promise<number[]> {
  // Tokenize (simplified - use actual tokenizer)
  const inputIds = tokenize(text);
  
  const feeds = {
    input_ids: new ort.Tensor('int64', inputIds, [1, inputIds.length]),
    attention_mask: new ort.Tensor('int64', new Array(inputIds.length).fill(1), [1, inputIds.length]),
  };
  
  const results = await session.run(feeds);
  const embeddings = results['last_hidden_state'].data;
  
  // Mean pooling
  return meanPool(embeddings, inputIds.length);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

#### Add sqlite-vec

```typescript
// bridge/src/db.ts
import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';

export function initDB(path: string) {
  const db = new Database(path);
  sqliteVec.load(db);
  
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS ko_vectors USING vec0(
      id TEXT PRIMARY KEY,
      embedding FLOAT[384]
    );
  `);
  
  return db;
}

export function upsertVector(db: Database, koId: string, embedding: number[]) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO ko_vectors (id, embedding) VALUES (?, ?)
  `);
  stmt.run(koId, JSON.stringify(embedding));
}

export function findSimilar(db: Database, koId: string, k: number) {
  const stmt = db.prepare(`
    SELECT id, distance
    FROM ko_vectors
    WHERE id != ?
    ORDER BY embedding <-> (SELECT embedding FROM ko_vectors WHERE id = ?)
    LIMIT ?
  `);
  return stmt.all(koId, koId, k);
}
```

### Week 11: Semantic Gravity

```typescript
// bridge/src/gravity.ts
export function computeSemanticForces(db: Database): Map<string, Vector2D> {
  const forces = new Map<string, Vector2D>();
  const kos = getAllKOs(db);
  const physics = getAllPhysics(db);
  
  for (const ko of kos) {
    const similar = findSimilar(db, ko.id, 10);
    const myPhysics = physics.find(p => p.ko_id === ko.id);
    
    let fx = 0, fy = 0;
    
    for (const { id: otherId, distance } of similar) {
      const otherPhysics = physics.find(p => p.ko_id === otherId);
      if (!otherPhysics) continue;
      
      const dx = otherPhysics.position_x - myPhysics.position_x;
      const dy = otherPhysics.position_y - myPhysics.position_y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 1) continue;
      
      // Attraction based on similarity (1 - distance)
      const similarity = 1 - distance;
      
      // But if too similar, repel (the void mechanic)
      let force: number;
      if (similarity > 0.9) {
        force = -0.0001; // Repel near-duplicates
      } else {
        force = similarity * 0.00005; // Attract similar
      }
      
      fx += (dx / dist) * force;
      fy += (dy / dist) * force;
    }
    
    forces.set(ko.id, { x: fx, y: fy });
  }
  
  return forces;
}

// Integrate into drift tick
export function tickDrift(dt: number) {
  const semanticForces = computeSemanticForces(db);
  
  for (const [id, body] of bodies) {
    // Random drift force
    const noise = getNoiseForce(id, dt);
    
    // Semantic gravity force
    const gravity = semanticForces.get(id) || { x: 0, y: 0 };
    
    // Combined force
    const force = {
      x: noise.x + gravity.x * dt,
      y: noise.y + gravity.y * dt,
    };
    
    Matter.Body.applyForce(body, body.position, force);
  }
  
  Matter.Engine.update(engine, dt);
}
```

### Week 12: Autonomous Behaviors + Visualization

```typescript
// bridge/src/autonomous.ts
export function processAutonomousBehaviors(db: Database) {
  const memories = getAllMemory(db);
  
  for (const memory of memories) {
    const traits = JSON.parse(memory.behavioral_traits || '{}');
    
    if (traits.restless) {
      // Seek collisions: move toward nearest non-linked KO
      const strangers = getStrangers(db, memory.ko_id, 1);
      if (strangers.length > 0) {
        applySeekingForce(memory.ko_id, strangers[0].id, 0.0001);
      }
    }
    
    if (traits.volatile) {
      // Sometimes cause chain reactions
      if (Math.random() < 0.01) {
        const nearby = getNearbyKOs(db, memory.ko_id, 200);
        for (const ko of nearby) {
          applyImpulse(ko.id, randomDirection(), 0.5);
        }
      }
    }
    
    if (traits.forgotten) {
      // Slowly drift toward edges
      const physics = getPhysics(db, memory.ko_id);
      const edgeForce = {
        x: Math.sign(physics.position_x) * 0.00001,
        y: Math.sign(physics.position_y) * 0.00001,
      };
      applyForce(memory.ko_id, edgeForce);
    }
  }
}

// Run periodically
setInterval(() => {
  processAutonomousBehaviors(db);
}, 1000);
```

```svelte
<!-- lens/src/lib/EcosystemView.svelte -->
<script lang="ts">
  // Zoomed-out view showing clusters, affinities, voids
  
  import { onMount } from 'svelte';
  
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  
  onMount(async () => {
    ctx = canvas.getContext('2d');
    const kos = await fetchKOs();
    const physics = await fetchPhysics();
    const memories = await fetchMemories();
    
    // Draw each KO as a dot
    for (const ko of kos) {
      const p = physics.find(x => x.ko_id === ko.id);
      const m = memories.find(x => x.ko_id === ko.id);
      const traits = JSON.parse(m?.behavioral_traits || '{}');
      
      // Size based on mass
      const radius = 3 + p.mass * 2;
      
      // Color based on traits
      let color = '#666';
      if (traits.ancient) color = '#d4af37';
      if (traits.forgotten) color = '#333';
      if (traits.volatile) color = '#ff4444';
      if (traits.magnetic) color = '#4488ff';
      
      ctx.beginPath();
      ctx.arc(p.position_x, p.position_y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    
    // Draw affinity lines
    for (const m of memories) {
      const affinities = JSON.parse(m.affinity_scores || '{}');
      const myPhysics = physics.find(x => x.ko_id === m.ko_id);
      
      for (const [otherId, score] of Object.entries(affinities)) {
        const otherPhysics = physics.find(x => x.ko_id === otherId);
        if (!otherPhysics) continue;
        
        ctx.beginPath();
        ctx.moveTo(myPhysics.position_x, myPhysics.position_y);
        ctx.lineTo(otherPhysics.position_x, otherPhysics.position_y);
        ctx.strokeStyle = `rgba(0, 255, 0, ${score * 0.5})`;
        ctx.stroke();
      }
    }
  });
</script>

<canvas bind:this={canvas} width={2000} height={2000} />
```

### Phase 5 Deliverables
- [ ] Vector embeddings generated for all KOs
- [ ] sqlite-vec for similarity search
- [ ] Semantic gravity in drift simulation
- [ ] Void mechanics (too-similar repels)
- [ ] Autonomous seeking behavior (restless)
- [ ] Autonomous avoidance (rivals)
- [ ] Chain reactions (volatile)
- [ ] Edge drift (forgotten)
- [ ] Ecosystem visualization view
- [ ] Evolution history tracking

---

## Post-Launch Priorities

### Performance & Scale
- [ ] Test with 10,000 KOs
- [ ] Implement viewport culling
- [ ] WebWorker for physics
- [ ] IndexedDB cache on client

### Features
- [ ] Full-text search UI
- [ ] Ledger view (text editor)
- [ ] Graph view (explicit links)
- [ ] Import from Obsidian/Roam
- [ ] Export functionality

### Agency Enhancements
- [ ] Splitting behavior
- [ ] Merging behavior
- [ ] "Calling" audio cues
- [ ] Rebellion clusters

---

## Success Metrics

### First Playable (Week 8)
- [ ] 3 playtesters complete 30-minute sessions
- [ ] At least 1 "surprise" collision per session
- [ ] Collision → synthesis flow takes < 10 seconds
- [ ] No crashes or data loss

### Full Release (Week 12)
- [ ] 10 playtesters use for 1 week each
- [ ] Average 5+ collisions per session
- [ ] Users report "unexpected discoveries"
- [ ] Canvas feels "alive" when returning after absence
- [ ] 60fps with 1000 KOs

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Physics performance with 1000+ objects | Spatial partitioning, lower tick rate, LOD |
| Vector embedding speed | Cache embeddings, batch processing, smaller model |
| File watcher edge cases | Debouncing, checksums, recovery mode |
| Collision fatigue (too many prompts) | Cooldown timers, proximity thresholds |
| Drift too fast/slow | Expose tuning parameters, playtest early |

---

## Dependencies

### Runtime
- Bun 1.1+ or Node.js 22
- SQLite 3.45+

### Packages (Bridge)
```json
{
  "dependencies": {
    "hono": "^4.0.0",
    "@hono/node-ws": "^1.0.0",
    "better-sqlite3": "^9.0.0",
    "sqlite-vec": "^0.1.0",
    "chokidar": "^3.5.0",
    "ulid": "^2.3.0",
    "onnxruntime-node": "^1.16.0",
    "matter-js": "^0.19.0",
    "yaml": "^2.3.0"
  }
}
```

### Packages (Lens)
```json
{
  "dependencies": {
    "pixi.js": "^8.0.0",
    "matter-js": "^0.19.0"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^3.0.0",
    "svelte": "^5.0.0",
    "vite": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

*"A complex system that works is invariably found to have evolved from a simple system that worked."*  
— John Gall

**Start with the collision. Make it feel good. Everything else follows.**

