<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { kos, physics } from './stores';
  import type { KO } from './types';
  
  export let koIdA: string;
  export let koIdB: string;
  
  const dispatch = createEventDispatcher<{
    snap: { koIdA: string; koIdB: string; connection: string };
    dismiss: { koIdA: string; koIdB: string };
    ignore: { koIdA: string; koIdB: string };
  }>();
  
  let connection = '';
  let inputEl: HTMLInputElement;
  
  $: koA = $kos.get(koIdA);
  $: koB = $kos.get(koIdB);
  $: physicsA = $physics.get(koIdA);
  $: physicsB = $physics.get(koIdB);
  
  // Position the prompt between the two KOs
  $: position = physicsA && physicsB ? {
    x: (physicsA.position_x + physicsB.position_x) / 2,
    y: (physicsA.position_y + physicsB.position_y) / 2,
  } : { x: 0, y: 0 };
  
  function handleSnap(): void {
    if (connection.trim()) {
      dispatch('snap', { koIdA, koIdB, connection: connection.trim() });
    }
  }
  
  function handleDismiss(): void {
    dispatch('dismiss', { koIdA, koIdB });
  }
  
  function handleIgnore(): void {
    dispatch('ignore', { koIdA, koIdB });
  }
  
  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && connection.trim()) {
      handleSnap();
    } else if (e.key === 'Escape') {
      handleIgnore();
    }
  }
  
  // Focus input on mount
  $: if (inputEl) {
    inputEl.focus();
  }
</script>

{#if koA && koB}
  <div class="collision-prompt" role="dialog" aria-modal="true">
    <div class="prompt-header">
      <span class="ko-title">{koA.title}</span>
      <span class="connector">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 12h16M12 4l8 8-8 8"/>
        </svg>
      </span>
      <span class="ko-title">{koB.title}</span>
    </div>
    
    <div class="prompt-body">
      <label for="connection-input" class="sr-only">What connects these?</label>
      <input 
        id="connection-input"
        type="text" 
        bind:this={inputEl}
        bind:value={connection}
        placeholder="What connects these?"
        on:keydown={handleKeydown}
      />
    </div>
    
    <div class="prompt-actions">
      <button 
        class="btn snap" 
        on:click={handleSnap}
        disabled={!connection.trim()}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12l5 5L20 7"/>
        </svg>
        Snap
      </button>
      
      <button class="btn dismiss" on:click={handleDismiss}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        Dismiss
      </button>
      
      <button class="btn ignore" on:click={handleIgnore}>
        Ignore
      </button>
    </div>
    
    <p class="hint">
      <kbd>Enter</kbd> to snap · <kbd>Esc</kbd> to ignore
    </p>
  </div>
{/if}

<style>
  .collision-prompt {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 20px;
    min-width: 400px;
    max-width: 500px;
    z-index: 1000;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    animation: fadeIn 0.2s ease-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
  
  .prompt-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .ko-title {
    font-family: 'Literata', Georgia, serif;
    font-size: 14px;
    color: #fff;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    background: #0a0a0a;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #333;
  }
  
  .connector {
    color: #666;
    display: flex;
    align-items: center;
  }
  
  .prompt-body {
    margin-bottom: 16px;
  }
  
  input {
    width: 100%;
    padding: 12px 16px;
    background: #0a0a0a;
    border: 1px solid #444;
    border-radius: 8px;
    color: #fff;
    font-family: 'Literata', Georgia, serif;
    font-size: 16px;
    outline: none;
    transition: border-color 0.2s;
  }
  
  input:focus {
    border-color: #4488ff;
  }
  
  input::placeholder {
    color: #666;
    font-style: italic;
  }
  
  .prompt-actions {
    display: flex;
    gap: 8px;
  }
  
  .btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 6px;
    border: none;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .snap {
    background: #1a4d1a;
    color: #44ff88;
  }
  
  .snap:hover:not(:disabled) {
    background: #2d6a2d;
  }
  
  .dismiss {
    background: #4d1a1a;
    color: #ff6666;
  }
  
  .dismiss:hover {
    background: #6a2d2d;
  }
  
  .ignore {
    background: #333;
    color: #888;
  }
  
  .ignore:hover {
    background: #444;
    color: #aaa;
  }
  
  .hint {
    margin-top: 12px;
    text-align: center;
    color: #666;
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
  }
  
  kbd {
    background: #333;
    border-radius: 3px;
    padding: 2px 6px;
    font-size: 11px;
  }
  
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
</style>

