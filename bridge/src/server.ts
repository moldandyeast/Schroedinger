import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { 
  getAllKOs, 
  getKO, 
  upsertKO,
  deleteKO,
  getAllPhysics, 
  getPhysics, 
  updatePhysics,
  getMemory,
  getAllMemory,
  recordObservation,
  recordCollision,
  createLink,
  deleteLink,
  getAllLinks,
  getRandomKOs,
  getOrphans,
  getForgotten,
  getStrangers,
  getRelatives,
  initPhysics,
  initMemory,
  findSimilar,
  getSimilarity,
  getAllSimilarities,
  searchKOs,
} from './db.js';
import { generateMarkdown, generateSynthesis } from './parser.js';
import type { WSMessage } from './types.js';

// WebSocket clients
const wsClients = new Set<{ send: (data: string) => void }>();

/**
 * Broadcast a message to all connected WebSocket clients
 */
export function broadcast(message: WSMessage): void {
  const json = JSON.stringify(message);
  for (const client of wsClients) {
    try {
      client.send(json);
    } catch (e) {
      console.error('Failed to send to client:', e);
      wsClients.delete(client);
    }
  }
}

/**
 * Create the Hono app with all routes
 */
export function createServer(vaultPath: string) {
  const app = new Hono();

  // Middleware
  app.use('*', cors());
  app.use('*', logger());

  // Health check
  app.get('/', (c) => c.json({ 
    name: 'Schroedinger Bridge',
    version: '0.1.0',
    status: 'running',
  }));

  // ============ KO Routes ============

  // List all KOs
  app.get('/api/kos', (c) => {
    const kos = getAllKOs();
    return c.json(kos);
  });

  // Get single KO with memory and physics
  app.get('/api/kos/:id', (c) => {
    const id = c.req.param('id');
    const ko = getKO(id);
    if (!ko) {
      return c.json({ error: 'Not found' }, 404);
    }
    
    const memory = getMemory(id);
    const physics = getPhysics(id);
    
    return c.json({ ...ko, memory, physics });
  });

  // Create new KO
  app.post('/api/kos', async (c) => {
    const body = await c.req.json();
    const { title, content, type, tags } = body;
    
    if (!title) {
      return c.json({ error: 'Title is required' }, 400);
    }
    
    const markdown = generateMarkdown({ title, content, type, tags });
    const filename = `${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}.md`;
    const filePath = join(vaultPath, filename);
    
    await writeFile(filePath, markdown, 'utf-8');
    
    // The file watcher will pick this up and add to DB
    // For immediate response, we can parse and return
    return c.json({ 
      message: 'Created',
      filename,
    }, 201);
  });

  // Update KO
  app.put('/api/kos/:id', async (c) => {
    const id = c.req.param('id');
    const ko = getKO(id);
    if (!ko) {
      return c.json({ error: 'Not found' }, 404);
    }
    
    const body = await c.req.json();
    const updatedKO = upsertKO({ ...ko, ...body, updated_at: new Date().toISOString() });
    
    // Write back to file
    const markdown = generateMarkdown(updatedKO);
    await writeFile(join(vaultPath, ko.file_path), markdown, 'utf-8');
    
    broadcast({ type: 'ko:updated', ko: updatedKO });
    return c.json(updatedKO);
  });

  // Delete KO
  app.delete('/api/kos/:id', async (c) => {
    const id = c.req.param('id');
    const ko = getKO(id);
    if (!ko) {
      return c.json({ error: 'Not found' }, 404);
    }
    
    // Delete file
    try {
      await unlink(join(vaultPath, ko.file_path));
    } catch (e) {
      console.warn('File already deleted:', ko.file_path);
    }
    
    deleteKO(id);
    broadcast({ type: 'ko:deleted', id });
    
    return c.json({ ok: true });
  });

  // ============ Discovery Routes ============

  // Random KOs
  app.get('/api/random', (c) => {
    const n = parseInt(c.req.query('n') || '5');
    const kos = getRandomKOs(n);
    return c.json(kos);
  });

  // Orphan KOs (no links)
  app.get('/api/orphans', (c) => {
    const kos = getOrphans();
    return c.json(kos);
  });

  // Forgotten KOs (not observed recently)
  app.get('/api/forgotten', (c) => {
    const days = parseInt(c.req.query('days') || '30');
    const kos = getForgotten(days);
    return c.json(kos);
  });

  // Strangers (unlinked to anchor)
  app.get('/api/strangers/:id', (c) => {
    const id = c.req.param('id');
    const n = parseInt(c.req.query('n') || '3');
    const kos = getStrangers(id, n);
    return c.json(kos);
  });

  // Relatives (linked to anchor)
  app.get('/api/relatives/:id', (c) => {
    const id = c.req.param('id');
    const n = parseInt(c.req.query('n') || '3');
    const kos = getRelatives(id, n);
    return c.json(kos);
  });

  // ============ Physics Routes ============

  // Get all physics
  app.get('/api/physics', (c) => {
    const physics = getAllPhysics();
    return c.json(physics);
  });

  // Get single physics
  app.get('/api/physics/:id', (c) => {
    const physics = getPhysics(c.req.param('id'));
    if (!physics) {
      return c.json({ error: 'Not found' }, 404);
    }
    return c.json(physics);
  });

  // Update physics
  app.put('/api/physics/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    updatePhysics(id, body);
    
    return c.json({ ok: true });
  });

  // Batch update physics (for drift simulation)
  app.put('/api/physics', async (c) => {
    const updates = await c.req.json() as Array<{ ko_id: string; [key: string]: any }>;
    
    for (const { ko_id, ...data } of updates) {
      updatePhysics(ko_id, data);
    }
    
    return c.json({ ok: true, count: updates.length });
  });

  // ============ Memory Routes ============

  // Get all memory
  app.get('/api/memory', (c) => {
    const memory = getAllMemory();
    return c.json(memory);
  });

  // Get single memory
  app.get('/api/memory/:id', (c) => {
    const memory = getMemory(c.req.param('id'));
    if (!memory) {
      return c.json({ error: 'Not found' }, 404);
    }
    return c.json(memory);
  });

  // Record observation
  app.post('/api/observe/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const duration = body.duration || 0;
    
    recordObservation(id, duration);
    broadcast({ type: 'ko:observed', id, duration });
    
    const memory = getMemory(id);
    const physics = getPhysics(id);
    
    return c.json({ memory, physics });
  });

  // Record collision
  app.post('/api/collision', async (c) => {
    const { koIdA, koIdB, outcome } = await c.req.json();
    
    if (!koIdA || !koIdB || !outcome) {
      return c.json({ error: 'koIdA, koIdB, and outcome are required' }, 400);
    }
    
    recordCollision(koIdA, koIdB, outcome);
    broadcast({ type: 'ko:collided', koIdA, koIdB, outcome });
    
    return c.json({ ok: true });
  });

  // ============ Synthesis Routes ============

  // Create synthesis (bridge note)
  app.post('/api/synthesis', async (c) => {
    const { koIdA, koIdB, connection } = await c.req.json();
    
    if (!koIdA || !koIdB || !connection) {
      return c.json({ error: 'koIdA, koIdB, and connection are required' }, 400);
    }
    
    const koA = getKO(koIdA);
    const koB = getKO(koIdB);
    
    if (!koA || !koB) {
      return c.json({ error: 'One or both KOs not found' }, 404);
    }
    
    // Generate synthesis markdown
    const synthesis = generateSynthesis(
      connection,
      { id: koA.id, title: koA.title },
      { id: koB.id, title: koB.title }
    );
    
    // Write to vault
    const filePath = join(vaultPath, synthesis.filename);
    await writeFile(filePath, synthesis.content, 'utf-8');
    
    // Record collision as synthesis
    recordCollision(koIdA, koIdB, 'synthesis');
    
    // Create links
    createLink(koIdA, synthesis.id, 'collision');
    createLink(koIdB, synthesis.id, 'collision');
    
    broadcast({ 
      type: 'synthesis:created', 
      synthesisId: synthesis.id,
      koIdA,
      koIdB,
      connection,
    });
    
    return c.json({ 
      id: synthesis.id,
      filename: synthesis.filename,
    }, 201);
  });

  // ============ Link Routes ============

  // Get all links
  app.get('/api/links', (c) => {
    const links = getAllLinks();
    return c.json(links);
  });

  // Create link
  app.post('/api/links', async (c) => {
    const { sourceId, targetId, linkType } = await c.req.json();
    
    if (!sourceId || !targetId) {
      return c.json({ error: 'sourceId and targetId are required' }, 400);
    }
    
    createLink(sourceId, targetId, linkType || 'explicit');
    broadcast({ type: 'link:created', sourceId, targetId, linkType });
    
    return c.json({ ok: true }, 201);
  });

  // Delete link
  app.delete('/api/links/:source/:target', (c) => {
    const sourceId = c.req.param('source');
    const targetId = c.req.param('target');
    
    const deleted = deleteLink(sourceId, targetId);
    if (deleted) {
      broadcast({ type: 'link:deleted', sourceId, targetId });
    }
    
    return c.json({ ok: deleted });
  });

  // ============ Accelerator Routes ============

  // Get accelerator set (anchor + relatives + strangers)
  app.get('/api/accelerator/:id', (c) => {
    const anchorId = c.req.param('id');
    const anchor = getKO(anchorId);
    
    if (!anchor) {
      return c.json({ error: 'Anchor not found' }, 404);
    }
    
    const relatives = getRelatives(anchorId, 3);
    const strangers = getStrangers(anchorId, 3);
    
    return c.json({
      anchor,
      relatives,
      strangers,
    });
  });

  // ============ Similarity Routes ============

  // Find similar KOs
  app.get('/api/similar/:id', (c) => {
    const id = c.req.param('id');
    const n = parseInt(c.req.query('n') || '5');
    const similar = findSimilar(id, n);
    
    // Enrich with full KO data
    const enriched = similar.map(({ id: koId, similarity }) => {
      const ko = getKO(koId);
      return { ko, similarity };
    }).filter(item => item.ko !== null);
    
    return c.json(enriched);
  });

  // Get similarity between two KOs
  app.get('/api/similarity/:idA/:idB', (c) => {
    const idA = c.req.param('idA');
    const idB = c.req.param('idB');
    const similarity = getSimilarity(idA, idB);
    return c.json({ similarity });
  });

  // Get all similarities (for physics simulation)
  app.get('/api/similarities', (c) => {
    const similarities = getAllSimilarities();
    
    // Convert to JSON-serializable format
    const result: Record<string, Record<string, number>> = {};
    for (const [id, sims] of similarities) {
      result[id] = Object.fromEntries(sims);
    }
    
    return c.json(result);
  });

  // ============ Search Routes ============

  // Full-text search
  app.get('/api/search', (c) => {
    const q = c.req.query('q') || '';
    const limit = parseInt(c.req.query('limit') || '20');
    
    if (!q.trim()) {
      return c.json([]);
    }
    
    const results = searchKOs(q, limit);
    return c.json(results);
  });

  return app;
}

/**
 * Register a WebSocket client
 */
export function registerWSClient(client: { send: (data: string) => void }): void {
  wsClients.add(client);
  console.log(`🔌 WebSocket client connected (${wsClients.size} total)`);
}

/**
 * Unregister a WebSocket client
 */
export function unregisterWSClient(client: { send: (data: string) => void }): void {
  wsClients.delete(client);
  console.log(`🔌 WebSocket client disconnected (${wsClients.size} remaining)`);
}

