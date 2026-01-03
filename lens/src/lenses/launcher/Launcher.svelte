<script lang="ts">
  /**
   * Launcher - The app store for Schroedinger lenses.
   * Entry point for selecting which lens to use.
   */
  import { onMount } from 'svelte';
  import { theme, fetchKOs, navigateTo } from '../../core';
  import type { LensId } from '../../core';
  import { LENSES, DOCS } from '../registry';
  
  let koCount = 0;
  let connectionStatus: 'connecting' | 'connected' | 'error' = 'connecting';
  let hoveredApp: string | null = null;
  let time = new Date();
  
  onMount(async () => {
    theme.init();
    
    const interval = setInterval(() => {
      time = new Date();
    }, 1000);
    
    try {
      const kos = await fetchKOs();
      koCount = kos.length;
      connectionStatus = 'connected';
    } catch (e) {
      connectionStatus = 'error';
    }
    
    return () => clearInterval(interval);
  });
  
  function handleLaunch(appId: string, ready: boolean) {
    if (ready) {
      navigateTo(appId as LensId);
    }
  }
  
  function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }
  
  function getAppColor(app: typeof LENSES[0]): string {
    return $theme === 'dark' ? app.color : app.colorLight;
  }
</script>

<div class="launcher" class:light={$theme === 'light'}>
  <div class="background">
    <div class="grid"></div>
    <div class="glow"></div>
  </div>
  
  <header>
    <div class="logo">
      <span class="symbol">ψ</span>
      <span class="name">SCHROEDINGER</span>
    </div>
    <div class="header-right">
      <button class="theme-toggle" on:click={() => theme.toggle()} title="Toggle theme">
        {#if $theme === 'dark'}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        {:else}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        {/if}
      </button>
      <div class="status">
        <span class="time">{formatTime(time)}</span>
        <span class="divider">·</span>
        {#if connectionStatus === 'connected'}
          <span class="connected">
            <span class="dot"></span>
            {koCount} objects
          </span>
        {:else if connectionStatus === 'connecting'}
          <span class="connecting">connecting...</span>
        {:else}
          <span class="error">bridge offline</span>
        {/if}
      </div>
    </div>
  </header>
  
  <main>
    <div class="intro">
      <p class="tagline">Your thoughts exist in superposition until observed.</p>
      <p class="subtitle">Choose an instrument.</p>
    </div>
    
    <div class="apps">
      {#each LENSES as app}
        <div 
          class="app-card" 
          class:ready={app.ready}
          class:hovered={hoveredApp === app.id}
          style="--app-color: {getAppColor(app)}"
          on:mouseenter={() => hoveredApp = app.id}
          on:mouseleave={() => hoveredApp = null}
          role="group"
        >
          <button 
            class="app-main"
            on:click={() => handleLaunch(app.id, app.ready)}
            disabled={!app.ready}
          >
            <div class="app-icon">{app.icon}</div>
            <div class="app-content">
              <h2 class="app-name">{app.name}</h2>
              <p class="app-description">{app.description}</p>
            </div>
          </button>
          <a href={app.docUrl} target="_blank" class="app-docs" title="View documentation">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </a>
          {#if !app.ready}
            <span class="coming-soon">soon</span>
          {/if}
          <div class="app-glow"></div>
        </div>
      {/each}
    </div>
  </main>
  
  <footer>
    <div class="footer-left">
      <nav class="docs-nav">
        {#each DOCS as doc}
          <a href="/docs/{doc.id}.html" target="_blank" class="doc-link" title={doc.description}>
            {doc.name}
          </a>
        {/each}
      </nav>
      <p class="philosophy">file over app · local first · determinism is the enemy</p>
    </div>
    <p class="vault-path">~/vault</p>
  </footer>
</div>

<style>
  /* CSS Variables for theming */
  .launcher {
    --bg: #0a0a0a;
    --bg-elevated: rgba(20, 20, 20, 0.8);
    --bg-elevated-hover: rgba(25, 25, 25, 0.9);
    --border: #252525;
    --border-subtle: #333;
    --text-primary: #ffffff;
    --text-secondary: #ccc;
    --text-muted: #666;
    --text-faint: #444;
    --text-ghost: #333;
    --accent: #c9a227;
    --accent-glow: rgba(201, 162, 39, 0.08);
    --grid-line: rgba(255, 255, 255, 0.02);
    --success: #44ff88;
    --error: #ff4444;
    
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    background: var(--bg);
    transition: background 0.3s ease;
  }
  
  .launcher.light {
    --bg: #faf9f7;
    --bg-elevated: rgba(255, 255, 255, 0.9);
    --bg-elevated-hover: rgba(255, 255, 255, 0.95);
    --border: #e0ded8;
    --border-subtle: #d0cec8;
    --text-primary: #1a1a1a;
    --text-secondary: #333;
    --text-muted: #666;
    --text-faint: #999;
    --text-ghost: #bbb;
    --accent: #9a7b1c;
    --accent-glow: rgba(154, 123, 28, 0.1);
    --grid-line: rgba(0, 0, 0, 0.03);
    --success: #1a8a4a;
    --error: #cc3333;
  }
  
  .background { position: absolute; inset: 0; z-index: 0; }
  
  .grid {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(var(--grid-line) 1px, transparent 1px),
      linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }
  
  .glow {
    position: absolute;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 400px;
    background: radial-gradient(ellipse, var(--accent-glow) 0%, transparent 60%);
    pointer-events: none;
  }
  
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 32px;
    position: relative;
    z-index: 1;
  }
  
  .header-right { display: flex; align-items: center; gap: 16px; }
  
  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .theme-toggle:hover { border-color: var(--accent); color: var(--accent); }
  
  .logo { display: flex; align-items: center; gap: 12px; }
  
  .symbol {
    font-size: 28px;
    color: var(--accent);
    font-family: 'Times New Roman', serif;
    font-style: italic;
  }
  
  .name {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.15em;
    color: var(--text-muted);
  }
  
  .status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--text-faint);
  }
  
  .time { color: var(--text-faint); }
  .divider { color: var(--text-ghost); }
  .connected { display: flex; align-items: center; gap: 6px; color: var(--success); }
  
  .dot {
    width: 6px;
    height: 6px;
    background: var(--success);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }
  
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  
  .connecting { color: var(--text-muted); }
  .error { color: var(--error); }
  
  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 32px;
    position: relative;
    z-index: 1;
  }
  
  .intro { text-align: center; margin-bottom: 48px; }
  
  .tagline {
    font-family: 'Literata', Georgia, serif;
    font-size: 24px;
    font-style: italic;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }
  
  .subtitle {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: var(--text-faint);
    letter-spacing: 0.05em;
  }
  
  .apps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
    max-width: 900px;
    width: 100%;
  }
  
  .app-card {
    position: relative;
    display: flex;
    align-items: stretch;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 12px;
    transition: all 0.3s ease;
    overflow: hidden;
  }
  
  .app-card:not(.ready) { opacity: 0.5; }
  
  .app-card.ready:hover {
    border-color: var(--app-color);
    background: var(--bg-elevated-hover);
    transform: translateY(-2px);
  }
  
  .app-card.ready:hover .app-icon {
    color: var(--app-color);
    text-shadow: 0 0 20px var(--app-color);
  }
  
  .app-card.ready:hover .app-glow { opacity: 1; }
  
  .app-main {
    flex: 1;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
  }
  
  .app-main:disabled { cursor: not-allowed; }
  
  .app-docs {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    color: var(--text-faint);
    border-left: 1px solid var(--border);
    transition: all 0.2s ease;
    text-decoration: none;
  }
  
  .app-docs:hover {
    color: var(--accent);
    background: var(--bg);
  }
  
  .app-glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, var(--app-color), transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    mix-blend-mode: overlay;
  }
  
  .light .app-glow { mix-blend-mode: multiply; }
  .light .app-card.ready:hover .app-glow { opacity: 0.1; }
  
  .app-icon {
    font-size: 32px;
    color: var(--text-faint);
    transition: all 0.3s ease;
    flex-shrink: 0;
    width: 40px;
    text-align: center;
  }
  
  .app-content { flex: 1; min-width: 0; }
  
  .app-name {
    font-family: 'Literata', Georgia, serif;
    font-size: 18px;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0 0 6px 0;
  }
  
  .app-description {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1.5;
    margin: 0;
  }
  
  .coming-soon {
    position: absolute;
    top: 12px;
    right: 12px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-faint);
    background: var(--bg);
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid var(--border-subtle);
  }
  
  footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 24px 32px;
    position: relative;
    z-index: 1;
  }
  
  .footer-left { display: flex; flex-direction: column; gap: 12px; }
  .docs-nav { display: flex; gap: 20px; }
  
  .doc-link {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
    text-decoration: none;
    letter-spacing: 0.02em;
    transition: color 0.2s ease;
    position: relative;
  }
  
  .doc-link::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 1px;
    background: var(--accent);
    transition: width 0.2s ease;
  }
  
  .doc-link:hover { color: var(--accent); }
  .doc-link:hover::after { width: 100%; }
  
  .philosophy {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-ghost);
    letter-spacing: 0.05em;
  }
  
  .vault-path {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-faint);
  }
  
  @media (max-width: 768px) {
    .apps { grid-template-columns: 1fr; }
    .tagline { font-size: 20px; }
    header, footer { padding: 16px 20px; }
    main { padding: 0 20px; }
  }
</style>

