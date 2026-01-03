import * as ort from 'onnxruntime-node';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

// Model and tokenizer
let session: ort.InferenceSession | null = null;
let tokenizer: Tokenizer | null = null;

interface Tokenizer {
  model: {
    vocab: Record<string, number>;
  };
  added_tokens: Array<{ id: number; content: string }>;
}

interface TokenizerResult {
  input_ids: number[];
  attention_mask: number[];
  token_type_ids: number[];
}

const MODEL_PATH = resolve(process.cwd(), 'models/all-MiniLM-L6-v2.onnx');
const TOKENIZER_PATH = resolve(process.cwd(), 'models/tokenizer.json');
const MAX_LENGTH = 128;
const EMBEDDING_DIM = 384;

/**
 * Initialize the embedding model
 */
export async function initEmbeddings(): Promise<void> {
  try {
    console.log('🧠 Loading embedding model...');
    
    // Load tokenizer
    const tokenizerJson = await readFile(TOKENIZER_PATH, 'utf-8');
    tokenizer = JSON.parse(tokenizerJson);
    
    // Load ONNX model
    session = await ort.InferenceSession.create(MODEL_PATH, {
      executionProviders: ['cpu'],
    });
    
    console.log('🧠 Embedding model loaded successfully');
  } catch (error) {
    console.warn('⚠️  Failed to load embedding model:', error);
    console.warn('⚠️  Semantic features will be disabled');
  }
}

/**
 * Check if embeddings are available
 */
export function isEmbeddingsAvailable(): boolean {
  return session !== null && tokenizer !== null;
}

/**
 * Simple WordPiece tokenizer
 */
function tokenize(text: string): TokenizerResult {
  if (!tokenizer) {
    throw new Error('Tokenizer not initialized');
  }
  
  const vocab = tokenizer.model.vocab;
  const unkId = vocab['[UNK]'] ?? 0;
  const clsId = vocab['[CLS]'] ?? 101;
  const sepId = vocab['[SEP]'] ?? 102;
  const padId = vocab['[PAD]'] ?? 0;
  
  // Normalize and split text
  const normalized = text.toLowerCase().trim();
  const words = normalized.split(/\s+/);
  
  const tokens: number[] = [clsId];
  
  for (const word of words) {
    if (tokens.length >= MAX_LENGTH - 1) break;
    
    // Try to find the word in vocab
    if (vocab[word] !== undefined) {
      tokens.push(vocab[word]);
    } else {
      // Simple subword tokenization
      let remaining = word;
      let isFirst = true;
      
      while (remaining.length > 0 && tokens.length < MAX_LENGTH - 1) {
        let found = false;
        
        // Try decreasing lengths
        for (let len = Math.min(remaining.length, 10); len > 0; len--) {
          const piece = isFirst ? remaining.slice(0, len) : '##' + remaining.slice(0, len);
          
          if (vocab[piece] !== undefined) {
            tokens.push(vocab[piece]);
            remaining = remaining.slice(len);
            found = true;
            isFirst = false;
            break;
          }
        }
        
        if (!found) {
          // Skip character if not found
          tokens.push(unkId);
          remaining = remaining.slice(1);
          isFirst = false;
        }
      }
    }
  }
  
  tokens.push(sepId);
  
  // Pad to MAX_LENGTH
  const input_ids = [...tokens];
  const attention_mask = tokens.map(() => 1);
  const token_type_ids = tokens.map(() => 0);
  
  while (input_ids.length < MAX_LENGTH) {
    input_ids.push(padId);
    attention_mask.push(0);
    token_type_ids.push(0);
  }
  
  return {
    input_ids: input_ids.slice(0, MAX_LENGTH),
    attention_mask: attention_mask.slice(0, MAX_LENGTH),
    token_type_ids: token_type_ids.slice(0, MAX_LENGTH),
  };
}

/**
 * Mean pooling over token embeddings
 */
function meanPooling(
  lastHiddenState: Float32Array,
  attentionMask: number[]
): Float32Array {
  const embedding = new Float32Array(EMBEDDING_DIM);
  let validTokens = 0;
  
  for (let i = 0; i < MAX_LENGTH; i++) {
    if (attentionMask[i] === 1) {
      validTokens++;
      for (let j = 0; j < EMBEDDING_DIM; j++) {
        embedding[j] += lastHiddenState[i * EMBEDDING_DIM + j];
      }
    }
  }
  
  if (validTokens > 0) {
    for (let j = 0; j < EMBEDDING_DIM; j++) {
      embedding[j] /= validTokens;
    }
  }
  
  // L2 normalize
  let norm = 0;
  for (let j = 0; j < EMBEDDING_DIM; j++) {
    norm += embedding[j] * embedding[j];
  }
  norm = Math.sqrt(norm);
  
  if (norm > 0) {
    for (let j = 0; j < EMBEDDING_DIM; j++) {
      embedding[j] /= norm;
    }
  }
  
  return embedding;
}

/**
 * Generate embedding for text
 */
export async function embed(text: string): Promise<Float32Array | null> {
  if (!session || !tokenizer) {
    return null;
  }
  
  try {
    const { input_ids, attention_mask, token_type_ids } = tokenize(text);
    
    const inputIdsTensor = new ort.Tensor('int64', BigInt64Array.from(input_ids.map(BigInt)), [1, MAX_LENGTH]);
    const attentionMaskTensor = new ort.Tensor('int64', BigInt64Array.from(attention_mask.map(BigInt)), [1, MAX_LENGTH]);
    const tokenTypeIdsTensor = new ort.Tensor('int64', BigInt64Array.from(token_type_ids.map(BigInt)), [1, MAX_LENGTH]);
    
    const results = await session.run({
      input_ids: inputIdsTensor,
      attention_mask: attentionMaskTensor,
      token_type_ids: tokenTypeIdsTensor,
    });
    
    const lastHiddenState = results['last_hidden_state'].data as Float32Array;
    return meanPooling(lastHiddenState, attention_mask);
  } catch (error) {
    console.error('Embedding error:', error);
    return null;
  }
}

/**
 * Compute cosine similarity between two embeddings
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  // Already L2 normalized, so dot product is cosine similarity
  return dot;
}

/**
 * Batch embed multiple texts
 */
export async function embedBatch(texts: string[]): Promise<Map<number, Float32Array>> {
  const results = new Map<number, Float32Array>();
  
  for (let i = 0; i < texts.length; i++) {
    const embedding = await embed(texts[i]);
    if (embedding) {
      results.set(i, embedding);
    }
  }
  
  return results;
}

