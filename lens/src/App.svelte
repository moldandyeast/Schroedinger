<script lang="ts">
  /**
   * App Shell - The root component and lens router.
   * 
   * This shell manages navigation between lenses and handles global keyboard shortcuts.
   * Each lens is a self-contained app that can be swapped in/out.
   */
  import { currentLens, navigateTo, selectedKO, activeCollision } from './core';
  import type { LensId } from './core';
  
  // Import lenses
  import { Launcher, Drift } from './lenses';
  
  // Global keyboard shortcuts
  function handleKeydown(e: KeyboardEvent): void {
    // Don't trigger shortcuts if typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    if (e.key === 'Escape') {
      if ($currentLens !== 'launcher') {
        selectedKO.set(null);
        activeCollision.set(null);
      }
    } else if (e.key === 'Backspace' && (e.metaKey || e.ctrlKey)) {
      if ($currentLens !== 'launcher') {
        e.preventDefault();
        navigateTo('launcher');
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<main>
  {#if $currentLens === 'launcher'}
    <Launcher />
  {:else if $currentLens === 'drift'}
    <Drift />
  {:else}
    <!-- Future lenses will be added here -->
    <div class="coming-soon">
      <h2>Coming Soon</h2>
      <p>The {$currentLens} lens is under construction.</p>
      <button on:click={() => navigateTo('launcher')}>Back to Launcher</button>
    </div>
  {/if}
</main>

<style>
  main {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }
  
  .coming-soon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: var(--text-muted, #888);
  }
  
  .coming-soon h2 {
    font-family: 'Literata', Georgia, serif;
    font-size: 24px;
    color: var(--text-primary, #fff);
    margin-bottom: 8px;
  }
  
  .coming-soon p {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    margin-bottom: 24px;
  }
  
  .coming-soon button {
    background: var(--border, #333);
    color: var(--text-primary, #fff);
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: 'JetBrains Mono', monospace;
    cursor: pointer;
  }
  
  .coming-soon button:hover {
    background: var(--border-subtle, #444);
  }
</style>
