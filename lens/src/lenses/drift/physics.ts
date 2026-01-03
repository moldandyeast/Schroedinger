import Matter from 'matter-js';
import type { Traits } from '../../core';

const { Engine, World, Bodies, Body, Events, Vector } = Matter;

// Physics engine instance
let engine: Matter.Engine;
let bodies: Map<string, Matter.Body> = new Map();

// Collision tracking
let recentCollisions: Map<string, number> = new Map();
const COLLISION_COOLDOWN = 2000; // ms between collision events for same pair

/**
 * Initialize the physics engine
 */
export function initPhysics(): Matter.Engine {
  engine = Engine.create({
    gravity: { x: 0, y: 0 }, // No gravity - we use semantic gravity
  });
  
  return engine;
}

/**
 * Create a physics body for a KO
 */
export function createBody(
  id: string, 
  x: number, 
  y: number, 
  mass: number = 1,
  width: number = 200,
  height: number = 80
): Matter.Body {
  const body = Bodies.rectangle(x, y, width, height, {
    friction: 0.1,
    frictionAir: 0.03,
    restitution: 0.4,
    mass,
    label: id,
  });
  
  bodies.set(id, body);
  World.add(engine.world, body);
  
  return body;
}

/**
 * Remove a physics body
 */
export function removeBody(id: string): void {
  const body = bodies.get(id);
  if (body) {
    World.remove(engine.world, body);
    bodies.delete(id);
  }
}

/**
 * Get a physics body
 */
export function getBody(id: string): Matter.Body | undefined {
  return bodies.get(id);
}

/**
 * Update body position (for drag)
 */
export function setBodyPosition(id: string, x: number, y: number): void {
  const body = bodies.get(id);
  if (body) {
    Body.setPosition(body, { x, y });
    Body.setVelocity(body, { x: 0, y: 0 });
  }
}

/**
 * Apply random drift force based on entropy and traits
 */
export function applyDrift(id: string, entropy: number, traits: Traits, dt: number): void {
  const body = bodies.get(id);
  if (!body || body.isStatic) return;
  
  // Base noise scale from entropy
  let noiseScale = entropy * 0.00002;
  
  // Trait modifiers
  if (traits.restless) noiseScale *= 2.5;
  if (traits.stable) noiseScale *= 0.2;
  if (traits.volatile) noiseScale *= 1.5 + Math.random();
  if (traits.forgotten) noiseScale *= 0.5; // Forgotten objects drift slowly toward edges
  
  // Random force
  const force = {
    x: (Math.random() - 0.5) * noiseScale * dt,
    y: (Math.random() - 0.5) * noiseScale * dt,
  };
  
  Body.applyForce(body, body.position, force);
  
  // Forgotten objects drift toward edges
  if (traits.forgotten) {
    const edgeForce = {
      x: Math.sign(body.position.x) * 0.000005 * dt,
      y: Math.sign(body.position.y) * 0.000005 * dt,
    };
    Body.applyForce(body, body.position, edgeForce);
  }
}

/**
 * Apply semantic gravity between bodies
 */
export function applySemanticGravity(
  id: string, 
  otherId: string, 
  similarity: number, 
  dt: number
): void {
  const bodyA = bodies.get(id);
  const bodyB = bodies.get(otherId);
  if (!bodyA || !bodyB) return;
  
  const dx = bodyB.position.x - bodyA.position.x;
  const dy = bodyB.position.y - bodyA.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist < 1) return;
  
  // Attraction for similar, repulsion for too-similar (void mechanic)
  let force: number;
  if (similarity > 0.9) {
    // Too similar - push apart to reveal the void
    force = -0.00002 * dt;
  } else if (similarity > 0.5) {
    // Similar - attract
    force = similarity * 0.00001 * dt;
  } else {
    // Dissimilar - slight repulsion
    force = -0.000005 * dt;
  }
  
  const fx = (dx / dist) * force;
  const fy = (dy / dist) * force;
  
  Body.applyForce(bodyA, bodyA.position, { x: fx, y: fy });
}

/**
 * Apply affinity attraction
 */
export function applyAffinity(id: string, otherId: string, strength: number, dt: number): void {
  const bodyA = bodies.get(id);
  const bodyB = bodies.get(otherId);
  if (!bodyA || !bodyB) return;
  
  const dx = bodyB.position.x - bodyA.position.x;
  const dy = bodyB.position.y - bodyA.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist < 50) return; // Don't attract if already close
  
  const force = strength * 0.00002 * dt;
  const fx = (dx / dist) * force;
  const fy = (dy / dist) * force;
  
  Body.applyForce(bodyA, bodyA.position, { x: fx, y: fy });
}

/**
 * Apply rivalry repulsion
 */
export function applyRivalry(id: string, otherId: string, strength: number, dt: number): void {
  const bodyA = bodies.get(id);
  const bodyB = bodies.get(otherId);
  if (!bodyA || !bodyB) return;
  
  const dx = bodyB.position.x - bodyA.position.x;
  const dy = bodyB.position.y - bodyA.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist > 300) return; // Don't repel if already far
  
  const force = -strength * 0.00003 * dt;
  const fx = (dx / dist) * force;
  const fy = (dy / dist) * force;
  
  Body.applyForce(bodyA, bodyA.position, { x: fx, y: fy });
}

/**
 * Step the physics simulation
 */
export function step(dt: number): void {
  if (engine) {
    Engine.update(engine, dt);
  }
}

/**
 * Get all body positions
 */
export function getAllPositions(): Map<string, { x: number; y: number; vx: number; vy: number }> {
  const positions = new Map();
  for (const [id, body] of bodies) {
    positions.set(id, {
      x: body.position.x,
      y: body.position.y,
      vx: body.velocity.x,
      vy: body.velocity.y,
    });
  }
  return positions;
}

/**
 * Check for collisions
 */
export function setupCollisionDetection(
  onCollision: (idA: string, idB: string) => void
): void {
  Events.on(engine, 'collisionStart', (event) => {
    for (const pair of event.pairs) {
      const idA = pair.bodyA.label;
      const idB = pair.bodyB.label;
      
      // Skip if either body is being dragged
      if (pair.bodyA.isStatic || pair.bodyB.isStatic) continue;
      
      // Check cooldown
      const key = [idA, idB].sort().join(':');
      const lastCollision = recentCollisions.get(key);
      const now = Date.now();
      
      if (lastCollision && now - lastCollision < COLLISION_COOLDOWN) {
        continue;
      }
      
      recentCollisions.set(key, now);
      onCollision(idA, idB);
    }
  });
}

/**
 * Set body as static (during drag)
 */
export function setStatic(id: string, isStatic: boolean): void {
  const body = bodies.get(id);
  if (body) {
    Body.setStatic(body, isStatic);
  }
}

/**
 * Apply impulse (for volatile chain reactions)
 */
export function applyImpulse(id: string, direction: { x: number; y: number }, magnitude: number): void {
  const body = bodies.get(id);
  if (body) {
    Body.applyForce(body, body.position, {
      x: direction.x * magnitude,
      y: direction.y * magnitude,
    });
  }
}

/**
 * Clean up old collision records
 */
export function cleanupCollisions(): void {
  const now = Date.now();
  for (const [key, time] of recentCollisions) {
    if (now - time > COLLISION_COOLDOWN * 2) {
      recentCollisions.delete(key);
    }
  }
}

// ============ Autonomous Behaviors ============

/**
 * Make magnetic objects actively seek high-affinity targets
 */
export function applyAutonomousBehavior(
  id: string,
  traits: Traits,
  affinities: Record<string, number>,
  rivalries: Record<string, number>,
  dt: number
): void {
  const body = bodies.get(id);
  if (!body || body.isStatic) return;
  
  // Magnetic objects actively seek their strongest affinity
  if (traits.magnetic) {
    let strongestAffinity = { id: '', strength: 0 };
    for (const [otherId, strength] of Object.entries(affinities)) {
      if (strength > strongestAffinity.strength && bodies.has(otherId)) {
        strongestAffinity = { id: otherId, strength };
      }
    }
    
    if (strongestAffinity.id) {
      const target = bodies.get(strongestAffinity.id);
      if (target) {
        const dx = target.position.x - body.position.x;
        const dy = target.position.y - body.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 100) {
          // Move toward affinity
          const force = 0.00005 * strongestAffinity.strength * dt;
          Body.applyForce(body, body.position, {
            x: (dx / dist) * force,
            y: (dy / dist) * force,
          });
        }
      }
    }
  }
  
  // Volatile objects occasionally make sudden movements
  if (traits.volatile && Math.random() < 0.001) {
    const angle = Math.random() * Math.PI * 2;
    const impulse = 0.002 + Math.random() * 0.003;
    Body.applyForce(body, body.position, {
      x: Math.cos(angle) * impulse,
      y: Math.sin(angle) * impulse,
    });
    
    // Potentially trigger chain reaction in nearby volatile objects
    for (const [otherId, otherBody] of bodies) {
      if (otherId === id) continue;
      
      const dx = otherBody.position.x - body.position.x;
      const dy = otherBody.position.y - body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 150 && Math.random() < 0.3) {
        applyImpulse(otherId, { x: -dx / dist, y: -dy / dist }, 0.001);
      }
    }
  }
  
  // Emergent objects gravitate toward clusters
  if (traits.emergent) {
    // Find center of mass of all objects
    let cmX = 0, cmY = 0, count = 0;
    for (const [_, b] of bodies) {
      cmX += b.position.x;
      cmY += b.position.y;
      count++;
    }
    
    if (count > 1) {
      cmX /= count;
      cmY /= count;
      
      const dx = cmX - body.position.x;
      const dy = cmY - body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 50) {
        const force = 0.00002 * dt;
        Body.applyForce(body, body.position, {
          x: (dx / dist) * force,
          y: (dy / dist) * force,
        });
      }
    }
  }
}

/**
 * Get the center of the visible area
 */
export function getWorldBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  for (const [_, body] of bodies) {
    minX = Math.min(minX, body.position.x);
    maxX = Math.max(maxX, body.position.x);
    minY = Math.min(minY, body.position.y);
    maxY = Math.max(maxY, body.position.y);
  }
  
  return { minX, maxX, minY, maxY };
}

