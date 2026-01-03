<script lang="ts">
  import { searchQuery, searchResults, kos, selectedKO } from './stores';
  import { searchKOs } from './api';
  import type { KO } from './types';
  
  let debounceTimer: ReturnType<typeof setTimeout>;
  
  async function handleSearch() {
    const query = $searchQuery.trim();
    
    if (!query) {
      searchResults.set([]);
      return;
    }
    
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        const results = await searchKOs(query);
        searchResults.set(results);
      } catch (e) {
        console.error('Search failed:', e);
      }
    }, 200);
  }
  
  function selectResult(ko: KO) {
    selectedKO.set(ko.id);
    searchQuery.set('');
    searchResults.set([]);
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      searchQuery.set('');
      searchResults.set([]);
    }
  }
</script>

<div class="search-panel">
  <div class="search-input-wrapper">
    <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
    <input
      type="text"
      placeholder="Search thoughts..."
      bind:value={$searchQuery}
      on:input={handleSearch}
      on:keydown={handleKeydown}
    />
    {#if $searchQuery}
      <button class="clear-btn" on:click={() => { searchQuery.set(''); searchResults.set([]); }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    {/if}
  </div>
  
  {#if $searchResults.length > 0}
    <div class="search-results">
      {#each $searchResults as ko}
        <button class="result-item" on:click={() => selectResult(ko)}>
          <span class="result-title">{ko.title}</span>
          <span class="result-type">{ko.type}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .search-panel {
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    width: 400px;
  }
  
  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .search-icon {
    position: absolute;
    left: 12px;
    color: #666;
    pointer-events: none;
  }
  
  input {
    width: 100%;
    padding: 12px 40px 12px 40px;
    background: rgba(26, 26, 26, 0.95);
    border: 1px solid #333;
    border-radius: 8px;
    color: #fff;
    font-family: 'Literata', Georgia, serif;
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
  }
  
  input:focus {
    border-color: #4488ff;
    box-shadow: 0 0 20px rgba(68, 136, 255, 0.2);
  }
  
  input::placeholder {
    color: #666;
  }
  
  .clear-btn {
    position: absolute;
    right: 8px;
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .clear-btn:hover {
    color: #fff;
  }
  
  .search-results {
    margin-top: 4px;
    background: rgba(26, 26, 26, 0.98);
    border: 1px solid #333;
    border-radius: 8px;
    max-height: 300px;
    overflow-y: auto;
  }
  
  .result-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 10px 14px;
    background: none;
    border: none;
    border-bottom: 1px solid #222;
    color: #fff;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;
  }
  
  .result-item:last-child {
    border-bottom: none;
  }
  
  .result-item:hover {
    background: rgba(68, 136, 255, 0.1);
  }
  
  .result-title {
    font-family: 'Literata', Georgia, serif;
    font-size: 13px;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .result-type {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #44ff88;
    background: rgba(68, 255, 136, 0.1);
    padding: 2px 6px;
    border-radius: 3px;
    margin-left: 8px;
  }
</style>

