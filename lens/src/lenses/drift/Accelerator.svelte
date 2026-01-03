<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { kos, physics, selectedKO, fetchAccelerator } from '../../core';
  import type { KO, AcceleratorSet } from '../../core';
  
  const dispatch = createEventDispatcher<{
    focus: { ids: string[] };
    close: void;
  }>();
  
  export let isOpen = false;
  
  let acceleratorSet: AcceleratorSet | null = null;
  let loading = false;
  
  $: anchorKO = $selectedKO ? $kos.get($selectedKO) : null;
  
  async function loadAccelerator() {
    if (!$selectedKO) return;
    
    loading = true;
    try {
      acceleratorSet = await fetchAccelerator($selectedKO);
    } catch (e) {
      console.error('Failed to load accelerator:', e);
    } finally {
      loading = false;
    }
  }
  
  $: if (isOpen && $selectedKO) {
    loadAccelerator();
  }
  
  function focusSet() {
    if (!acceleratorSet) return;
    
    const ids = [
      acceleratorSet.anchor.id,
      ...acceleratorSet.relatives.map(r => r.id),
      ...acceleratorSet.strangers.map(s => s.id),
    ];
    
    dispatch('focus', { ids });
  }
  
  function close() {
    isOpen = false;
    acceleratorSet = null;
    dispatch('close');
  }
</script>

{#if isOpen && anchorKO}
  <div class="accelerator-overlay" on:click={close} role="button" tabindex="-1" on:keydown={(e) => e.key === 'Escape' && close()}></div>
  <aside class="accelerator-panel">
    <header>
      <h2>Particle Accelerator</h2>
      <button class="close-btn" on:click={close}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </header>
    
    <p class="description">
      Focused collision mode. Bring together related and unrelated thoughts around an anchor.
    </p>
    
    {#if loading}
      <div class="loading">Loading...</div>
    {:else if acceleratorSet}
      <section class="anchor-section">
        <h3>Anchor</h3>
        <div class="ko-card anchor">
          <span class="ko-title">{acceleratorSet.anchor.title}</span>
          <span class="ko-type">{acceleratorSet.anchor.type}</span>
        </div>
      </section>
      
      <section>
        <h3>Relatives <span class="count">({acceleratorSet.relatives.length})</span></h3>
        <p class="hint">Known connections</p>
        <div class="ko-list">
          {#each acceleratorSet.relatives as ko}
            <div class="ko-card relative">
              <span class="ko-title">{ko.title}</span>
            </div>
          {:else}
            <p class="empty">No relatives found</p>
          {/each}
        </div>
      </section>
      
      <section>
        <h3>Strangers <span class="count">({acceleratorSet.strangers.length})</span></h3>
        <p class="hint">Unknown territory — potential discoveries</p>
        <div class="ko-list">
          {#each acceleratorSet.strangers as ko}
            <div class="ko-card stranger">
              <span class="ko-title">{ko.title}</span>
            </div>
          {:else}
            <p class="empty">No strangers found</p>
          {/each}
        </div>
      </section>
      
      <div class="actions">
        <button class="focus-btn" on:click={focusSet}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
          </svg>
          Focus These Objects
        </button>
      </div>
    {/if}
  </aside>
{/if}

<style>
  .accelerator-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 299;
  }
  
  .accelerator-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 450px;
    max-height: 80vh;
    background: #141414;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 24px;
    overflow-y: auto;
    z-index: 300;
    animation: slideUp 0.2s ease-out;
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translate(-50%, -48%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }
  
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  
  h2 {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    font-weight: 500;
    color: #8844ff;
    margin: 0;
  }
  
  .close-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 4px;
  }
  
  .close-btn:hover {
    color: #fff;
  }
  
  .description {
    font-family: 'Literata', Georgia, serif;
    font-size: 13px;
    color: #888;
    margin-bottom: 20px;
    line-height: 1.5;
  }
  
  section {
    margin-bottom: 20px;
  }
  
  h3 {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 8px 0;
  }
  
  .count {
    color: #444;
    font-weight: 400;
  }
  
  .hint {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #555;
    margin: 0 0 8px 0;
  }
  
  .ko-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .ko-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: #1a1a1a;
    border-radius: 6px;
    border: 1px solid #333;
  }
  
  .ko-card.anchor {
    border-color: #8844ff;
    background: rgba(136, 68, 255, 0.1);
  }
  
  .ko-card.relative {
    border-color: #44ff88;
  }
  
  .ko-card.stranger {
    border-color: #ffaa44;
  }
  
  .ko-title {
    font-family: 'Literata', Georgia, serif;
    font-size: 13px;
    color: #fff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .ko-type {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #8844ff;
    background: rgba(136, 68, 255, 0.2);
    padding: 2px 6px;
    border-radius: 3px;
  }
  
  .empty {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #555;
    font-style: italic;
    padding: 8px 0;
  }
  
  .loading {
    text-align: center;
    padding: 40px;
    color: #666;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
  }
  
  .actions {
    margin-top: 24px;
  }
  
  .focus-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: #8844ff;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .focus-btn:hover {
    background: #9955ff;
  }
</style>

