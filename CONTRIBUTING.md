# Contributing to Schroedinger

## Data Protection

**User data must NEVER be committed to the repository.**

The following directories contain personal data and are gitignored:

| Directory | Contents | Protection |
|-----------|----------|------------|
| `vault/` | User's markdown notes | Gitignored except `_examples/` |
| `state/` | SQLite database | Fully gitignored |
| `models/*.onnx` | Large binary models | Gitignored (downloaded on setup) |

### Before Committing

Always verify no personal data is staged:

```bash
git status
git diff --cached
```

If you see any `.md` files from `vault/` (except `_examples/`), unstage them:

```bash
git reset HEAD vault/*.md
```

## Development Setup

```bash
# Clone the repo
git clone <repo-url>
cd schroedinger

# Run setup (downloads model, copies examples)
npm install
npm run setup

# Install sub-packages
cd bridge && npm install
cd ../lens && npm install
cd ..

# Start development servers
npm run dev
```

## Architecture

```
schroedinger/
├── bridge/           # Backend (Node.js + Hono + SQLite)
├── lens/             # Frontend (Svelte + PixiJS)
├── vault/            # User data (gitignored)
│   └── _examples/    # Example files (committed)
├── state/            # Database (gitignored)
├── models/           # ONNX models (gitignored)
├── site/             # Documentation website
├── scripts/          # Setup scripts
└── docs/             # Additional documentation
```

## Code Style

- TypeScript for all new code
- Svelte 5 runes syntax for components
- No default exports (except Svelte components)
- Descriptive variable names

## Philosophy

Before adding a feature, ask:

1. **Does it increase randomness?** If it makes the system more predictable, reconsider.
2. **Does it respect user data?** Everything stays local.
3. **Is it withered technology?** Prefer proven, boring tech.
4. **Does it feel alive?** Objects should have agency, not be obedient.

## Testing

```bash
# Start the bridge
npm run dev:bridge

# In another terminal, test the API
curl http://localhost:3333/api/kos
```

## Documentation Site

```bash
# Build the site
npm run site:build

# Serve locally
npm run site:serve
# → http://localhost:8080
```

