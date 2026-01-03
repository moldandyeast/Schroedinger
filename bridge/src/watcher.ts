import chokidar from 'chokidar';
import { parseMarkdown } from './parser.js';
import { 
  upsertKO, 
  deleteKOByPath, 
  getKOByPath,
  initPhysics, 
  initMemory,
  storeEmbedding,
  deleteEmbedding,
} from './db.js';
import type { KO, WSMessage } from './types.js';

type ChangeHandler = (message: WSMessage) => void;

/**
 * Watch a vault directory for markdown file changes
 */
export function watchVault(vaultPath: string, onChange: ChangeHandler): chokidar.FSWatcher {
  console.log(`👁️  Watching vault: ${vaultPath}`);
  
  const watcher = chokidar.watch(vaultPath, {
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
    ignored: [
      /(^|[\/\\])\../, // Ignore dotfiles
      /node_modules/,
      (path: string) => !path.endsWith('.md') && !path.includes('/'), // Only .md files
    ],
  });

  watcher.on('add', async (filePath) => {
    // Only process .md files
    if (!filePath.endsWith('.md')) return;
    
    try {
      const relativePath = filePath.replace(vaultPath + '/', '');
      console.log(`📄 File added: ${relativePath}`);
      
      const parsed = await parseMarkdown(filePath);
      const ko = upsertKO({ ...parsed, file_path: relativePath });
      
      // Initialize physics with random position
      initPhysics(ko.id);
      
      // Initialize empty memory
      initMemory(ko.id);
      
      // Generate embedding (async, don't block)
      storeEmbedding(ko.id, `${ko.title} ${ko.content}`).catch(console.error);
      
      onChange({ 
        type: 'file:created', 
        ko,
      });
    } catch (error) {
      console.error(`Error processing added file ${filePath}:`, error);
    }
  });

  watcher.on('change', async (filePath) => {
    // Only process .md files
    if (!filePath.endsWith('.md')) return;
    
    try {
      const relativePath = filePath.replace(vaultPath + '/', '');
      console.log(`✏️  File changed: ${relativePath}`);
      
      // Check if content actually changed (by hash)
      const existing = getKOByPath(relativePath);
      const parsed = await parseMarkdown(filePath);
      
      if (existing && existing.content_hash === parsed.content_hash) {
        // No actual content change, skip
        return;
      }
      
      const ko = upsertKO({ ...parsed, file_path: relativePath });
      
      // Re-generate embedding
      storeEmbedding(ko.id, `${ko.title} ${ko.content}`).catch(console.error);
      
      onChange({ 
        type: 'file:changed', 
        ko,
        previousHash: existing?.content_hash,
      });
    } catch (error) {
      console.error(`Error processing changed file ${filePath}:`, error);
    }
  });

  watcher.on('unlink', (filePath) => {
    // Only process .md files
    if (!filePath.endsWith('.md')) return;
    
    try {
      const relativePath = filePath.replace(vaultPath + '/', '');
      console.log(`🗑️  File deleted: ${relativePath}`);
      
      const existing = getKOByPath(relativePath);
      const deleted = deleteKOByPath(relativePath);
      
      if (deleted && existing) {
        deleteEmbedding(existing.id);
        onChange({ 
          type: 'file:deleted', 
          path: relativePath,
          ko: existing,
        });
      }
    } catch (error) {
      console.error(`Error processing deleted file ${filePath}:`, error);
    }
  });

  watcher.on('error', (error) => {
    console.error('Watcher error:', error);
  });

  watcher.on('ready', () => {
    console.log('👁️  Initial scan complete. Watching for changes...');
  });

  return watcher;
}

/**
 * Perform initial sync of all markdown files in vault
 */
export async function initialSync(vaultPath: string): Promise<number> {
  const { glob } = await import('glob');
  const files = await glob(`${vaultPath}/**/*.md`, { 
    ignore: ['**/node_modules/**', '**/.*'] 
  });
  
  console.log(`📚 Found ${files.length} markdown files in vault`);
  
  let synced = 0;
  for (const filePath of files) {
    try {
      const relativePath = filePath.replace(vaultPath + '/', '');
      const parsed = await parseMarkdown(filePath);
      
      upsertKO({ ...parsed, file_path: relativePath });
      initPhysics(parsed.id);
      initMemory(parsed.id);
      
      synced++;
    } catch (error) {
      console.error(`Error syncing ${filePath}:`, error);
    }
  }
  
  console.log(`✅ Synced ${synced} files to database`);
  return synced;
}

