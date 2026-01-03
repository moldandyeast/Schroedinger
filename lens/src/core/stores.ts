/**
 * Global state stores for the Schroedinger system.
 * These stores are shared across all lenses.
 */

import { writable, derived, type Writable } from 'svelte/store';
import type { KO, KOPhysics, KOMemory, Link, Traits, LensId } from './types';

// ============ Navigation ============

export const currentLens: Writable<LensId> = writable('launcher');

// ============ Core Data Stores ============

export const kos: Writable<Map<string, KO>> = writable(new Map());
export const physics: Writable<Map<string, KOPhysics>> = writable(new Map());
export const memory: Writable<Map<string, KOMemory>> = writable(new Map());
export const links: Writable<Link[]> = writable([]);
export const similarities: Writable<Record<string, Record<string, number>>> = writable({});

// ============ Connection State ============

export const isConnected: Writable<boolean> = writable(false);

// ============ UI State ============

export const selectedKO: Writable<string | null> = writable(null);
export const hoveredKO: Writable<string | null> = writable(null);
export const activeCollision: Writable<{ koIdA: string; koIdB: string } | null> = writable(null);
export const searchQuery: Writable<string> = writable('');
export const searchResults: Writable<KO[]> = writable([]);

// ============ Derived Stores ============

export const koList = derived(kos, ($kos) => Array.from($kos.values()));

export const koCount = derived(kos, ($kos) => $kos.size);

export const orphanCount = derived([kos, links], ([$kos, $links]) => {
  const linked = new Set<string>();
  for (const link of $links) {
    linked.add(link.source_id);
    linked.add(link.target_id);
  }
  let count = 0;
  for (const id of $kos.keys()) {
    if (!linked.has(id)) count++;
  }
  return count;
});

export const selectedKOData = derived([selectedKO, kos], ([$selectedKO, $kos]) => {
  if (!$selectedKO) return null;
  return $kos.get($selectedKO) || null;
});

// ============ Setter Functions ============

export function setKOs(koArray: KO[]): void {
  kos.set(new Map(koArray.map(ko => [ko.id, ko])));
}

export function addKO(ko: KO): void {
  kos.update(m => {
    m.set(ko.id, ko);
    return new Map(m);
  });
}

export function removeKO(id: string): void {
  kos.update(m => {
    m.delete(id);
    return new Map(m);
  });
  physics.update(m => {
    m.delete(id);
    return new Map(m);
  });
  memory.update(m => {
    m.delete(id);
    return new Map(m);
  });
}

export function setPhysics(physicsArray: KOPhysics[]): void {
  physics.set(new Map(physicsArray.map(p => [p.ko_id, p])));
}

export function updatePhysicsState(koId: string, updates: Partial<KOPhysics>): void {
  physics.update(m => {
    const existing = m.get(koId);
    if (existing) {
      m.set(koId, { ...existing, ...updates });
    }
    return new Map(m);
  });
}

export function setMemory(memoryArray: KOMemory[]): void {
  memory.set(new Map(memoryArray.map(m => [m.ko_id, m])));
}

export function updateMemoryState(koId: string, updates: Partial<KOMemory>): void {
  memory.update(m => {
    const existing = m.get(koId);
    if (existing) {
      m.set(koId, { ...existing, ...updates });
    }
    return new Map(m);
  });
}

export function setLinks(linkArray: Link[]): void {
  links.set(linkArray);
}

export function setSimilarities(sims: Record<string, Record<string, number>>): void {
  similarities.set(sims);
}

// ============ Utility Functions ============

export function getTraits(koId: string): Traits {
  let traits: Traits = {};
  const unsubscribe = memory.subscribe(m => {
    const mem = m.get(koId);
    if (mem) {
      traits = mem.behavioral_traits;
    }
  });
  unsubscribe();
  return traits;
}

/** Reset all stores to initial state */
export function resetStores(): void {
  kos.set(new Map());
  physics.set(new Map());
  memory.set(new Map());
  links.set([]);
  similarities.set({});
  selectedKO.set(null);
  hoveredKO.set(null);
  activeCollision.set(null);
  searchQuery.set('');
  searchResults.set([]);
  isConnected.set(false);
}

/** Navigate to a lens */
export function navigateTo(lens: LensId): void {
  currentLens.set(lens);
}

