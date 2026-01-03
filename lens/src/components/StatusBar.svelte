<script lang="ts">
  import { koCount, orphanCount, isConnected } from '../core';
</script>

<div class="status-bar">
  <div class="status-item">
    <span class="label">KOs</span>
    <span class="value">{$koCount}</span>
  </div>
  <div class="status-item">
    <span class="label">Orphans</span>
    <span class="value">{$orphanCount}</span>
  </div>
  <div class="status-item" class:connected={$isConnected}>
    <span class="dot"></span>
    <span class="label">{$isConnected ? 'Connected' : 'Disconnected'}</span>
  </div>
</div>

<style>
  .status-bar {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 24px;
    background: var(--bg-elevated, rgba(26, 26, 26, 0.9));
    border: 1px solid var(--border, #333);
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
    color: var(--text-muted, #666);
  }
  
  .status-item .value {
    color: var(--text-primary, #fff);
  }
  
  .status-item .dot {
    width: 6px;
    height: 6px;
    background: var(--text-muted, #666);
    border-radius: 50%;
  }
  
  .status-item.connected .dot {
    background: var(--success, #44ff88);
  }
  
  .status-item.connected .label {
    color: var(--success, #44ff88);
  }
</style>

