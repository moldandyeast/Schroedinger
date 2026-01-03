<script lang="ts">
  import { onMount } from 'svelte';
  import Canvas from './lib/Canvas.svelte';
  import CollisionPrompt from './lib/CollisionPrompt.svelte';
  import SearchPanel from './lib/SearchPanel.svelte';
  import CreatePanel from './lib/CreatePanel.svelte';
  import EditPanel from './lib/EditPanel.svelte';
  import Accelerator from './lib/Accelerator.svelte';
  import { 
    fetchKOs, 
    fetchPhysics, 
    fetchMemory,
    fetchLinks,
    fetchSimilarities,
    connectWebSocket,
    createSynthesis,
    recordCollision,
  } from './lib/api';
  import { 
    setKOs, 
    setPhysics, 
    setMemory,
    setLinks,
    setSimilarities,
    addKO,
    removeKO,
    isConnected,
    activeCollision,
    koCount,
    orphanCount,
    selectedKO,
    kos,
  } from './lib/stores';
  import type { WSMessage } from './lib/types';

  let loading = true;
  let error: string | null = null;
  let showCreatePanel = false;
  let showAccelerator = false;

  onMount(async () => {
    try {
      // Fetch initial data
      const [kosData, physicsData, memoryData, linksData] = await Promise.all([
        fetchKOs(),
        fetchPhysics(),
        fetchMemory(),
        fetchLinks(),
      ]);
      
      setKOs(kosData);
      setPhysics(physicsData);
      setMemory(memoryData);
      setLinks(linksData);
      
      // Fetch similarities (async, don't block)
      fetchSimilarities().then(setSimilarities).catch(console.error);
      
      loading = false;
      
      // Connect WebSocket
      connectWebSocket(handleWSMessage);
      isConnected.set(true);
      
      // Refresh similarities periodically
      setInterval(() => {
        fetchSimilarities().then(setSimilarities).catch(console.error);
      }, 30000);
      
    } catch (e) {
      console.error('Failed to initialize:', e);
      error = e instanceof Error ? e.message : 'Failed to connect to bridge';
      loading = false;
    }
  });

  function handleWSMessage(message: WSMessage): void {
    console.log('📩 WS:', message.type);
    
    switch (message.type) {
      case 'file:created':
        if (message.ko) {
          addKO(message.ko as any);
          // Refresh similarities when new KO added
          fetchSimilarities().then(setSimilarities).catch(console.error);
        }
        break;
        
      case 'file:changed':
        if (message.ko) {
          addKO(message.ko as any);
          fetchSimilarities().then(setSimilarities).catch(console.error);
        }
        break;
        
      case 'file:deleted':
        if (message.ko) {
          removeKO((message.ko as any).id);
        }
        break;
        
      case 'synthesis:created':
        console.log('✨ Synthesis created:', message.connection);
        // Refresh links
        fetchLinks().then(setLinks).catch(console.error);
        break;
    }
  }

  function handleCollision(koIdA: string, koIdB: string): void {
    activeCollision.set({ koIdA, koIdB });
  }

  async function handleSnap(e: CustomEvent<{ koIdA: string; koIdB: string; connection: string }>): Promise<void> {
    const { koIdA, koIdB, connection } = e.detail;
    
    try {
      const result = await createSynthesis(koIdA, koIdB, connection);
      console.log('✨ Created synthesis:', result.id);
    } catch (err) {
      console.error('Failed to create synthesis:', err);
    }
    
    activeCollision.set(null);
  }

  async function handleDismiss(e: CustomEvent<{ koIdA: string; koIdB: string }>): Promise<void> {
    const { koIdA, koIdB } = e.detail;
    
    try {
      await recordCollision(koIdA, koIdB, 'dismiss');
    } catch (err) {
      console.error('Failed to record dismissal:', err);
    }
    
    activeCollision.set(null);
  }

  function handleIgnore(): void {
    activeCollision.set(null);
  }

  // Keyboard shortcuts
  function handleKeydown(e: KeyboardEvent): void {
    // Don't trigger shortcuts if typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    if (e.key === 'Escape') {
      selectedKO.set(null);
      activeCollision.set(null);
      showCreatePanel = false;
    } else if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      showCreatePanel = true;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<main>
  {#if loading}
    <div class="loading">
      <div class="loading-spinner"></div>
      <p>Connecting to Bridge...</p>
    </div>
  {:else if error}
    <div class="error">
      <h2>Connection Error</h2>
      <p>{error}</p>
      <p class="hint">Make sure the Bridge is running on localhost:3333</p>
      <button on:click={() => window.location.reload()}>Retry</button>
    </div>
  {:else}
    <Canvas onCollision={handleCollision} />
    
    <!-- Search bar -->
    <SearchPanel />
    
    <!-- Create button -->
    <button class="create-btn" on:click={() => showCreatePanel = true} title="New thought (⌘N)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    </button>
    
    <!-- Create panel -->
    <CreatePanel bind:isOpen={showCreatePanel} />
    
    <!-- Edit panel (sidebar) -->
    <EditPanel />
    
    <!-- Accelerator button -->
    {#if $selectedKO}
      <button 
        class="accelerator-btn" 
        on:click={() => showAccelerator = true}
        title="Particle Accelerator"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <circle cx="12" cy="12" r="8" stroke-dasharray="4 4"/>
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
        </svg>
      </button>
    {/if}
    
    <!-- Accelerator panel -->
    <Accelerator bind:isOpen={showAccelerator} />
    
    <!-- Status bar -->
    <div class="status-bar">
      <div class="status-item">
        <span class="label">KOs</span>
        <span class="value">{$koCount}</span>
      </div>
      <div class="status-item">
        <span class="label">Orphans</span>
        <span class="value">{$orphanCount}</span>
      </div>
      <div class="status-item connected">
        <span class="dot"></span>
        <span class="label">Connected</span>
      </div>
    </div>
    
    <!-- Collision prompt -->
    {#if $activeCollision}
      <div class="overlay" on:click={handleIgnore} role="button" tabindex="-1" on:keydown={(e) => e.key === 'Escape' && handleIgnore()}></div>
      <CollisionPrompt 
        koIdA={$activeCollision.koIdA}
        koIdB={$activeCollision.koIdB}
        on:snap={handleSnap}
        on:dismiss={handleDismiss}
        on:ignore={handleIgnore}
      />
    {/if}
  {/if}
</main>

<style>
  main {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }
  
  .loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: #666;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #333;
    border-top-color: #4488ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .error {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    background: #1a1a1a;
    border: 1px solid #4d1a1a;
    border-radius: 12px;
    padding: 32px;
  }
  
  .error h2 {
    color: #ff6666;
    margin-bottom: 8px;
  }
  
  .error p {
    color: #888;
    margin-bottom: 16px;
  }
  
  .error .hint {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #666;
  }
  
  .error button {
    background: #333;
    color: #fff;
    border: none;
    padding: 10px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-family: 'JetBrains Mono', monospace;
  }
  
  .error button:hover {
    background: #444;
  }
  
  .create-btn {
    position: fixed;
    bottom: 80px;
    right: 20px;
    width: 48px;
    height: 48px;
    background: #1a4d1a;
    border: none;
    border-radius: 50%;
    color: #44ff88;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    transition: all 0.2s;
    z-index: 100;
  }
  
  .create-btn:hover {
    background: #2d6a2d;
    transform: scale(1.1);
  }
  
  .accelerator-btn {
    position: fixed;
    bottom: 140px;
    right: 20px;
    width: 44px;
    height: 44px;
    background: rgba(136, 68, 255, 0.2);
    border: 1px solid #8844ff;
    border-radius: 50%;
    color: #8844ff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    z-index: 100;
  }
  
  .accelerator-btn:hover {
    background: rgba(136, 68, 255, 0.3);
    transform: scale(1.1);
  }
  
  .status-bar {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 24px;
    background: rgba(26, 26, 26, 0.9);
    border: 1px solid #333;
    border-radius: 8px;
    padding: 8px 16px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    z-index: 100;
  }
  
  .status-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .status-item .label {
    color: #666;
  }
  
  .status-item .value {
    color: #fff;
  }
  
  .status-item.connected .dot {
    width: 6px;
    height: 6px;
    background: #44ff88;
    border-radius: 50%;
  }
  
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
</style>
