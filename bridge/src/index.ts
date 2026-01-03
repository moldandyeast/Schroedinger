import { resolve } from 'path';
import { mkdir } from 'fs/promises';
import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import { initDB, closeDB, getAllKOs, storeEmbedding } from './db.js';
import { initEmbeddings, isEmbeddingsAvailable } from './embeddings.js';
import { watchVault } from './watcher.js';
import { createServer, broadcast, registerWSClient, unregisterWSClient } from './server.js';

// Configuration
const PORT = parseInt(process.env.PORT || '3333');
const VAULT_PATH = resolve(process.cwd(), process.env.VAULT_PATH || 'vault');
const STATE_PATH = resolve(process.cwd(), process.env.STATE_PATH || 'state');
const DB_PATH = resolve(STATE_PATH, 'schroedinger.db');

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ███████╗ ██████╗██╗  ██╗██████╗  ██████╗ ███████╗  ║
║   ██╔════╝██╔════╝██║  ██║██╔══██╗██╔═══██╗██╔════╝  ║
║   ███████╗██║     ███████║██████╔╝██║   ██║█████╗    ║
║   ╚════██║██║     ██╔══██║██╔══██╗██║   ██║██╔══╝    ║
║   ███████║╚██████╗██║  ██║██║  ██║╚██████╔╝███████╗  ║
║   ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝  ║
║                                                       ║
║   The Bridge - Local Knowledge Server                 ║
║   Determinism is the enemy of discovery.              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
`);

  // Ensure state directory exists
  await mkdir(STATE_PATH, { recursive: true });
  
  // Initialize database
  console.log(`📦 Initializing database: ${DB_PATH}`);
  initDB(DB_PATH);
  
  // Initialize embeddings
  await initEmbeddings();
  
  // Create Hono app
  const app = createServer(VAULT_PATH);
  
  // Set up WebSocket
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
  
  // Add WebSocket route
  app.get('/ws', upgradeWebSocket((c) => ({
    onOpen(_event, ws) {
      const client = {
        send: (data: string) => ws.send(data),
      };
      (ws as any).__client = client;
      registerWSClient(client);
      ws.send(JSON.stringify({ type: 'connected' }));
    },
    onMessage(event, ws) {
      try {
        const data = JSON.parse(event.data.toString());
        console.log('📥 WS message:', data.type);
      } catch (e) {
        // Ignore non-JSON messages
      }
    },
    onClose(_event, ws) {
      const client = (ws as any).__client;
      if (client) {
        unregisterWSClient(client);
      }
    },
  })));
  
  // Start file watcher
  const watcher = watchVault(VAULT_PATH, (message) => {
    broadcast(message);
  });
  
  // Generate embeddings for existing KOs
  if (isEmbeddingsAvailable()) {
    console.log('🧠 Generating embeddings for existing KOs...');
    const kos = getAllKOs();
    for (const ko of kos) {
      await storeEmbedding(ko.id, `${ko.title} ${ko.content}`);
    }
    console.log(`🧠 Generated ${kos.length} embeddings`);
  }
  
  // Start server
  console.log(`🚀 Starting server on http://localhost:${PORT}`);
  
  const server = serve({
    fetch: app.fetch,
    port: PORT,
  }, (info) => {
    console.log(`
┌─────────────────────────────────────────────────────────┐
│  Bridge is running!                                     │
│                                                         │
│  REST API:    http://localhost:${PORT}/api              │
│  WebSocket:   ws://localhost:${PORT}/ws                 │
│  Vault:       ${VAULT_PATH.padEnd(43)}│
│                                                         │
│  Endpoints:                                             │
│    GET  /api/kos           - List all KOs               │
│    GET  /api/kos/:id       - Get single KO              │
│    POST /api/kos           - Create KO                  │
│    GET  /api/random?n=5    - Random KOs                 │
│    GET  /api/physics       - All physics states         │
│    POST /api/observe/:id   - Record observation         │
│    POST /api/collision     - Record collision           │
│    POST /api/synthesis     - Create synthesis           │
│    GET  /api/accelerator/:id - Particle accelerator     │
│                                                         │
│  Press Ctrl+C to stop                                   │
└─────────────────────────────────────────────────────────┘
`);
  });
  
  // Inject WebSocket handling
  injectWebSocket(server);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    await watcher.close();
    closeDB();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down...');
    await watcher.close();
    closeDB();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
