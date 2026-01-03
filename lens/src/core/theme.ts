/**
 * Theme management for the Schroedinger system.
 * Handles dark/light mode with persistence and system preference detection.
 */

import { writable } from 'svelte/store';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'schroedinger-theme';

function updateDocumentTheme(theme: Theme): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

function createThemeStore() {
  const { subscribe, set: _set, update } = writable<Theme>('dark');
  
  const set = (value: Theme) => {
    _set(value);
    updateDocumentTheme(value);
  };
  
  return {
    subscribe,
    set,
    
    /** Toggle between dark and light mode */
    toggle: () => update(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, next);
      }
      updateDocumentTheme(next);
      return next;
    }),
    
    /** Initialize theme from localStorage or system preference */
    init: () => {
      if (typeof localStorage !== 'undefined' && typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') {
          set(saved);
        } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
          set('light');
        } else {
          set('dark');
        }
      }
    }
  };
}

export const theme = createThemeStore();

