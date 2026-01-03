# ROADMAP

**Schroedinger: What's Next**

---

## Current State: v0.1.0

The core system is working:
- ✅ File watcher syncs vault to SQLite
- ✅ ONNX embeddings for semantic similarity
- ✅ Physics simulation with drift
- ✅ Collision detection and synthesis
- ✅ Object memory and behavioral traits
- ✅ Drift lens with full interactivity
- ✅ Multi-lens launcher architecture
- ✅ Documentation site

---

## Next: v0.2.0 — Complete the Lenses

### Observe Lens
*Watch the system evolve without intervention.*

- [ ] Auto-pilot mode: collisions resolve automatically
- [ ] Time controls: speed up, slow down, pause
- [ ] Heatmaps: visualize collision frequency
- [ ] Event log: what happened while you were away

### Accelerator Lens
*Full-screen focused collision experiments.*

- [ ] Dedicated focus mode (not a panel in Drift)
- [ ] Semantic distance visualization
- [ ] Batch experiments: queue multiple collision attempts
- [ ] History: track which collisions you've tried

### Void Lens
*Map the embedding space. See what's missing.*

- [ ] 2D projection of high-dimensional embeddings
- [ ] Cluster detection and labeling
- [ ] Gap analysis: highlight sparse regions
- [ ] "You have nothing about X" suggestions

### Archive Lens
*Browse and search. The traditional view.*

- [ ] List view with sort options
- [ ] Full-text search
- [ ] Tag filtering
- [ ] Quick preview without leaving list

---

## Future: v0.3.0 — Ecosystem

### Autonomous Behaviors
- [ ] Magnetic objects actively seek high-affinity targets
- [ ] Volatile objects trigger chain reactions
- [ ] Forgotten objects drift to edges, fade
- [ ] Emergent clusters form "constellations"

### Evolution History
- [ ] Timeline of object changes
- [ ] "Memory" visualization per KO
- [ ] Relationship graph over time

### Milestones
- [ ] Track emergent events (First Synthesis, Ancient, Volatile Cascade)
- [ ] Subtle celebration on milestones
- [ ] No gamification—just acknowledgment

---

## Someday

### Performance
- [ ] Test with 10,000+ KOs
- [ ] WebWorker for physics
- [ ] Viewport culling
- [ ] IndexedDB cache on client

### Import/Export
- [ ] Import from Obsidian
- [ ] Import from Roam
- [ ] Export to static site

### Agency Enhancements
- [ ] Object splitting (too much content)
- [ ] Object merging (overlapping ideas)
- [ ] "Calling" behavior (objects signal for attention)
- [ ] Rebellion clusters (groups that resist synthesis)

### Alternative Interfaces
- [ ] CLI for power users
- [ ] Mobile-friendly lens
- [ ] Voice interaction

---

## Principles

1. **Don't break the core loop.** Drift → Collide → Snap → Release → Evolve.
2. **Keep files sacred.** Never auto-modify markdown.
3. **Surprise over control.** Every feature should increase serendipity.
4. **Polish before features.** One good lens beats five mediocre ones.
5. **Test with real knowledge.** Use your own vault.

---

## Success Criteria

### For v0.2.0
- All 5 lenses functional
- 10 people use it for a week
- Average 5+ collisions per session
- Users report "unexpected discoveries"

### For v0.3.0
- Canvas feels "alive" when returning after days
- Behavioral traits are noticeable and meaningful
- The system develops a personality

---

*"A complex system that works is invariably found to have evolved from a simple system that worked."* — John Gall

---

## Historical Build Plan

The original 12-week build plan that got us to v0.1.0 is preserved in the git history. Key milestones:

- **Week 1-2**: Bridge foundation (file watcher, database, API)
- **Week 3-4**: Canvas (PixiJS, physics, drag)
- **Week 5-6**: Core mechanics (collision, synthesis, drift)
- **Week 7-8**: First playable (memory, traits, polish)
- **Week 9-12**: Agency system (embeddings, gravity, behaviors)

The system now runs. Time to make it sing.
