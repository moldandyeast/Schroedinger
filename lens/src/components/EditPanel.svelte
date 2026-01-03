<script lang="ts">
  import { selectedKO, kos, memory, physics, recordObservation } from '../core';
  
  $: ko = $selectedKO ? $kos.get($selectedKO) : null;
  $: mem = $selectedKO ? $memory.get($selectedKO) : null;
  $: phys = $selectedKO ? $physics.get($selectedKO) : null;
  
  let observationStart: number | null = null;
  
  $: if ($selectedKO) {
    observationStart = Date.now();
  } else if (observationStart && $selectedKO === null) {
    observationStart = null;
  }
  
  function close() {
    if (observationStart && $selectedKO) {
      const duration = Date.now() - observationStart;
      if (duration > 1000) {
        recordObservation($selectedKO, duration).catch(console.error);
      }
    }
    selectedKO.set(null);
  }
  
  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  
  function getTraitBadges(traits: Record<string, boolean | undefined>): string[] {
    return Object.entries(traits)
      .filter(([_, v]) => v)
      .map(([k]) => k);
  }
</script>

{#if ko}
  <aside class="edit-panel">
    <header>
      <h2>{ko.title}</h2>
      <button class="close-btn" on:click={close}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </header>
    
    <div class="meta">
      <span class="type-badge">{ko.type}</span>
      {#each ko.tags as tag}
        <span class="tag">{tag}</span>
      {/each}
    </div>
    
    <div class="content">
      <pre>{ko.content}</pre>
    </div>
    
    <div class="divider"></div>
    
    {#if mem}
      <section class="memory-section">
        <h3>Memory</h3>
        <div class="stats-grid">
          <div class="stat">
            <span class="stat-value">{mem.observation_count}</span>
            <span class="stat-label">observations</span>
          </div>
          <div class="stat">
            <span class="stat-value">{mem.collision_count}</span>
            <span class="stat-label">collisions</span>
          </div>
          <div class="stat">
            <span class="stat-value">{Object.keys(mem.affinity_scores).length}</span>
            <span class="stat-label">affinities</span>
          </div>
          <div class="stat">
            <span class="stat-value">{Object.keys(mem.rivalry_scores).length}</span>
            <span class="stat-label">rivalries</span>
          </div>
        </div>
        
        {#if mem.last_observed}
          <p class="last-observed">Last observed: {formatDate(mem.last_observed)}</p>
        {/if}
        
        {#if Object.keys(mem.behavioral_traits).some(k => mem.behavioral_traits[k as keyof typeof mem.behavioral_traits])}
          <div class="traits">
            <h4>Traits</h4>
            <div class="trait-badges">
              {#each getTraitBadges(mem.behavioral_traits) as trait}
                <span class="trait-badge trait-{trait}">{trait}</span>
              {/each}
            </div>
          </div>
        {/if}
      </section>
    {/if}
    
    {#if phys}
      <section class="physics-section">
        <h3>Physics</h3>
        <div class="physics-stats">
          <div class="physics-stat">
            <span class="physics-label">Mass</span>
            <div class="physics-bar">
              <div class="physics-fill" style="width: {Math.min(100, phys.mass * 20)}%"></div>
            </div>
            <span class="physics-value">{phys.mass.toFixed(2)}</span>
          </div>
          <div class="physics-stat">
            <span class="physics-label">Entropy</span>
            <div class="physics-bar entropy">
              <div class="physics-fill" style="width: {phys.entropy * 100}%"></div>
            </div>
            <span class="physics-value">{phys.entropy.toFixed(2)}</span>
          </div>
        </div>
      </section>
    {/if}
    
    <footer>
      <span class="file-path">{ko.file_path}</span>
      <span class="date">Created {formatDate(ko.created_at)}</span>
    </footer>
  </aside>
{/if}

<style>
  .edit-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 360px;
    height: 100%;
    background: var(--bg-elevated, rgba(20, 20, 20, 0.98));
    border-left: 1px solid var(--border, #333);
    padding: 20px;
    overflow-y: auto;
    z-index: 200;
    animation: slideIn 0.2s ease-out;
  }
  
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  
  h2 {
    font-family: 'Literata', Georgia, serif;
    font-size: 18px;
    font-weight: 500;
    color: var(--text-primary, #fff);
    margin: 0;
    flex: 1;
    line-height: 1.4;
  }
  
  .close-btn {
    background: none;
    border: none;
    color: var(--text-muted, #666);
    cursor: pointer;
    padding: 4px;
    margin-left: 12px;
    flex-shrink: 0;
  }
  
  .close-btn:hover { color: var(--text-primary, #fff); }
  
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 16px;
  }
  
  .type-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--success, #44ff88);
    background: rgba(68, 255, 136, 0.15);
    padding: 3px 8px;
    border-radius: 4px;
  }
  
  .tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--text-muted, #888);
    background: var(--border, #333);
    padding: 3px 8px;
    border-radius: 4px;
  }
  
  .content {
    background: var(--bg, #0a0a0a);
    border: 1px solid var(--border, #333);
    border-radius: 8px;
    padding: 14px;
    max-height: 200px;
    overflow-y: auto;
  }
  
  pre {
    font-family: 'Literata', Georgia, serif;
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-secondary, #ccc);
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0;
  }
  
  .divider {
    height: 1px;
    background: var(--border, #333);
    margin: 20px 0;
  }
  
  section { margin-bottom: 20px; }
  
  h3 {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    color: var(--text-muted, #666);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 12px 0;
  }
  
  h4 {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--text-faint, #555);
    margin: 12px 0 8px 0;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .stat {
    background: var(--bg-elevated, #1a1a1a);
    border-radius: 6px;
    padding: 10px;
    text-align: center;
  }
  
  .stat-value {
    display: block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 20px;
    color: var(--text-primary, #fff);
  }
  
  .stat-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--text-muted, #666);
  }
  
  .last-observed {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-muted, #666);
    margin-top: 12px;
  }
  
  .trait-badges { display: flex; flex-wrap: wrap; gap: 6px; }
  
  .trait-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    padding: 3px 8px;
    border-radius: 4px;
    text-transform: capitalize;
  }
  
  .trait-restless { background: rgba(255, 170, 68, 0.2); color: #ffaa44; }
  .trait-stable { background: rgba(68, 136, 255, 0.2); color: #4488ff; }
  .trait-magnetic { background: rgba(136, 68, 255, 0.2); color: #8844ff; }
  .trait-volatile { background: rgba(255, 68, 68, 0.2); color: #ff4444; }
  .trait-forgotten { background: rgba(102, 102, 102, 0.2); color: #666; }
  .trait-ancient { background: rgba(212, 175, 55, 0.2); color: #d4af37; }
  .trait-emergent { background: rgba(68, 255, 136, 0.2); color: #44ff88; }
  
  .physics-stat {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  
  .physics-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-muted, #666);
    width: 60px;
  }
  
  .physics-bar {
    flex: 1;
    height: 6px;
    background: var(--border-subtle, #222);
    border-radius: 3px;
    overflow: hidden;
  }
  
  .physics-fill {
    height: 100%;
    background: #4488ff;
    border-radius: 3px;
    transition: width 0.3s ease;
  }
  
  .physics-bar.entropy .physics-fill {
    background: linear-gradient(90deg, #44ff88, #ffaa44, #ff4444);
  }
  
  .physics-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-muted, #888);
    width: 40px;
    text-align: right;
  }
  
  footer {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--border, #333);
  }
  
  .file-path {
    display: block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--text-faint, #555);
    margin-bottom: 4px;
  }
  
  .date {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--text-ghost, #444);
  }
</style>

