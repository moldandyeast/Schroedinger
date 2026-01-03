# Drift

*The physics canvas. Objects wander, collide, synthesize.*

---

## What It Is

Drift is the primary play space. Your knowledge objects float in a 2D physics simulation, drifting randomly, pulled by semantic gravity, and occasionally colliding. When collisions happen, you decide what to do.

This is **active observation**. You're not just browsing files—you're watching ideas move, noticing what attracts what, and creating new connections when unexpected pairs meet.

---

## Core Loop

```
DRIFT → COLLIDE → DECIDE → RELEASE
```

1. **Drift**: Objects wander with slight randomness. They don't sit still.
2. **Collide**: When two objects touch, the simulation pauses.
3. **Decide**: You choose to Snap (synthesize), Dismiss (create rivalry), or Ignore.
4. **Release**: The outcome affects future behavior. New syntheses have high entropy.

---

## Controls

### Navigation
| Action | Control |
|--------|---------|
| Pan | Click + drag on empty space |
| Zoom | Scroll wheel |
| Select object | Click on object |
| Drag object | Click + drag on object |

### Keyboard
| Key | Action |
|-----|--------|
| `⌘ + K` | Open search |
| `⌘ + N` | Create new KO |
| `Escape` | Close panel / deselect |
| `⌘ + Backspace` | Return to launcher |

### Collision Prompt
When two objects collide, you'll see a prompt:

- **Snap** — Create a synthesis. A new KO is born from the collision, linking the two parents. The child starts with high entropy (lots of movement).
- **Dismiss** — Create a rivalry. The objects will push apart in the future.
- **Ignore** — Do nothing. The collision is forgotten.

---

## Visual Language

### Object Appearance

Objects are circles. Their appearance tells you about their state:

| Visual | Meaning |
|--------|---------|
| Size | Mass (based on content length) |
| Glow | High entropy (recently created or collided) |
| Shimmer | Currently selected or hovered |
| Border color | Affinity (green = attracted, red = repelled) |

### Links

Lines between objects show relationships:

| Line Style | Meaning |
|------------|---------|
| Solid gold | Explicit link (from markdown `[[wikilink]]`) |
| Dashed blue | Collision-born link (synthesis created here) |
| Dotted gray | Semantic similarity (embedding space neighbors) |

---

## Physics

Objects don't just float randomly. Forces act on them:

1. **Drift** — Constant gentle randomness. Things move.
2. **Semantic Gravity** — Similar embeddings attract. Related ideas cluster.
3. **Affinity Pull** — Objects that have been snapped together attract.
4. **Rivalry Push** — Dismissed pairs repel.

The balance creates emergence. You'll see clusters form, ideas orbit each other, and occasionally a rogue object will drift into an unexpected neighborhood.

---

## The Accelerator

When you want to focus, use the Accelerator (top-right button or `⌘ + A`):

1. Select an anchor object
2. The system shows its **relatives** (linked objects) and **strangers** (semantically distant)
3. Force collisions between the anchor and strangers
4. Discover unexpected connections

This is **intentional serendipity**. You're not browsing—you're hunting for the collision that creates something new.

---

## Philosophy

Drift embodies the core Schroedinger principle: **your thoughts exist in superposition until observed.**

When you're not looking, ideas drift and mix. When you observe (open the app), you collapse the superposition—forcing yourself to notice what's happening, to decide on collisions, to create new connections.

The randomness isn't noise. It's the substrate of creativity. If everything were deterministic, you'd only ever see what you expected.

---

## Tips

1. **Let it run.** Don't constantly intervene. Watch patterns emerge.
2. **Trust the drift.** Unexpected collisions are the point.
3. **Snap generously.** Syntheses are cheap. Create many, delete later.
4. **Use the Accelerator sparingly.** It's for focused exploration, not the default mode.
5. **Notice the clusters.** Semantic gravity reveals hidden structure.

---

*Determinism is the enemy of discovery.*

