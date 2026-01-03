#!/usr/bin/env node

/**
 * Schroedinger Setup Script
 * 
 * Run this after cloning to:
 * 1. Copy example vault files (if vault is empty)
 * 2. Download the ONNX embedding model
 * 3. Create necessary directories
 */

import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   SCHROEDINGER SETUP                                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
`);

// 1. Create directories
console.log('📁 Creating directories...');
const dirs = ['vault', 'state', 'models'];
for (const dir of dirs) {
  const path = join(ROOT, dir);
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
    console.log(`   Created ${dir}/`);
  }
}

// 2. Copy example files if vault is empty
const vaultPath = join(ROOT, 'vault');
const examplesPath = join(ROOT, 'vault/_examples');
const vaultFiles = readdirSync(vaultPath).filter(f => f.endsWith('.md'));

if (vaultFiles.length === 0 && existsSync(examplesPath)) {
  console.log('\n📝 Copying example thoughts to vault...');
  const examples = readdirSync(examplesPath).filter(f => f.endsWith('.md'));
  
  for (const file of examples) {
    copyFileSync(join(examplesPath, file), join(vaultPath, file));
    console.log(`   Copied ${file}`);
  }
}

// 3. Download ONNX model if not present
const modelPath = join(ROOT, 'models/all-MiniLM-L6-v2.onnx');
const tokenizerPath = join(ROOT, 'models/tokenizer.json');

if (!existsSync(modelPath)) {
  console.log('\n🧠 Downloading embedding model (86MB)...');
  console.log('   This may take a minute...\n');
  
  try {
    execSync(
      `curl -L -o "${modelPath}" "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx"`,
      { stdio: 'inherit' }
    );
    console.log('   ✓ Model downloaded');
  } catch (e) {
    console.error('   ✗ Failed to download model. You can download manually from:');
    console.error('     https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2');
  }
}

if (!existsSync(tokenizerPath)) {
  console.log('\n📖 Downloading tokenizer...');
  
  try {
    execSync(
      `curl -L -o "${tokenizerPath}" "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/tokenizer.json"`,
      { stdio: 'inherit' }
    );
    console.log('   ✓ Tokenizer downloaded');
  } catch (e) {
    console.error('   ✗ Failed to download tokenizer');
  }
}

console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   SETUP COMPLETE                                      ║
║                                                       ║
║   Next steps:                                         ║
║                                                       ║
║   1. Install dependencies:                            ║
║      cd bridge && npm install                         ║
║      cd ../lens && npm install                        ║
║                                                       ║
║   2. Start the servers:                               ║
║      npm run dev                                      ║
║                                                       ║
║   3. Open http://localhost:5173                       ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
`);

