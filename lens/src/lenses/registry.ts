/**
 * Lens Registry - Central configuration for all available lenses.
 * 
 * To add a new lens:
 * 1. Create a folder in lenses/ with your lens component
 * 2. Add an entry to the LENSES array below
 * 3. Import and add to the lensComponents map in App.svelte
 */

import type { LensConfig, LensId } from '../core';

export const LENSES: LensConfig[] = [
  {
    id: 'drift',
    name: 'Drift',
    description: 'The physics canvas. Objects wander, collide, synthesize.',
    icon: '◎',
    color: '#44ff88',
    colorLight: '#1a8a4a',
    ready: true,
    docUrl: '/docs/lenses/drift.html',
  },
  {
    id: 'observe',
    name: 'Observe',
    description: 'Watch the system evolve. No intervention.',
    icon: '◉',
    color: '#4488ff',
    colorLight: '#2255cc',
    ready: false,
    docUrl: '/docs/lenses/observe.html',
  },
  {
    id: 'accelerator',
    name: 'Accelerator',
    description: 'Focused collision experiments. Find connections.',
    icon: '⊛',
    color: '#8844ff',
    colorLight: '#6622cc',
    ready: false,
    docUrl: '/docs/lenses/accelerator.html',
  },
  {
    id: 'void',
    name: 'Void',
    description: "Map the embedding space. See what's missing.",
    icon: '◌',
    color: '#ff8844',
    colorLight: '#cc5500',
    ready: false,
    docUrl: '/docs/lenses/void.html',
  },
  {
    id: 'archive',
    name: 'Archive',
    description: 'Browse and search. The traditional view.',
    icon: '▤',
    color: '#888888',
    colorLight: '#555555',
    ready: false,
    docUrl: '/docs/lenses/archive.html',
  },
];

export const DOCS = [
  { id: 'about', name: 'About', description: 'What this is' },
  { id: 'essay', name: 'Essay', description: 'The philosophy' },
  { id: 'play', name: 'Play', description: 'The game design' },
  { id: 'architecture', name: 'Arch', description: 'Codebase structure' },
  { id: 'log', name: 'Log', description: 'Build journal' },
];

export function getLens(id: LensId): LensConfig | undefined {
  return LENSES.find(l => l.id === id);
}

export function getReadyLenses(): LensConfig[] {
  return LENSES.filter(l => l.ready);
}

export function getUpcomingLenses(): LensConfig[] {
  return LENSES.filter(l => !l.ready);
}

