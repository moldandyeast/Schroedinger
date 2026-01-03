# PLAY DOCUMENT

*Schroedinger as a game design problem*

---

## Core Loop

```
        ┌──────────────────────┐
        │                      │
        ▼                      │
   ┌─────────┐           ┌─────────┐
   │  DRIFT  │──────────▶│ COLLIDE │
   └─────────┘           └─────────┘
        ▲                      │
        │                      ▼
   ┌─────────┐           ┌─────────┐
   │ RELEASE │◀──────────│  SNAP   │
   └─────────┘           └─────────┘
        │                      
        ▼                      
   ┌─────────┐                 
   │ EVOLVE  │  ← Objects remember and adapt
   └─────────┘                 
```

**Drift**: Objects move through the canvas based on entropy, semantic gravity, and behavioral traits. This is the randomness engine—the source of unexpected encounters.

**Collide**: When two objects touch, the game pauses for a decision. This is the core mechanic. The collision prompt is the central interaction.

**Snap**: Name the connection. A new synthesis is born—a bridge between two previously unconnected thoughts. This is the reward. The moment of creation.

**Release**: The new synthesis enters the world with high entropy. It's unstable, energetic, seeking its own collisions.

**Evolve**: Objects remember what happened. Affinities form. Rivalries develop. Traits emerge. The canvas becomes a living ecosystem.

---

## Physics of Thought

Every Knowledge Object has physical properties:

| Property | Description | Effect |
|----------|-------------|--------|
| **Mass** | Accumulated attention | Higher mass = more gravitational pull, slower movement |
| **Entropy** | Freshness/instability | Higher entropy = more random movement, shimmer effect |
| **Position** | Location on canvas | Persisted between sessions |
| **Velocity** | Current momentum | Decays over time, affected by forces |

### Forces

| Force | Source | Effect |
|-------|--------|--------|
| **Drift** | Base entropy + noise | Random wandering, strength based on entropy |
| **Semantic Gravity** | Embedding similarity | Similar thoughts attract (>0.5), very similar repel (>0.9) |
| **Affinity Pull** | Previous syntheses | Objects that created together drift together |
| **Rivalry Push** | Previous dismissals | Objects that were rejected push apart |
| **Trait Modifiers** | Behavioral state | Restless = 2.5x drift, Stable = 0.2x drift |

---

## Object Agency System

### Memory

Every object remembers:

```typescript
{
  observation_count: number,      // How often focused
  total_observation_time: number, // Cumulative attention (ms)
  collision_count: number,        // How many collisions
  affinity_scores: { [id]: number }, // Positive relationships
  rivalry_scores: { [id]: number },  // Negative relationships
  evolution_history: Event[]      // What happened
}
```

### Behavioral Traits

| Trait | Trigger | Behavior | Randomness Effect |
|-------|---------|----------|-------------------|
| **Restless** | Low observation, high drift | Moves faster, seeks collisions | 2.5x drift multiplier |
| **Stable** | High observation, many links | Resists movement | 0.2x drift multiplier |
| **Magnetic** | Many affinities | Actively seeks high-affinity targets | Autonomous seeking behavior |
| **Volatile** | Many rivalries | Sudden movements, chain reactions | Random impulses, affects neighbors |
| **Forgotten** | No observation 30+ days | Fades, drifts to edges | 0.5x drift toward periphery |
| **Ancient** | 20+ observations, high mass | Gold border, gravitational center | High mass, slow but influential |

### Autonomous Behaviors

Objects with certain traits act on their own:

- **Magnetic** objects periodically move toward their strongest affinity
- **Volatile** objects occasionally trigger impulses that affect nearby objects
- **Emergent** objects (from synthesis) gravitate toward the center of mass

---

## Mechanics

### The Collision

When two objects touch:

1. Physics pauses for those objects
2. Collision prompt appears with both titles
3. Player chooses:
   - **Snap**: Enter a connection name → create synthesis
   - **Dismiss**: Mark as incompatible → create rivalry
   - **Ignore**: No effect, collision cooldown starts

### Synthesis Creation

When you snap:

1. New markdown file created with frontmatter linking parents
2. New object spawns between parents with high entropy
3. Both parents gain affinity for each other
4. Both parents gain affinity for the child
5. Links created in database

### The Accelerator

Select any object, click Accelerator:

1. Shows the **anchor** (selected object)
2. Shows **relatives** (objects already linked)
3. Shows **strangers** (random unlinked objects)
4. Focus button gathers them together for intentional collision

This is the controlled experiment—when you want to deliberately seek connections.

---

## Visual Language

### Object States

| State | Visual |
|-------|--------|
| Default | Dark card, white text, subtle border |
| Hovered | Glow effect (green/blue/gold based on traits) |
| Selected | Scale 1.02, info panel opens |
| High entropy | Shimmer effect, slight position noise |
| Forgotten | 40% opacity, drifts to edges |
| Ancient | Gold border, 2px width |
| Magnetic | Blue glow |
| Volatile | Red border, occasional sparks |

### Link Types

| Type | Visual |
|------|--------|
| Explicit | Gray line, straight |
| Collision (synthesis) | Green curved line, 2px |
| Agent (autonomous) | Purple curved line, 1.5px |
| Semantic similarity | Blue dotted line, very faint |

---

## Progression

There is no win state. But there are emergent milestones:

| Milestone | Trigger |
|-----------|---------|
| First Synthesis | Create first connection |
| Network | 10 objects with at least one link each |
| Constellation | 5 objects in mutual affinity cluster |
| Ancient | First object reaches Ancient trait |
| Volatile Cascade | Chain reaction of 3+ volatile objects |
| Resurrection | Forgotten object resurfaces via collision |
| Void Discovery | Notice a gap in your semantic map |

---

## Failure States

The system fails when:

| State | Cause | Effect |
|-------|-------|--------|
| **Stagnation** | No drift, no collisions | No new connections form |
| **Overload** | Too many objects, too much noise | Can't focus, collisions meaningless |
| **Isolation** | All objects far apart, no gravity | No emergent clusters |
| **Determinism** | User controls everything | No surprises, no discovery |

The last one is the worst. If the user can predict exactly what will happen, the system has failed its purpose.

---

## Design Principles

1. **Randomness is the engine** — Without drift, nothing happens
2. **Collisions are the game** — The prompt is the core mechanic
3. **Memory creates meaning** — Objects that remember feel alive
4. **Traits amplify unpredictability** — Behaviors create emergent complexity
5. **The void is luminous** — Gaps are features, not bugs
6. **Control is the enemy** — The less you command, the more you discover

---

## Future Play Modes

### Observation Mode
No interaction. Just watch the system evolve. Objects drift, collide with each other autonomously, synthesize based on embedding similarity. A screensaver for your knowledge.

### Archeology Mode  
Start with a forgotten object. See what it collides with. Rediscover old ideas.

### Accelerator Tournament
Pick an anchor. Get 5 random strangers. You have 60 seconds to find connections. How many syntheses can you create?

### Void Mapping
Visualize embedding space. See the clusters. See the gaps. What's missing?
