import Database from 'better-sqlite3';
import type { KO, KOMemory, KOPhysics, Link, Traits } from './types.js';
import { embed, cosineSimilarity, isEmbeddingsAvailable } from './embeddings.js';

let db: Database.Database;

export function initDB(dbPath: string): Database.Database {
  db = new Database(dbPath);
  
  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL');
  
  // Create schema
  db.exec(`
    -- Core knowledge objects
    CREATE TABLE IF NOT EXISTS kos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      type TEXT DEFAULT 'fragment' CHECK(type IN ('fragment', 'synthesis', 'observation')),
      tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      file_path TEXT NOT NULL UNIQUE
    );

    -- Explicit links between KOs
    CREATE TABLE IF NOT EXISTS links (
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      link_type TEXT DEFAULT 'explicit' CHECK(link_type IN ('explicit', 'collision', 'agent')),
      created_at TEXT NOT NULL,
      PRIMARY KEY (source_id, target_id),
      FOREIGN KEY (source_id) REFERENCES kos(id) ON DELETE CASCADE,
      FOREIGN KEY (target_id) REFERENCES kos(id) ON DELETE CASCADE
    );

    -- Object memory and behavior (the agency system)
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
      evolution_history TEXT DEFAULT '[]',
      FOREIGN KEY (ko_id) REFERENCES kos(id) ON DELETE CASCADE
    );

    -- Physics state (persisted between sessions)
    CREATE TABLE IF NOT EXISTS ko_physics (
      ko_id TEXT PRIMARY KEY,
      position_x REAL DEFAULT 0,
      position_y REAL DEFAULT 0,
      velocity_x REAL DEFAULT 0,
      velocity_y REAL DEFAULT 0,
      mass REAL DEFAULT 1.0,
      entropy REAL DEFAULT 1.0,
      is_anchored INTEGER DEFAULT 0,
      FOREIGN KEY (ko_id) REFERENCES kos(id) ON DELETE CASCADE
    );

    -- Indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_kos_type ON kos(type);
    CREATE INDEX IF NOT EXISTS idx_kos_updated ON kos(updated_at);
    CREATE INDEX IF NOT EXISTS idx_kos_file_path ON kos(file_path);
    CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_id);
    CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_id);
    CREATE INDEX IF NOT EXISTS idx_memory_last_observed ON ko_memory(last_observed);
  `);
  
  return db;
}

export function getDB(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDB first.');
  }
  return db;
}

// ============ KO Operations ============

export function upsertKO(ko: Omit<KO, 'updated_at'> & { updated_at?: string }): KO {
  const now = new Date().toISOString();
  const updated = { ...ko, updated_at: ko.updated_at || now };
  
  const stmt = getDB().prepare(`
    INSERT INTO kos (id, title, content, content_hash, type, tags, created_at, updated_at, file_path)
    VALUES (@id, @title, @content, @content_hash, @type, @tags, @created_at, @updated_at, @file_path)
    ON CONFLICT(id) DO UPDATE SET
      title = @title,
      content = @content,
      content_hash = @content_hash,
      type = @type,
      tags = @tags,
      updated_at = @updated_at,
      file_path = @file_path
  `);
  
  stmt.run({
    ...updated,
    tags: JSON.stringify(updated.tags),
  });
  
  return updated as KO;
}

export function getKO(id: string): KO | null {
  const stmt = getDB().prepare('SELECT * FROM kos WHERE id = ?');
  const row = stmt.get(id) as any;
  if (!row) return null;
  return { ...row, tags: JSON.parse(row.tags) };
}

export function getKOByPath(filePath: string): KO | null {
  const stmt = getDB().prepare('SELECT * FROM kos WHERE file_path = ?');
  const row = stmt.get(filePath) as any;
  if (!row) return null;
  return { ...row, tags: JSON.parse(row.tags) };
}

export function getAllKOs(): KO[] {
  const stmt = getDB().prepare('SELECT * FROM kos ORDER BY updated_at DESC');
  const rows = stmt.all() as any[];
  return rows.map(row => ({ ...row, tags: JSON.parse(row.tags) }));
}

export function deleteKOByPath(filePath: string): boolean {
  const stmt = getDB().prepare('DELETE FROM kos WHERE file_path = ?');
  const result = stmt.run(filePath);
  return result.changes > 0;
}

export function deleteKO(id: string): boolean {
  const stmt = getDB().prepare('DELETE FROM kos WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export function getRandomKOs(n: number): KO[] {
  const stmt = getDB().prepare('SELECT * FROM kos ORDER BY RANDOM() LIMIT ?');
  const rows = stmt.all(n) as any[];
  return rows.map(row => ({ ...row, tags: JSON.parse(row.tags) }));
}

export function getOrphans(): KO[] {
  const stmt = getDB().prepare(`
    SELECT k.* FROM kos k
    LEFT JOIN links l ON k.id = l.source_id OR k.id = l.target_id
    WHERE l.source_id IS NULL
  `);
  const rows = stmt.all() as any[];
  return rows.map(row => ({ ...row, tags: JSON.parse(row.tags) }));
}

export function getForgotten(days: number): KO[] {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const stmt = getDB().prepare(`
    SELECT k.* FROM kos k
    JOIN ko_memory m ON k.id = m.ko_id
    WHERE m.last_observed IS NULL OR m.last_observed < ?
    ORDER BY m.last_observed ASC
  `);
  const rows = stmt.all(cutoff) as any[];
  return rows.map(row => ({ ...row, tags: JSON.parse(row.tags) }));
}

export function getStrangers(anchorId: string, n: number): KO[] {
  const stmt = getDB().prepare(`
    SELECT k.* FROM kos k
    LEFT JOIN links l ON (l.source_id = ? AND l.target_id = k.id) 
                      OR (l.target_id = ? AND l.source_id = k.id)
    WHERE k.id != ? AND l.source_id IS NULL
    ORDER BY RANDOM()
    LIMIT ?
  `);
  const rows = stmt.all(anchorId, anchorId, anchorId, n) as any[];
  return rows.map(row => ({ ...row, tags: JSON.parse(row.tags) }));
}

export function getRelatives(anchorId: string, n: number): KO[] {
  const stmt = getDB().prepare(`
    SELECT k.* FROM kos k
    JOIN links l ON (l.source_id = ? AND l.target_id = k.id) 
                 OR (l.target_id = ? AND l.source_id = k.id)
    WHERE k.id != ?
    ORDER BY RANDOM()
    LIMIT ?
  `);
  const rows = stmt.all(anchorId, anchorId, anchorId, n) as any[];
  return rows.map(row => ({ ...row, tags: JSON.parse(row.tags) }));
}

// ============ Physics Operations ============

export function initPhysics(koId: string, initialPosition?: { x: number; y: number }): void {
  const x = initialPosition?.x ?? (Math.random() - 0.5) * 1000;
  const y = initialPosition?.y ?? (Math.random() - 0.5) * 1000;
  
  const stmt = getDB().prepare(`
    INSERT OR IGNORE INTO ko_physics (ko_id, position_x, position_y, entropy)
    VALUES (?, ?, ?, 1.0)
  `);
  stmt.run(koId, x, y);
}

export function getPhysics(koId: string): KOPhysics | null {
  const stmt = getDB().prepare('SELECT * FROM ko_physics WHERE ko_id = ?');
  const row = stmt.get(koId) as any;
  if (!row) return null;
  return { ...row, is_anchored: Boolean(row.is_anchored) };
}

export function getAllPhysics(): KOPhysics[] {
  const stmt = getDB().prepare('SELECT * FROM ko_physics');
  const rows = stmt.all() as any[];
  return rows.map(row => ({ ...row, is_anchored: Boolean(row.is_anchored) }));
}

export function updatePhysics(koId: string, updates: Partial<Omit<KOPhysics, 'ko_id'>>): void {
  const fields: string[] = [];
  const values: any[] = [];
  
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(key === 'is_anchored' ? (value ? 1 : 0) : value);
    }
  }
  
  if (fields.length === 0) return;
  
  values.push(koId);
  const stmt = getDB().prepare(`UPDATE ko_physics SET ${fields.join(', ')} WHERE ko_id = ?`);
  stmt.run(...values);
}

// ============ Memory Operations ============

export function initMemory(koId: string): void {
  const stmt = getDB().prepare(`
    INSERT OR IGNORE INTO ko_memory (ko_id)
    VALUES (?)
  `);
  stmt.run(koId);
}

export function getMemory(koId: string): KOMemory | null {
  const stmt = getDB().prepare('SELECT * FROM ko_memory WHERE ko_id = ?');
  const row = stmt.get(koId) as any;
  if (!row) return null;
  return {
    ...row,
    affinity_scores: JSON.parse(row.affinity_scores),
    rivalry_scores: JSON.parse(row.rivalry_scores),
    behavioral_traits: JSON.parse(row.behavioral_traits),
    evolution_history: JSON.parse(row.evolution_history),
  };
}

export function getAllMemory(): KOMemory[] {
  const stmt = getDB().prepare('SELECT * FROM ko_memory');
  const rows = stmt.all() as any[];
  return rows.map(row => ({
    ...row,
    affinity_scores: JSON.parse(row.affinity_scores),
    rivalry_scores: JSON.parse(row.rivalry_scores),
    behavioral_traits: JSON.parse(row.behavioral_traits),
    evolution_history: JSON.parse(row.evolution_history),
  }));
}

export function recordObservation(koId: string, durationMs: number = 0): void {
  const now = new Date().toISOString();
  
  // Update memory
  const memStmt = getDB().prepare(`
    UPDATE ko_memory SET
      observation_count = observation_count + 1,
      last_observed = ?,
      total_observation_time = total_observation_time + ?
    WHERE ko_id = ?
  `);
  memStmt.run(now, durationMs, koId);
  
  // Decrease entropy (observation collapses the wavefunction)
  const physStmt = getDB().prepare(`
    UPDATE ko_physics SET
      entropy = MAX(0.1, entropy - 0.05),
      mass = MIN(5.0, mass + 0.02)
    WHERE ko_id = ?
  `);
  physStmt.run(koId);
  
  // Add to evolution history
  addEvolutionEvent(koId, 'observed', { duration: durationMs });
  
  // Recompute traits
  recomputeTraits(koId);
}

export function recordCollision(
  koIdA: string,
  koIdB: string,
  outcome: 'synthesis' | 'dismiss' | 'ignore'
): void {
  const now = new Date().toISOString();
  
  // Update collision counts
  const stmt = getDB().prepare(`
    UPDATE ko_memory SET collision_count = collision_count + 1 WHERE ko_id IN (?, ?)
  `);
  stmt.run(koIdA, koIdB);
  
  // Update affinities/rivalries
  if (outcome === 'synthesis') {
    updateAffinity(koIdA, koIdB, 0.15);
    updateAffinity(koIdB, koIdA, 0.15);
    addEvolutionEvent(koIdA, 'synthesis', { with: koIdB });
    addEvolutionEvent(koIdB, 'synthesis', { with: koIdA });
  } else if (outcome === 'dismiss') {
    updateRivalry(koIdA, koIdB, 0.1);
    updateRivalry(koIdB, koIdA, 0.1);
    addEvolutionEvent(koIdA, 'collision', { with: koIdB, outcome: 'dismiss' });
    addEvolutionEvent(koIdB, 'collision', { with: koIdA, outcome: 'dismiss' });
  }
  
  // Recompute traits for both
  recomputeTraits(koIdA);
  recomputeTraits(koIdB);
}

function updateAffinity(koId: string, otherId: string, delta: number): void {
  const memory = getMemory(koId);
  if (!memory) return;
  
  const affinities = { ...memory.affinity_scores };
  affinities[otherId] = Math.min(1, (affinities[otherId] || 0) + delta);
  
  const stmt = getDB().prepare('UPDATE ko_memory SET affinity_scores = ? WHERE ko_id = ?');
  stmt.run(JSON.stringify(affinities), koId);
}

function updateRivalry(koId: string, otherId: string, delta: number): void {
  const memory = getMemory(koId);
  if (!memory) return;
  
  const rivalries = { ...memory.rivalry_scores };
  rivalries[otherId] = Math.min(1, (rivalries[otherId] || 0) + delta);
  
  const stmt = getDB().prepare('UPDATE ko_memory SET rivalry_scores = ? WHERE ko_id = ?');
  stmt.run(JSON.stringify(rivalries), koId);
}

function addEvolutionEvent(koId: string, type: string, details: Record<string, unknown>): void {
  const memory = getMemory(koId);
  if (!memory) return;
  
  const history = [...memory.evolution_history];
  history.push({
    timestamp: new Date().toISOString(),
    type: type as any,
    details,
  });
  
  // Keep last 100 events
  if (history.length > 100) {
    history.shift();
  }
  
  const stmt = getDB().prepare('UPDATE ko_memory SET evolution_history = ? WHERE ko_id = ?');
  stmt.run(JSON.stringify(history), koId);
}

export function recomputeTraits(koId: string): Traits {
  const memory = getMemory(koId);
  const physics = getPhysics(koId);
  
  if (!memory || !physics) return {};
  
  const daysSinceObserved = memory.last_observed
    ? (Date.now() - new Date(memory.last_observed).getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;
  
  const affinityCount = Object.keys(memory.affinity_scores).length;
  const rivalryCount = Object.keys(memory.rivalry_scores).length;
  
  const traits: Traits = {
    restless: memory.observation_count < 3 && memory.drift_distance > 500,
    stable: memory.observation_count > 10 && affinityCount > 3,
    magnetic: affinityCount > 5,
    volatile: rivalryCount > 3,
    forgotten: daysSinceObserved > 30,
    ancient: memory.observation_count > 20 && physics.mass > 2,
  };
  
  const stmt = getDB().prepare('UPDATE ko_memory SET behavioral_traits = ? WHERE ko_id = ?');
  stmt.run(JSON.stringify(traits), koId);
  
  return traits;
}

// ============ Link Operations ============

export function createLink(sourceId: string, targetId: string, linkType: Link['link_type'] = 'explicit'): void {
  const stmt = getDB().prepare(`
    INSERT OR IGNORE INTO links (source_id, target_id, link_type, created_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(sourceId, targetId, linkType, new Date().toISOString());
}

export function deleteLink(sourceId: string, targetId: string): boolean {
  const stmt = getDB().prepare('DELETE FROM links WHERE source_id = ? AND target_id = ?');
  const result = stmt.run(sourceId, targetId);
  return result.changes > 0;
}

export function getLinks(koId: string): Link[] {
  const stmt = getDB().prepare(`
    SELECT * FROM links WHERE source_id = ? OR target_id = ?
  `);
  return stmt.all(koId, koId) as Link[];
}

export function getAllLinks(): Link[] {
  const stmt = getDB().prepare('SELECT * FROM links');
  return stmt.all() as Link[];
}

export function closeDB(): void {
  if (db) {
    db.close();
  }
}

// ============ Embedding Operations ============

// In-memory embedding cache (SQLite doesn't have native vector support without extensions)
const embeddingCache = new Map<string, Float32Array>();

export async function storeEmbedding(koId: string, text: string): Promise<void> {
  if (!isEmbeddingsAvailable()) return;
  
  const embedding = await embed(text);
  if (embedding) {
    embeddingCache.set(koId, embedding);
  }
}

export function getEmbedding(koId: string): Float32Array | null {
  return embeddingCache.get(koId) || null;
}

export function getAllEmbeddings(): Map<string, Float32Array> {
  return embeddingCache;
}

export function deleteEmbedding(koId: string): void {
  embeddingCache.delete(koId);
}

/**
 * Find KOs most similar to the given KO
 */
export function findSimilar(koId: string, n: number = 5): Array<{ id: string; similarity: number }> {
  const sourceEmbedding = embeddingCache.get(koId);
  if (!sourceEmbedding) return [];
  
  const similarities: Array<{ id: string; similarity: number }> = [];
  
  for (const [otherId, otherEmbedding] of embeddingCache) {
    if (otherId === koId) continue;
    
    const similarity = cosineSimilarity(sourceEmbedding, otherEmbedding);
    similarities.push({ id: otherId, similarity });
  }
  
  // Sort by similarity descending
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  return similarities.slice(0, n);
}

/**
 * Get similarity between two KOs
 */
export function getSimilarity(koIdA: string, koIdB: string): number {
  const embeddingA = embeddingCache.get(koIdA);
  const embeddingB = embeddingCache.get(koIdB);
  
  if (!embeddingA || !embeddingB) return 0;
  
  return cosineSimilarity(embeddingA, embeddingB);
}

/**
 * Get all pairwise similarities (for physics)
 */
export function getAllSimilarities(): Map<string, Map<string, number>> {
  const result = new Map<string, Map<string, number>>();
  const ids = Array.from(embeddingCache.keys());
  
  for (const idA of ids) {
    const similarities = new Map<string, number>();
    const embeddingA = embeddingCache.get(idA)!;
    
    for (const idB of ids) {
      if (idA === idB) continue;
      const embeddingB = embeddingCache.get(idB)!;
      similarities.set(idB, cosineSimilarity(embeddingA, embeddingB));
    }
    
    result.set(idA, similarities);
  }
  
  return result;
}

// ============ Full-Text Search ============

export function searchKOs(query: string, limit: number = 20): KO[] {
  // Simple LIKE-based search (FTS5 would be better but requires extension)
  const stmt = getDB().prepare(`
    SELECT * FROM kos 
    WHERE title LIKE ? OR content LIKE ?
    ORDER BY updated_at DESC
    LIMIT ?
  `);
  
  const pattern = `%${query}%`;
  const rows = stmt.all(pattern, pattern, limit) as any[];
  return rows.map(row => ({ ...row, tags: JSON.parse(row.tags) }));
}

