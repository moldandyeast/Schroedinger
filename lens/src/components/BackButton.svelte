<script lang="ts">
  import { navigateTo } from '../core';
</script>

<button class="back-btn" on:click={() => navigateTo('launcher')} title="Back to launcher (⌘⌫)">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
</button>

<style>
  .back-btn {
    position: fixed;
    top: 20px;
    left: 20px;
    width: 40px;
    height: 40px;
    background: var(--bg-elevated, rgba(26, 26, 26, 0.8));
    border: 1px solid var(--border, #333);
    border-radius: 8px;
    color: var(--text-muted, #888);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    z-index: 100;
  }
  
  .back-btn:hover {
    background: var(--bg-elevated-hover, rgba(40, 40, 40, 0.9));
    color: var(--text-primary, #fff);
    border-color: var(--border-subtle, #444);
  }
</style>

