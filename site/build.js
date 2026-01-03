import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { marked } from 'marked';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(__dirname, 'public');
const DOCS = join(ROOT, 'docs');

// Ensure directories exist
if (!existsSync(PUBLIC)) {
  mkdirSync(PUBLIC, { recursive: true });
}
if (!existsSync(DOCS)) {
  mkdirSync(DOCS, { recursive: true });
}

// Main documentation
const docs = [
  { src: 'README.md', dest: 'index.html', title: 'Schroedinger', nav: 'Readme' },
  { src: 'ABOUT.md', dest: 'about.html', title: 'About — Schroedinger', nav: 'About' },
  { src: 'ESSAY.md', dest: 'essay.html', title: 'Essay — Schroedinger', nav: 'Essay' },
  { src: 'PLAY.md', dest: 'play.html', title: 'Play Document — Schroedinger', nav: 'Play' },
  { src: 'ARCHITECTURE.md', dest: 'architecture.html', title: 'Architecture — Schroedinger', nav: 'Arch' },
  { src: 'docs/BUILD_LOG.md', dest: 'log.html', title: 'Build Log — Schroedinger', nav: 'Log' },
];

// Lens documentation
const lensDocs = [
  { src: 'lenses/drift.md', dest: 'lenses/drift.html', title: 'Drift — Schroedinger', lens: 'drift' },
  { src: 'lenses/observe.md', dest: 'lenses/observe.html', title: 'Observe — Schroedinger', lens: 'observe' },
  { src: 'lenses/accelerator.md', dest: 'lenses/accelerator.html', title: 'Accelerator — Schroedinger', lens: 'accelerator' },
  { src: 'lenses/void.md', dest: 'lenses/void.html', title: 'Void — Schroedinger', lens: 'void' },
  { src: 'lenses/archive.md', dest: 'lenses/archive.html', title: 'Archive — Schroedinger', lens: 'archive' },
];

// HTML template with aligned design language
const template = (title, nav, content, currentPage) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script>
    (function() {
      const saved = localStorage.getItem('schroedinger-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = saved || (prefersDark ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
    })();
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Literata:opsz,ital,wght@7..72,0,400;7..72,0,500;7..72,0,600;7..72,1,400&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0a0a0a;
      --bg-elevated: #141414;
      --fg: #e0e0e0;
      --fg-secondary: #ccc;
      --fg-muted: #888;
      --fg-faint: #555;
      --fg-ghost: #333;
      --accent: #c9a227;
      --accent-hover: #ddb832;
      --border: #252525;
      --border-subtle: #333;
      --success: #44ff88;
      --code-bg: #141414;
    }
    
    :root[data-theme="light"] {
      --bg: #faf9f7;
      --bg-elevated: #ffffff;
      --fg: #1a1a1a;
      --fg-secondary: #333;
      --fg-muted: #666;
      --fg-faint: #999;
      --fg-ghost: #bbb;
      --accent: #9a7b1c;
      --accent-hover: #7a5f14;
      --border: #e0ded8;
      --border-subtle: #d0cec8;
      --success: #1a8a4a;
      --code-bg: #f0efed;
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
      font-family: 'Literata', Georgia, serif;
      line-height: 1.7;
      min-height: 100vh;
      transition: background 0.3s ease, color 0.3s ease;
    }
    
    nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: var(--bg);
      border-bottom: 1px solid var(--border);
      padding: 1rem 2rem;
      display: flex;
      gap: 2rem;
      align-items: center;
      z-index: 100;
      backdrop-filter: blur(10px);
      transition: background 0.3s ease, border-color 0.3s ease;
    }
    
    nav .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }
    
    nav .logo .symbol {
      font-size: 22px;
      color: var(--accent);
      font-family: 'Times New Roman', serif;
      font-style: italic;
    }
    
    nav .logo .name {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      font-weight: 500;
      color: var(--fg-muted);
      letter-spacing: 0.12em;
    }
    
    nav .links {
      display: flex;
      gap: 1.5rem;
      flex: 1;
    }
    
    nav a {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      color: var(--fg-muted);
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      transition: color 0.2s;
    }
    
    nav a:hover, nav a.active {
      color: var(--accent);
    }
    
    nav .nav-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .theme-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--fg-muted);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .theme-toggle:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
    
    .lens-link {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      color: var(--success);
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      transition: all 0.2s ease;
    }
    
    .lens-link:hover {
      border-color: var(--success);
      background: var(--bg);
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
      color: var(--fg);
      letter-spacing: -0.02em;
    }
    
    h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-top: 3rem;
      margin-bottom: 1rem;
      color: var(--fg);
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    
    h3 {
      font-size: 1.2rem;
      font-weight: 600;
      margin-top: 2rem;
      margin-bottom: 0.75rem;
      color: var(--fg-secondary);
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
      color: var(--fg);
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
      font-size: 0.7rem;
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
      color: var(--fg-faint);
      font-size: 0.85rem;
      border-top: 1px solid var(--border);
      margin-top: 4rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      letter-spacing: 0.05em;
    }
    
    @media (max-width: 600px) {
      html { font-size: 16px; }
      nav { padding: 0.75rem 1rem; gap: 1rem; flex-wrap: wrap; }
      nav .links { gap: 1rem; }
      nav .nav-right { margin-left: auto; }
      main { padding: 5rem 1rem 2rem; }
      h1 { font-size: 2rem; }
    }
  </style>
</head>
<body>
  <nav>
    <a href="index.html" class="logo">
      <span class="symbol">ψ</span>
      <span class="name">SCHROEDINGER</span>
    </a>
    <div class="links">
      ${docs.map(d => `<a href="${d.dest}"${d.dest === currentPage ? ' class="active"' : ''}>${d.nav}</a>`).join('\n      ')}
    </div>
    <div class="nav-right">
      <button class="theme-toggle" onclick="toggleTheme()" title="Toggle theme">
        <svg id="sun-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        <svg id="moon-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>
      <a href="/" class="lens-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <circle cx="12" cy="12" r="8" stroke-dasharray="4 4"/>
        </svg>
        Lens
      </a>
    </div>
  </nav>
  
  <main>
    ${content}
  </main>
  
  <footer>
    <p>determinism is the enemy of discovery</p>
  </footer>
  
  <script>
    function updateThemeIcons() {
      const theme = document.documentElement.getAttribute('data-theme');
      document.getElementById('sun-icon').style.display = theme === 'dark' ? 'block' : 'none';
      document.getElementById('moon-icon').style.display = theme === 'light' ? 'block' : 'none';
    }
    
    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('schroedinger-theme', next);
      updateThemeIcons();
    }
    
    updateThemeIcons();
  </script>
</body>
</html>`;

// Lens documentation template (with lens nav)
const lensTemplate = (title, content, currentLens) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script>
    (function() {
      const saved = localStorage.getItem('schroedinger-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = saved || (prefersDark ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
    })();
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Literata:opsz,ital,wght@7..72,0,400;7..72,0,500;7..72,0,600;7..72,1,400&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0a0a0a;
      --bg-elevated: #141414;
      --fg: #e0e0e0;
      --fg-secondary: #ccc;
      --fg-muted: #888;
      --fg-faint: #555;
      --fg-ghost: #333;
      --accent: #c9a227;
      --accent-hover: #ddb832;
      --border: #252525;
      --border-subtle: #333;
      --success: #44ff88;
      --code-bg: #141414;
    }
    
    :root[data-theme="light"] {
      --bg: #faf9f7;
      --bg-elevated: #ffffff;
      --fg: #1a1a1a;
      --fg-secondary: #333;
      --fg-muted: #666;
      --fg-faint: #999;
      --fg-ghost: #bbb;
      --accent: #9a7b1c;
      --accent-hover: #7a5f14;
      --border: #e0ded8;
      --border-subtle: #d0cec8;
      --success: #1a8a4a;
      --code-bg: #f0efed;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { font-size: 18px; }
    body {
      background: var(--bg);
      color: var(--fg);
      font-family: 'Literata', Georgia, serif;
      line-height: 1.7;
      min-height: 100vh;
      transition: background 0.3s ease, color 0.3s ease;
    }
    
    nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: var(--bg);
      border-bottom: 1px solid var(--border);
      padding: 1rem 2rem;
      display: flex;
      gap: 2rem;
      align-items: center;
      z-index: 100;
      backdrop-filter: blur(10px);
      transition: background 0.3s ease, border-color 0.3s ease;
    }
    
    nav .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }
    
    nav .logo .symbol {
      font-size: 22px;
      color: var(--accent);
      font-family: 'Times New Roman', serif;
      font-style: italic;
    }
    
    nav .logo .name {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      font-weight: 500;
      color: var(--fg-muted);
      letter-spacing: 0.12em;
    }
    
    nav .links {
      display: flex;
      gap: 1.5rem;
      flex: 1;
    }
    
    nav a {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      color: var(--fg-muted);
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      transition: color 0.2s;
    }
    
    nav a:hover, nav a.active { color: var(--accent); }
    
    nav .nav-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .theme-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--fg-muted);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .theme-toggle:hover { border-color: var(--accent); color: var(--accent); }
    
    .lens-link {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      color: var(--success);
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      transition: all 0.2s ease;
    }
    
    .lens-link:hover { border-color: var(--success); background: var(--bg); }
    
    main { max-width: 720px; margin: 0 auto; padding: 6rem 2rem 4rem; }
    h1 { font-size: 2.5rem; font-weight: 600; margin-bottom: 1rem; color: var(--fg); letter-spacing: -0.02em; }
    h2 { font-size: 1.5rem; font-weight: 600; margin-top: 3rem; margin-bottom: 1rem; color: var(--fg); padding-bottom: 0.5rem; border-bottom: 1px solid var(--border); }
    h3 { font-size: 1.2rem; font-weight: 600; margin-top: 2rem; margin-bottom: 0.75rem; color: var(--fg-secondary); }
    p { margin-bottom: 1.25rem; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    strong { color: var(--fg); font-weight: 600; }
    em { font-style: italic; }
    blockquote { border-left: 3px solid var(--accent); padding-left: 1.5rem; margin: 1.5rem 0; color: var(--fg-muted); font-style: italic; }
    code { font-family: 'JetBrains Mono', monospace; font-size: 0.85em; background: var(--code-bg); padding: 0.15em 0.4em; border-radius: 3px; }
    pre { background: var(--code-bg); border: 1px solid var(--border); border-radius: 6px; padding: 1rem 1.25rem; overflow-x: auto; margin: 1.5rem 0; }
    pre code { background: none; padding: 0; font-size: 0.8rem; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.9rem; }
    th, td { text-align: left; padding: 0.75rem 1rem; border: 1px solid var(--border); }
    th { background: var(--code-bg); font-weight: 600; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--fg-muted); }
    ul, ol { margin: 1rem 0 1.5rem 1.5rem; }
    li { margin-bottom: 0.5rem; }
    hr { border: none; border-top: 1px solid var(--border); margin: 3rem 0; }
    footer { text-align: center; padding: 2rem; color: var(--fg-faint); border-top: 1px solid var(--border); margin-top: 4rem; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.05em; }
    
    @media (max-width: 600px) {
      html { font-size: 16px; }
      nav { padding: 0.75rem 1rem; gap: 1rem; flex-wrap: wrap; }
      nav .links { gap: 1rem; }
      nav .nav-right { margin-left: auto; }
      main { padding: 5rem 1rem 2rem; }
      h1 { font-size: 2rem; }
    }
  </style>
</head>
<body>
  <nav>
    <a href="../index.html" class="logo">
      <span class="symbol">ψ</span>
      <span class="name">SCHROEDINGER</span>
    </a>
    <div class="links">
      ${lensDocs.map(d => `<a href="${d.lens}.html"${d.lens === currentLens ? ' class="active"' : ''}>${d.lens}</a>`).join('\n      ')}
    </div>
    <div class="nav-right">
      <button class="theme-toggle" onclick="toggleTheme()" title="Toggle theme">
        <svg id="sun-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        <svg id="moon-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>
      <a href="/" class="lens-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <circle cx="12" cy="12" r="8" stroke-dasharray="4 4"/>
        </svg>
        Lens
      </a>
    </div>
  </nav>
  
  <main>
    ${content}
  </main>
  
  <footer>
    <p>determinism is the enemy of discovery</p>
  </footer>
  
  <script>
    function updateThemeIcons() {
      const theme = document.documentElement.getAttribute('data-theme');
      document.getElementById('sun-icon').style.display = theme === 'dark' ? 'block' : 'none';
      document.getElementById('moon-icon').style.display = theme === 'light' ? 'block' : 'none';
    }
    
    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('schroedinger-theme', next);
      updateThemeIcons();
    }
    
    updateThemeIcons();
  </script>
</body>
</html>`;

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: false,
});

// Ensure lens directories exist
const PUBLIC_LENSES = join(PUBLIC, 'lenses');
const DOCS_LENSES = join(DOCS, 'lenses');
if (!existsSync(PUBLIC_LENSES)) mkdirSync(PUBLIC_LENSES, { recursive: true });
if (!existsSync(DOCS_LENSES)) mkdirSync(DOCS_LENSES, { recursive: true });

// Build main documentation
console.log('Building main docs...');
for (const doc of docs) {
  const srcPath = join(ROOT, doc.src);
  const destPublic = join(PUBLIC, doc.dest);
  const destDocs = join(DOCS, doc.dest);
  
  console.log(`  ${doc.src} → ${doc.dest}`);
  
  const markdown = readFileSync(srcPath, 'utf-8');
  const html = marked.parse(markdown);
  const page = template(doc.title, doc.nav, html, doc.dest);
  
  writeFileSync(destPublic, page);
  writeFileSync(destDocs, page);
}

// Build lens documentation
console.log('\nBuilding lens docs...');
for (const doc of lensDocs) {
  const srcPath = join(ROOT, doc.src);
  const destPublic = join(PUBLIC, doc.dest);
  const destDocs = join(DOCS, doc.dest);
  
  console.log(`  ${doc.src} → ${doc.dest}`);
  
  const markdown = readFileSync(srcPath, 'utf-8');
  const html = marked.parse(markdown);
  const page = lensTemplate(doc.title, html, doc.lens);
  
  writeFileSync(destPublic, page);
  writeFileSync(destDocs, page);
}

console.log('\nBuild complete! Output to both /site/public/ and /docs/');
