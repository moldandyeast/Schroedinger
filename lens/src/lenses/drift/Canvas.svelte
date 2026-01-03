<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Application, Container, Graphics } from 'pixi.js';
  import { KOSprite } from './KOSprite';
  import * as physics from './physics';
  import { 
    kos, 
    physics as physicsStore, 
    memory,
    links,
    similarities,
    selectedKO,
    hoveredKO,
    activeCollision,
    updatePhysicsState,
    updatePhysics as apiUpdatePhysics, 
    recordObservation,
  } from '../../core';
  import type { KO, KOPhysics, Traits } from '../../core';

  let container: HTMLDivElement;
  let app: Application;
  let world: Container;
  let linkGraphics: Graphics;
  let sprites: Map<string, KOSprite> = new Map();
  let isDraggingWorld = false;
  let lastPointerPos = { x: 0, y: 0 };
  let animationFrame: number;
  let hoverStartTime: Map<string, number> = new Map();

  // Collision prompt
  export let onCollision: (koIdA: string, koIdB: string) => void = () => {};

  onMount(async () => {
    // Initialize PixiJS
    app = new Application();
    await app.init({
      resizeTo: container,
      backgroundColor: 0x0a0a0a,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    
    container.appendChild(app.canvas);
    
    // Create world container for pan/zoom
    world = new Container();
    world.x = app.screen.width / 2;
    world.y = app.screen.height / 2;
    app.stage.addChild(world);
    
    // Create graphics layer for links (below sprites)
    linkGraphics = new Graphics();
    world.addChild(linkGraphics);
    
    // Initialize physics engine
    physics.initPhysics();
    
    // Set up collision detection
    physics.setupCollisionDetection((idA, idB) => {
      console.log('💥 Collision:', idA, idB);
      activeCollision.set({ koIdA: idA, koIdB: idB });
      onCollision(idA, idB);
    });
    
    // Create sprites for existing KOs
    createSprites();
    
    // Subscribe to store changes
    const unsubKOs = kos.subscribe(() => createSprites());
    const unsubPhysics = physicsStore.subscribe(updateSprites);
    const unsubMemory = memory.subscribe(updateTraits);
    
    // Set up world panning
    app.canvas.addEventListener('pointerdown', handleWorldPointerDown);
    app.canvas.addEventListener('pointermove', handleWorldPointerMove);
    app.canvas.addEventListener('pointerup', handleWorldPointerUp);
    app.canvas.addEventListener('wheel', handleWheel);
    
    // Animation loop
    const animate = (timestamp: number) => {
      const dt = 16; // Approximate 60fps
      
      // Update physics simulation
      physics.step(dt);
      
      // Apply drift and semantic gravity to all bodies
      for (const [id, sprite] of sprites) {
        const p = $physicsStore.get(id);
        const m = $memory.get(id);
        if (p && m) {
          physics.applyDrift(id, p.entropy, m.behavioral_traits, dt);
          
          // Apply semantic gravity from similarities
          const sims = $similarities[id];
          if (sims) {
            for (const [otherId, similarity] of Object.entries(sims)) {
              if (sprites.has(otherId)) {
                physics.applySemanticGravity(id, otherId, similarity, dt);
              }
            }
          }
          
          // Apply affinities (stronger than semantic gravity)
          for (const [otherId, strength] of Object.entries(m.affinity_scores)) {
            physics.applyAffinity(id, otherId, strength * 2, dt);
          }
          
          // Apply rivalries
          for (const [otherId, strength] of Object.entries(m.rivalry_scores)) {
            physics.applyRivalry(id, otherId, strength * 2, dt);
          }
          
          // Apply autonomous behaviors
          physics.applyAutonomousBehavior(
            id,
            m.behavioral_traits,
            m.affinity_scores,
            m.rivalry_scores,
            dt
          );
        }
      }
      
      // Update sprite positions from physics
      const positions = physics.getAllPositions();
      for (const [id, pos] of positions) {
        const sprite = sprites.get(id);
        if (sprite) {
          sprite.setTargetPosition(pos.x, pos.y);
          sprite.update(dt);
        }
        
        // Update store
        updatePhysicsState(id, {
          position_x: pos.x,
          position_y: pos.y,
          velocity_x: pos.vx,
          velocity_y: pos.vy,
        });
      }
      
      // Draw links
      drawLinks();
      
      // Cleanup old collisions
      physics.cleanupCollisions();
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    // Save positions periodically
    const saveInterval = setInterval(savePositions, 5000);
    
    return () => {
      unsubKOs();
      unsubPhysics();
      unsubMemory();
      cancelAnimationFrame(animationFrame);
      clearInterval(saveInterval);
      app.destroy(true, { children: true });
    };
  });

  function drawLinks(): void {
    linkGraphics.clear();
    
    const currentLinks = $links;
    const currentPhysics = $physicsStore;
    
    for (const link of currentLinks) {
      const sourcePhys = currentPhysics.get(link.source_id);
      const targetPhys = currentPhysics.get(link.target_id);
      
      if (!sourcePhys || !targetPhys) continue;
      
      // Calculate link color based on type
      let color = 0x333333;
      let alpha = 0.3;
      let width = 1;
      
      if (link.link_type === 'collision') {
        color = 0x44ff88;
        alpha = 0.5;
        width = 2;
      } else if (link.link_type === 'agent') {
        color = 0x8844ff;
        alpha = 0.4;
        width = 1.5;
      }
      
      // Highlight links for selected KO
      if ($selectedKO === link.source_id || $selectedKO === link.target_id) {
        alpha = 0.8;
        width *= 1.5;
      }
      
      // Draw curved line
      const sx = sourcePhys.position_x;
      const sy = sourcePhys.position_y;
      const tx = targetPhys.position_x;
      const ty = targetPhys.position_y;
      
      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2;
      
      // Add slight curve
      const dx = tx - sx;
      const dy = ty - sy;
      const curvature = 0.1;
      const cx = mx - dy * curvature;
      const cy = my + dx * curvature;
      
      linkGraphics.moveTo(sx, sy);
      linkGraphics.quadraticCurveTo(cx, cy, tx, ty);
      linkGraphics.stroke({ color, alpha, width });
    }
    
    // Draw semantic similarity lines (fainter)
    const sims = $similarities;
    for (const [idA, simsForA] of Object.entries(sims)) {
      const physA = currentPhysics.get(idA);
      if (!physA) continue;
      
      for (const [idB, similarity] of Object.entries(simsForA)) {
        // Only draw if similarity is high and not already linked
        if (similarity < 0.6) continue;
        if (idA >= idB) continue; // Avoid drawing twice
        
        const physB = currentPhysics.get(idB);
        if (!physB) continue;
        
        // Check if already explicitly linked
        const alreadyLinked = currentLinks.some(
          l => (l.source_id === idA && l.target_id === idB) ||
               (l.source_id === idB && l.target_id === idA)
        );
        if (alreadyLinked) continue;
        
        const alpha = (similarity - 0.6) * 0.5; // 0 to 0.2
        
        linkGraphics.moveTo(physA.position_x, physA.position_y);
        linkGraphics.lineTo(physB.position_x, physB.position_y);
        linkGraphics.stroke({ 
          color: 0x4488ff, 
          alpha, 
          width: 0.5,
        });
      }
    }
  }

  function createSprites(): void {
    const currentKOs = $kos;
    const currentPhysics = $physicsStore;
    const currentMemory = $memory;
    
    // Remove sprites for deleted KOs
    for (const [id, sprite] of sprites) {
      if (!currentKOs.has(id)) {
        world.removeChild(sprite);
        physics.removeBody(id);
        sprites.delete(id);
      }
    }
    
    // Add sprites for new KOs
    for (const [id, ko] of currentKOs) {
      if (!sprites.has(id)) {
        const p = currentPhysics.get(id) || {
          ko_id: id,
          position_x: (Math.random() - 0.5) * 800,
          position_y: (Math.random() - 0.5) * 600,
          velocity_x: 0,
          velocity_y: 0,
          mass: 1,
          entropy: 1,
          is_anchored: false,
        };
        
        const m = currentMemory.get(id);
        const traits = m?.behavioral_traits || {};
        
        // Create physics body
        physics.createBody(id, p.position_x, p.position_y, p.mass);
        
        // Create sprite
        const sprite = new KOSprite(ko, p, traits);
        sprite.onDragStart = handleSpriteDragStart;
        sprite.onDragMove = handleSpriteDragMove;
        sprite.onDragEnd = handleSpriteDragEnd;
        sprite.onHover = handleSpriteHover;
        sprite.onClick = handleSpriteClick;
        
        sprites.set(id, sprite);
        world.addChild(sprite);
      }
    }
  }

  function updateSprites(): void {
    for (const [id, p] of $physicsStore) {
      const sprite = sprites.get(id);
      if (sprite) {
        sprite.updatePhysics(p);
      }
    }
  }

  function updateTraits(): void {
    for (const [id, m] of $memory) {
      const sprite = sprites.get(id);
      if (sprite) {
        sprite.updateTraits(m.behavioral_traits);
      }
    }
  }

  // ============ Sprite Event Handlers ============

  function handleSpriteDragStart(sprite: KOSprite): void {
    physics.setStatic(sprite.koId, true);
    selectedKO.set(sprite.koId);
  }

  function handleSpriteDragMove(sprite: KOSprite, x: number, y: number): void {
    physics.setBodyPosition(sprite.koId, x, y);
  }

  function handleSpriteDragEnd(sprite: KOSprite, x: number, y: number): void {
    physics.setStatic(sprite.koId, false);
    physics.setBodyPosition(sprite.koId, x, y);
    
    // Save position to server
    apiUpdatePhysics(sprite.koId, { position_x: x, position_y: y });
  }

  function handleSpriteHover(sprite: KOSprite, isHovered: boolean): void {
    const id = sprite.koId;
    
    if (isHovered) {
      hoveredKO.set(id);
      hoverStartTime.set(id, Date.now());
      sprite.setGlow(true);
    } else {
      hoveredKO.set(null);
      sprite.setGlow(false);
      
      // Record observation if hovered for > 500ms
      const startTime = hoverStartTime.get(id);
      if (startTime) {
        const duration = Date.now() - startTime;
        if (duration > 500) {
          recordObservation(id, duration).catch(console.error);
        }
        hoverStartTime.delete(id);
      }
    }
  }

  function handleSpriteClick(sprite: KOSprite): void {
    selectedKO.set(sprite.koId);
  }

  // ============ World Event Handlers ============

  function handleWorldPointerDown(e: PointerEvent): void {
    if (e.target === app.canvas) {
      isDraggingWorld = true;
      lastPointerPos = { x: e.clientX, y: e.clientY };
    }
  }

  function handleWorldPointerMove(e: PointerEvent): void {
    if (isDraggingWorld) {
      const dx = e.clientX - lastPointerPos.x;
      const dy = e.clientY - lastPointerPos.y;
      
      world.x += dx;
      world.y += dy;
      
      lastPointerPos = { x: e.clientX, y: e.clientY };
    }
  }

  function handleWorldPointerUp(): void {
    isDraggingWorld = false;
  }

  function handleWheel(e: WheelEvent): void {
    e.preventDefault();
    
    const scaleFactor = 1 - e.deltaY * 0.001;
    const newScale = Math.max(0.1, Math.min(3, world.scale.x * scaleFactor));
    
    world.scale.set(newScale);
  }

  async function savePositions(): Promise<void> {
    const positions = physics.getAllPositions();
    const updates = [];
    
    for (const [id, pos] of positions) {
      updates.push({
        ko_id: id,
        position_x: pos.x,
        position_y: pos.y,
        velocity_x: pos.vx,
        velocity_y: pos.vy,
      });
    }
    
    if (updates.length > 0) {
      try {
        await fetch('/api/physics', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
      } catch (e) {
        console.warn('Failed to save positions:', e);
      }
    }
  }
</script>

<div bind:this={container} class="canvas-container"></div>

<style>
  .canvas-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
</style>
