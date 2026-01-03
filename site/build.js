import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { marked } from 'marked';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(__dirname, 'public');

// Ensure public directory exists
if (!existsSync(PUBLIC)) {
  mkdirSync(PUBLIC, { recursive: true });
}

// Documents to convert
const docs = [
  { src: 'README.md', dest: 'index.html', title: 'Schroedinger', nav: 'Readme' },
  { src: 'ABOUT.md', dest: 'about.html', title: 'About — Schroedinger', nav: 'About' },
  { src: 'ESSAY.md', dest: 'essay.html', title: 'Essay — Schroedinger', nav: 'Essay' },
  { src: 'PLAY.md', dest: 'play.html', title: 'Play Document — Schroedinger', nav: 'Play' },
  { src: 'docs/BUILD_LOG.md', dest: 'log.html', title: 'Build Log — Schroedinger', nav: 'Log' },
];

// HTML template
const template = (title, nav, content, currentPage) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0a0a0a;
      --fg: #e0e0e0;
      --fg-muted: #888;
      --accent: #c9a227;
      --border: #2a2a2a;
      --code-bg: #141414;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html {
      font-size: 18px;
    }
    
    body {
      background: var(--bg);
      color: var(--fg);
      font-family: 'Crimson Pro', Georgia, serif;
      line-height: 1.7;
      min-height: 100vh;
    }
    
    nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: rgba(10, 10, 10, 0.95);
      border-bottom: 1px solid var(--border);
      padding: 1rem 2rem;
      display: flex;
      gap: 2rem;
      align-items: center;
      z-index: 100;
      backdrop-filter: blur(10px);
    }
    
    nav .logo {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--accent);
      text-decoration: none;
      letter-spacing: 0.05em;
    }
    
    nav .links {
      display: flex;
      gap: 1.5rem;
    }
    
    nav a {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: var(--fg-muted);
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      transition: color 0.2s;
    }
    
    nav a:hover, nav a.active {
      color: var(--fg);
    }
    
    main {
      max-width: 720px;
      margin: 0 auto;
      padding: 6rem 2rem 4rem;
    }
    
    h1 {
      font-size: 2.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #fff;
      letter-spacing: -0.02em;
    }
    
    h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-top: 3rem;
      margin-bottom: 1rem;
      color: #fff;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    
    h3 {
      font-size: 1.2rem;
      font-weight: 600;
      margin-top: 2rem;
      margin-bottom: 0.75rem;
      color: var(--fg);
    }
    
    p {
      margin-bottom: 1.25rem;
    }
    
    a {
      color: var(--accent);
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    strong {
      color: #fff;
      font-weight: 600;
    }
    
    em {
      font-style: italic;
    }
    
    blockquote {
      border-left: 3px solid var(--accent);
      padding-left: 1.5rem;
      margin: 1.5rem 0;
      color: var(--fg-muted);
      font-style: italic;
    }
    
    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85em;
      background: var(--code-bg);
      padding: 0.15em 0.4em;
      border-radius: 3px;
    }
    
    pre {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 1rem 1.25rem;
      overflow-x: auto;
      margin: 1.5rem 0;
    }
    
    pre code {
      background: none;
      padding: 0;
      font-size: 0.8rem;
      line-height: 1.6;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      font-size: 0.9rem;
    }
    
    th, td {
      text-align: left;
      padding: 0.75rem 1rem;
      border: 1px solid var(--border);
    }
    
    th {
      background: var(--code-bg);
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--fg-muted);
    }
    
    ul, ol {
      margin: 1rem 0 1.5rem 1.5rem;
    }
    
    li {
      margin-bottom: 0.5rem;
    }
    
    hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 3rem 0;
    }
    
    .tagline {
      font-size: 1.1rem;
      color: var(--fg-muted);
      font-style: italic;
      margin-bottom: 2rem;
    }
    
    footer {
      text-align: center;
      padding: 2rem;
      color: var(--fg-muted);
      font-size: 0.85rem;
      border-top: 1px solid var(--border);
      margin-top: 4rem;
    }
    
    @media (max-width: 600px) {
      html { font-size: 16px; }
      nav { padding: 0.75rem 1rem; gap: 1rem; }
      nav .links { gap: 1rem; }
      main { padding: 5rem 1rem 2rem; }
      h1 { font-size: 2rem; }
    }
  </style>
</head>
<body>
  <nav>
    <a href="/" class="logo">SCHROEDINGER</a>
    <div class="links">
      ${docs.map(d => `<a href="/${d.dest}"${d.dest === currentPage ? ' class="active"' : ''}>${d.nav}</a>`).join('\n      ')}
    </div>
  </nav>
  
  <main>
    ${content}
  </main>
  
  <footer>
    <p>Determinism is the enemy of discovery.</p>
  </footer>
</body>
</html>`;

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: false,
});

// Build each document
for (const doc of docs) {
  const srcPath = join(ROOT, doc.src);
  const destPath = join(PUBLIC, doc.dest);
  
  console.log(`Building ${doc.src} → ${doc.dest}`);
  
  const markdown = readFileSync(srcPath, 'utf-8');
  const html = marked.parse(markdown);
  const page = template(doc.title, doc.nav, html, doc.dest);
  
  writeFileSync(destPath, page);
}

console.log('\nBuild complete!');

