import { readFile } from 'fs/promises';
import { createHash } from 'crypto';
import { ulid } from 'ulid';
import { parse as parseYAML } from 'yaml';
import type { KO, ParsedFrontmatter } from './types.js';

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---/;

/**
 * Extract title from markdown content
 */
function extractTitle(content: string): string {
  // Try to find first heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }
  
  // Fall back to first line
  const firstLine = content.split('\n').find(line => line.trim().length > 0);
  if (firstLine) {
    return firstLine.slice(0, 50).trim();
  }
  
  return 'Untitled';
}

/**
 * Parse a markdown file into a KO structure
 */
export async function parseMarkdown(filePath: string): Promise<Omit<KO, 'updated_at'>> {
  const raw = await readFile(filePath, 'utf-8');
  const contentHash = createHash('sha256').update(raw).digest('hex').slice(0, 16);
  
  let frontmatter: ParsedFrontmatter = {};
  let content = raw;
  
  // Parse YAML frontmatter if present
  const frontmatterMatch = raw.match(FRONTMATTER_REGEX);
  if (frontmatterMatch) {
    try {
      frontmatter = parseYAML(frontmatterMatch[1]) || {};
    } catch (e) {
      console.warn(`Failed to parse frontmatter in ${filePath}:`, e);
    }
    content = raw.slice(frontmatterMatch[0].length).trim();
  }
  
  // Generate ID if not present
  const id = frontmatter.id || ulid();
  
  // Extract title
  const title = frontmatter.title || extractTitle(content);
  
  return {
    id,
    title,
    content,
    content_hash: contentHash,
    type: frontmatter.type || 'fragment',
    tags: frontmatter.tags || [],
    created_at: frontmatter.created || new Date().toISOString(),
    file_path: filePath,
  };
}

/**
 * Generate markdown content from a KO (for creating new files)
 */
export function generateMarkdown(ko: Partial<KO> & { title: string; content?: string }): string {
  const id = ko.id || ulid();
  const now = new Date().toISOString();
  
  const frontmatter = {
    id,
    title: ko.title,
    created: ko.created_at || now,
    type: ko.type || 'fragment',
    tags: ko.tags || [],
  };
  
  const yaml = Object.entries(frontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.join(', ')}]`;
      }
      if (typeof value === 'string' && value.includes(':')) {
        return `${key}: "${value}"`;
      }
      return `${key}: ${value}`;
    })
    .join('\n');
  
  const content = ko.content || `# ${ko.title}\n\n`;
  
  return `---\n${yaml}\n---\n\n${content}`;
}

/**
 * Create a synthesis (bridge note) markdown
 */
export function generateSynthesis(
  connection: string,
  parentA: { id: string; title: string },
  parentB: { id: string; title: string }
): { filename: string; content: string; id: string } {
  const id = ulid();
  const now = new Date().toISOString();
  
  const content = `---
id: ${id}
title: "${connection}"
type: synthesis
created: ${now}
parents:
  - ${parentA.id}
  - ${parentB.id}
tags: [synthesis]
---

# ${connection}

This synthesis connects:
- [[${parentA.title}]]
- [[${parentB.title}]]

---

*Created through collision on ${new Date().toLocaleDateString()}*
`;

  // Create filename from id and slugified connection
  const slug = connection
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40)
    .replace(/-+$/, '');
  
  const filename = `${id.slice(0, 8)}-${slug}.md`;
  
  return { filename, content, id };
}

