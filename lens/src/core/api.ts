/**
 * API client for the Schroedinger Bridge.
 * All communication with the backend goes through this module.
 */

import type { KO, KOPhysics, KOMemory, Link, AcceleratorSet, WSMessage } from './types';

const API_BASE = '/api';

// ============ KO API ============

export async function fetchKOs(): Promise<KO[]> {
  const res = await fetch(`${API_BASE}/kos`);
  if (!res.ok) throw new Error('Failed to fetch KOs');
  return res.json();
}

export async function fetchKO(id: string): Promise<KO & { memory: KOMemory; physics: KOPhysics }> {
  const res = await fetch(`${API_BASE}/kos/${id}`);
  if (!res.ok) throw new Error('Failed to fetch KO');
  return res.json();
}

export async function createKO(title: string, content?: string): Promise<{ filename: string }> {
  const res = await fetch(`${API_BASE}/kos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) throw new Error('Failed to create KO');
  return res.json();
}

export async function updateKO(id: string, updates: Partial<{ title: string; content: string }>): Promise<void> {
  const res = await fetch(`${API_BASE}/kos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update KO');
}

// ============ Physics API ============

export async function fetchPhysics(): Promise<KOPhysics[]> {
  const res = await fetch(`${API_BASE}/physics`);
  if (!res.ok) throw new Error('Failed to fetch physics');
  return res.json();
}

export async function updatePhysics(koId: string, updates: Partial<KOPhysics>): Promise<void> {
  const res = await fetch(`${API_BASE}/physics/${koId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update physics');
}

export async function batchUpdatePhysics(updates: Array<{ ko_id: string } & Partial<KOPhysics>>): Promise<void> {
  const res = await fetch(`${API_BASE}/physics`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to batch update physics');
}

// ============ Memory API ============

export async function fetchMemory(): Promise<KOMemory[]> {
  const res = await fetch(`${API_BASE}/memory`);
  if (!res.ok) throw new Error('Failed to fetch memory');
  return res.json();
}

export async function recordObservation(koId: string, duration: number = 0): Promise<{ memory: KOMemory; physics: KOPhysics }> {
  const res = await fetch(`${API_BASE}/observe/${koId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ duration }),
  });
  if (!res.ok) throw new Error('Failed to record observation');
  return res.json();
}

export async function recordCollision(
  koIdA: string, 
  koIdB: string, 
  outcome: 'synthesis' | 'dismiss' | 'ignore'
): Promise<void> {
  const res = await fetch(`${API_BASE}/collision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ koIdA, koIdB, outcome }),
  });
  if (!res.ok) throw new Error('Failed to record collision');
}

// ============ Synthesis API ============

export async function createSynthesis(
  koIdA: string, 
  koIdB: string, 
  connection: string
): Promise<{ id: string; filename: string }> {
  const res = await fetch(`${API_BASE}/synthesis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ koIdA, koIdB, connection }),
  });
  if (!res.ok) throw new Error('Failed to create synthesis');
  return res.json();
}

// ============ Discovery API ============

export async function fetchRandom(n: number = 5): Promise<KO[]> {
  const res = await fetch(`${API_BASE}/random?n=${n}`);
  if (!res.ok) throw new Error('Failed to fetch random KOs');
  return res.json();
}

export async function fetchOrphans(): Promise<KO[]> {
  const res = await fetch(`${API_BASE}/orphans`);
  if (!res.ok) throw new Error('Failed to fetch orphans');
  return res.json();
}

export async function fetchForgotten(days: number = 30): Promise<KO[]> {
  const res = await fetch(`${API_BASE}/forgotten?days=${days}`);
  if (!res.ok) throw new Error('Failed to fetch forgotten');
  return res.json();
}

export async function fetchAccelerator(anchorId: string): Promise<AcceleratorSet> {
  const res = await fetch(`${API_BASE}/accelerator/${anchorId}`);
  if (!res.ok) throw new Error('Failed to fetch accelerator set');
  return res.json();
}

// ============ Links API ============

export async function fetchLinks(): Promise<Link[]> {
  const res = await fetch(`${API_BASE}/links`);
  if (!res.ok) throw new Error('Failed to fetch links');
  return res.json();
}

export async function createLink(sourceId: string, targetId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId, targetId }),
  });
  if (!res.ok) throw new Error('Failed to create link');
}

// ============ Similarity API ============

export async function fetchSimilar(koId: string, n: number = 5): Promise<Array<{ ko: KO; similarity: number }>> {
  const res = await fetch(`${API_BASE}/similar/${koId}?n=${n}`);
  if (!res.ok) throw new Error('Failed to fetch similar');
  return res.json();
}

export async function fetchSimilarities(): Promise<Record<string, Record<string, number>>> {
  const res = await fetch(`${API_BASE}/similarities`);
  if (!res.ok) throw new Error('Failed to fetch similarities');
  return res.json();
}

// ============ Search API ============

export async function searchKOs(query: string, limit: number = 20): Promise<KO[]> {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to search');
  return res.json();
}

// ============ WebSocket ============

let wsInstance: WebSocket | null = null;

export function connectWebSocket(onMessage: (message: WSMessage) => void): WebSocket {
  // Close existing connection if any
  if (wsInstance) {
    wsInstance.close();
  }
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  wsInstance = new WebSocket(`${protocol}//${window.location.host}/ws`);
  
  wsInstance.onopen = () => {
    console.log('🔌 WebSocket connected');
  };
  
  wsInstance.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      onMessage(message);
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e);
    }
  };
  
  wsInstance.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  wsInstance.onclose = () => {
    console.log('🔌 WebSocket disconnected');
    // Attempt to reconnect after 3 seconds
    setTimeout(() => {
      console.log('🔌 Attempting to reconnect...');
      connectWebSocket(onMessage);
    }, 3000);
  };
  
  return wsInstance;
}

export function disconnectWebSocket(): void {
  if (wsInstance) {
    wsInstance.close();
    wsInstance = null;
  }
}

