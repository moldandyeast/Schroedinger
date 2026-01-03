<script lang="ts">
  import { createKO } from '../core';
  
  export let isOpen = false;
  
  let title = '';
  let isCreating = false;
  let inputEl: HTMLInputElement;
  
  async function handleCreate() {
    if (!title.trim() || isCreating) return;
    
    isCreating = true;
    try {
      await createKO(title.trim());
      title = '';
      isOpen = false;
    } catch (e) {
      console.error('Failed to create KO:', e);
    } finally {
      isCreating = false;
    }
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      isOpen = false;
    }
  }
  
  $: if (isOpen && inputEl) {
    inputEl.focus();
  }
</script>

{#if isOpen}
  <div class="create-overlay" on:click={() => isOpen = false} role="button" tabindex="-1" on:keydown={(e) => e.key === 'Escape' && (isOpen = false)}></div>
  <div class="create-panel">
    <h3>New Thought</h3>
    <input
      bind:this={inputEl}
      type="text"
      placeholder="What's on your mind?"
      bind:value={title}
      on:keydown={handleKeydown}
      disabled={isCreating}
    />
    <div class="actions">
      <button class="cancel" on:click={() => isOpen = false}>Cancel</button>
      <button class="create" on:click={handleCreate} disabled={!title.trim() || isCreating}>
        {isCreating ? 'Creating...' : 'Create'}
      </button>
    </div>
    <p class="hint">This will create a new markdown file in your vault.</p>
  </div>
{/if}

<style>
  .create-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
  
  .create-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-elevated, #1a1a1a);
    border: 1px solid var(--border, #333);
    border-radius: 12px;
    padding: 24px;
    width: 400px;
    z-index: 1000;
    animation: slideIn 0.2s ease-out;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
  
  h3 {
    margin: 0 0 16px 0;
    font-family: 'Literata', Georgia, serif;
    font-size: 18px;
    font-weight: 500;
    color: var(--text-primary, #fff);
  }
  
  input {
    width: 100%;
    padding: 12px 14px;
    background: var(--bg, #0a0a0a);
    border: 1px solid var(--border-subtle, #444);
    border-radius: 8px;
    color: var(--text-primary, #fff);
    font-family: 'Literata', Georgia, serif;
    font-size: 16px;
    outline: none;
    margin-bottom: 16px;
  }
  
  input:focus {
    border-color: #4488ff;
  }
  
  input::placeholder {
    color: var(--text-muted, #666);
    font-style: italic;
  }
  
  .actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  
  button {
    padding: 10px 20px;
    border-radius: 6px;
    border: none;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .cancel {
    background: var(--border, #333);
    color: var(--text-muted, #888);
  }
  
  .cancel:hover {
    background: var(--border-subtle, #444);
    color: var(--text-secondary, #aaa);
  }
  
  .create {
    background: #1a4d1a;
    color: #44ff88;
  }
  
  .create:hover:not(:disabled) {
    background: #2d6a2d;
  }
  
  .hint {
    margin-top: 12px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-muted, #666);
    text-align: center;
  }
</style>

