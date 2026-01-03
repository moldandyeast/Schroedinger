/**
 * Core module - shared infrastructure for all lenses.
 * 
 * Usage:
 *   import { fetchKOs, kos, theme } from '@core';
 */

// Types
export type {
  KO,
  KOPhysics,
  KOMemory,
  Traits,
  EvolutionEvent,
  Link,
  WSMessage,
  AcceleratorSet,
  LensId,
  LensConfig,
} from './types';

// API
export {
  fetchKOs,
  fetchKO,
  createKO,
  updateKO,
  fetchPhysics,
  updatePhysics,
  batchUpdatePhysics,
  fetchMemory,
  recordObservation,
  recordCollision,
  createSynthesis,
  fetchRandom,
  fetchOrphans,
  fetchForgotten,
  fetchAccelerator,
  fetchLinks,
  createLink,
  fetchSimilar,
  fetchSimilarities,
  searchKOs,
  connectWebSocket,
  disconnectWebSocket,
} from './api';

// Stores
export {
  // Navigation
  currentLens,
  navigateTo,
  
  // Core data
  kos,
  physics,
  memory,
  links,
  similarities,
  
  // Connection
  isConnected,
  
  // UI state
  selectedKO,
  hoveredKO,
  activeCollision,
  searchQuery,
  searchResults,
  
  // Derived
  koList,
  koCount,
  orphanCount,
  selectedKOData,
  
  // Setters
  setKOs,
  addKO,
  removeKO,
  setPhysics,
  updatePhysicsState,
  setMemory,
  updateMemoryState,
  setLinks,
  setSimilarities,
  
  // Utilities
  getTraits,
  resetStores,
} from './stores';

// Theme
export { theme, type Theme } from './theme';

