// build.js
// Gera um index.html estático listando os arquivos da pasta atual.
// Uso: node build.js
// Requisitos: Node 18+ (fs/promises, etc.)

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const IGNORE = new Set([
  "build.js",
  "serve.js",
  "index.html",
  ".DS_Store",
  "Thumbs.db",
]);

// Extensões que terão "preview" embutido
const PREVIEW = {
  pdf: "pdf",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  gif: "image",
  svg: "image",
  mp4: "video",
  webm: "video",
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  html: "html",
  htm: "html",
  txt: "text",
  md: "text",
};

function asExt(name) {
  const ext = path.extname(name).toLowerCase().replace(".", "");
  return ext || "";
}

function escapeHtml(s) {
  return s.replace(
    /[&<>"']/g,
    (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[ch],
  );
}

async function main() {
  const dir = process.cwd();
  const entries = await fsp.readdir(dir, { withFileTypes: true });

  const files = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    if (IGNORE.has(e.name)) continue;
    if (e.name.startsWith(".")) continue;

    const full = path.join(dir, e.name);
    const stat = await fsp.stat(full);
    const ext = asExt(e.name);
    files.push({
      name: e.name,
      ext,
      size: stat.size,
      mtimeMs: stat.mtimeMs,
      preview: PREVIEW[ext] || "link",
    });
  }

  // Ordena por data de modificação (mais recente primeiro)
  files.sort((a, b) => b.mtimeMs - a.mtimeMs);

  const dataJson = JSON.stringify(files);

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Biblioteca de Arquivos</title>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0c10;
      --panel: #111318;
      --ink: #eaeef2;
      --muted: #9aa4af;
      --accent: #7cc5ff;
      --border: #252a33;
    }
    * { box-sizing: border-box }
    body {
      margin: 0;
      font-family: "Atkinson Hyperlegible", system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, sans-serif;
      background: var(--bg);
      color: var(--ink);
      line-height: 1.5;
    }
    header {
      padding: 2rem 1rem 1rem;
      max-width: 1000px;
      margin: 0 auto;
    }
    h1 { margin: 0 0 .25rem 0; font-size: 1.75rem; }
    p.lead { margin: 0; color: var(--muted); }
    .wrap {
      max-width: 1000px;
      margin: 1rem auto 2rem;
      padding: 0 1rem;
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    .toolbar {
      display: flex; gap: .75rem; flex-wrap: wrap;
      background: var(--panel); border: 1px solid var(--border);
      padding: .75rem; border-radius: .75rem;
    }
    .toolbar input[type="search"] {
      flex: 1;
      background: #0d0f14; color: var(--ink);
      border: 1px solid var(--border); border-radius: .5rem;
      padding: .6rem .8rem;
    }
    .toolbar select, .toolbar button {
      background: #0d0f14; color: var(--ink);
      border: 1px solid var(--border); border-radius: .5rem;
      padding: .6rem .8rem; cursor: pointer;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: .75rem;
    }
    .card {
      background: var(--panel); border: 1px solid var(--border);
      border-radius: .75rem; padding: .9rem;
      display: flex; flex-direction: column; gap: .5rem;
    }
    .card h3 {
      margin: 0; font-size: 1rem; word-break: break-word;
    }
    .meta { color: var(--muted); font-size: .875rem; }
    .chip {
      display: inline-block; font-size: .75rem; padding: .15rem .5rem;
      border: 1px solid var(--border); border-radius: .5rem; color: var(--muted);
    }
    a.btn {
      display: inline-block; text-decoration: none; color: var(--ink);
      border: 1px solid var(--border); padding: .5rem .7rem; border-radius: .5rem;
    }
    .viewer {
      background: var(--panel); border: 1px solid var(--border);
      border-radius: .75rem; min-height: 60vh; padding: .5rem;
    }
    .viewer > * { width: 100%; height: calc(60vh - 1rem); border: 0; }
    .empty { color: var(--muted); padding: 1rem; text-align: center; }
    footer { color: var(--muted); font-size: .875rem; text-align: center; padding: 2rem 1rem 3rem; }
    @media (prefers-reduced-motion: no-preference) {
      .card { transition: transform .12s ease }
      .card:hover { transform: translateY(-2px) }
    }
  </style>
</head>
<body>
  <header>
    <h1>Biblioteca de Arquivos</h1>
    <p class="lead">Arquivos na raiz desta pasta. Clique para abrir em visualizador embutido (quando suportado) ou em nova aba.</p>
  </header>

  <main class="wrap">
    <div class="toolbar" role="region" aria-label="Ferramentas de filtragem">
      <input id="q" type="search" placeholder="Filtrar por nome ou extensão…" aria-label="Filtrar">
      <select id="kind" aria-label="Tipo">
        <option value="">Todos os tipos</option>
        <option value="pdf">PDF</option>
        <option value="image">Imagens</option>
        <option value="video">Vídeos</option>
        <option value="audio">Áudio</option>
        <option value="html">HTML</option>
        <option value="text">Texto</option>
        <option value="link">Outros</option>
      </select>
      <select id="sort" aria-label="Ordenar">
        <option value="mtime-desc">Recentes primeiro</option>
        <option value="mtime-asc">Antigos primeiro</option>
        <option value="name-asc">Nome A→Z</option>
        <option value="name-desc">Nome Z→A</option>
        <option value="size-desc">Maiores primeiro</option>
        <option value="size-asc">Menores primeiro</option>
      </select>
      <button id="clear">Limpar</button>
    </div>

    <section>
      <div id="grid" class="grid" aria-live="polite"></div>
      <div id="empty" class="empty" hidden>Nenhum arquivo encontrado.</div>
    </section>

    <section aria-label="Visualizador" class="viewer" id="viewer">
      <div class="empty">Selecione um arquivo para visualizar aqui.</div>
    </section>
  </main>

  <footer>
    Gerado automaticamente por <code>build.js</code>. Sem backend, só estático.
  </footer>

  <script>
    // Dados embutidos pelo build:
    const FILES = ${dataJson};

    const grid = document.getElementById('grid');
    const empty = document.getElementById('empty');
    const q = document.getElementById('q');
    const kind = document.getElementById('kind');
    const sort = document.getElementById('sort');
    const clearBtn = document.getElementById('clear');
    const viewer = document.getElementById('viewer');

    function humanSize(bytes) {
      const units = ['B','KB','MB','GB','TB'];
      let i = 0, n = bytes;
      while (n >= 1024 && i < units.length-1) { n /= 1024; i++; }
      return (Math.round(n*10)/10) + ' ' + units[i];
    }
    function fmtDate(ms) {
      const d = new Date(ms);
      return d.toLocaleString('pt-BR');
    }
    function iconFor(kind, ext) {
      const map = {
        pdf: '📄', image: '🖼️', video: '🎞️', audio: '🎧', html: '🕸️', text: '📝', link: '🔗'
      };
      if (map[kind]) return map[kind];
      if (ext) return '📦';
      return '📦';
    }

    function applyFilters() {
      const term = (q.value || '').toLowerCase().trim();
      const k = kind.value;
      const sorter = sort.value;

      let items = FILES.slice();

      if (term) {
        items = items.filter(f =>
          f.name.toLowerCase().includes(term) || f.ext.toLowerCase().includes(term)
        );
      }
      if (k) {
        items = items.filter(f => (k === 'image' ? f.preview === 'image' : f.preview === k));
      }

      items.sort((a,b) => {
        switch (sorter) {
          case 'mtime-asc': return a.mtimeMs - b.mtimeMs;
          case 'mtime-desc': return b.mtimeMs - a.mtimeMs;
          case 'name-asc': return a.name.localeCompare(b.name, 'pt-BR');
          case 'name-desc': return b.name.localeCompare(a.name, 'pt-BR');
          case 'size-asc': return a.size - b.size;
          case 'size-desc': return b.size - a.size;
          default: return 0;
        }
      });

      render(items);
    }

    function render(list) {
      grid.innerHTML = '';
      if (list.length === 0) {
        empty.hidden = false;
        return;
      }
      empty.hidden = true;

      for (const f of list) {
        const card = document.createElement('article');
        card.className = 'card';

        const h3 = document.createElement('h3');
        h3.textContent = iconFor(f.preview, f.ext) + ' ' + f.name;
        card.appendChild(h3);

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.innerHTML = \`<span class="chip">\${f.ext || 'sem extensão'}</span> • \${humanSize(f.size)} • \${fmtDate(f.mtimeMs)}\`;
        card.appendChild(meta);

        const open = document.createElement('div');
        open.style.display = 'flex';
        open.style.gap = '.5rem';

        const btnView = document.createElement('a');
        btnView.href = f.name;
        btnView.className = 'btn';
        btnView.textContent = (f.preview === 'link') ? 'Abrir' : 'Visualizar';
        btnView.target = '_blank';
        btnView.rel = 'noopener';
        open.appendChild(btnView);

        const btnEmbed = document.createElement('button');
        btnEmbed.className = 'btn';
        btnEmbed.type = 'button';
        btnEmbed.textContent = 'Ver no painel';
        btnEmbed.addEventListener('click', () => showInViewer(f));
        open.appendChild(btnEmbed);

        card.appendChild(open);
        grid.appendChild(card);
      }
    }

    function showInViewer(f) {
      viewer.innerHTML = '';
      const kind = f.preview;
      if (kind === 'pdf') {
        const iframe = document.createElement('iframe');
        iframe.src = f.name + '#toolbar=1';
        iframe.setAttribute('title', 'Visualizador de PDF');
        viewer.appendChild(iframe);
      } else if (kind === 'image') {
        const img = document.createElement('img');
        img.src = f.name;
        img.alt = f.name;
        img.style.maxHeight = 'calc(60vh - 1rem)';
        img.style.objectFit = 'contain';
        viewer.appendChild(img);
      } else if (kind === 'video') {
        const v = document.createElement('video');
        v.src = f.name;
        v.controls = true;
        viewer.appendChild(v);
      } else if (kind === 'audio') {
        const a = document.createElement('audio');
        a.src = f.name;
        a.controls = true;
        viewer.appendChild(a);
      } else if (kind === 'html') {
        const iframe = document.createElement('iframe');
        iframe.src = f.name;
        iframe.setAttribute('title', 'Página HTML');
        iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups allow-same-origin');
        viewer.appendChild(iframe);
      } else if (kind === 'text') {
        // Tenta carregar o texto e exibir
        fetch(f.name).then(r => r.text()).then(txt => {
          const pre = document.createElement('pre');
          pre.textContent = txt;
          pre.style.whiteSpace = 'pre-wrap';
          pre.style.margin = '0';
          viewer.appendChild(pre);
        }).catch(() => {
          viewer.innerHTML = '<div class="empty">Não foi possível pré-visualizar este arquivo.</div>';
        });
      } else {
        viewer.innerHTML = \`<div class="empty">Tipo não suportado para prévia. <a class="btn" href="\${f.name}" target="_blank" rel="noopener">Abrir em nova aba</a></div>\`;
      }
    }

    q.addEventListener('input', applyFilters);
    kind.addEventListener('change', applyFilters);
    sort.addEventListener('change', applyFilters);
    clearBtn.addEventListener('click', () => { q.value=''; kind.value=''; sort.value='mtime-desc'; applyFilters(); });

    // Inicializa
    applyFilters();
  </script>
</body>
</html>`;

  await fsp.writeFile(path.join(dir, "index.html"), html, "utf8");
  console.log(`✅ index.html gerado com ${files.length} arquivo(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
