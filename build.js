#!/usr/bin/env node
// build.js
// Gera um index.html estático listando os arquivos da pasta atual.
// Uso: ./build.js  (ou node build.js)
// Requisitos: Node 18+ (fs/promises, etc.)

const fsp = require("fs/promises");
const path = require("path");

const IGNORE = new Set([
  "build.js",
  "serve.js",
  "index.html",
  "robots.txt",
  "publicar.command",
  "AVALIACAO-SITE.md",
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
  avif: "image",
  mp4: "video",
  webm: "video",
  mov: "video",
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  m4a: "audio",
  html: "html",
  htm: "html",
  txt: "text",
  md: "text",
  csv: "text",
  json: "text",
};

function asExt(name) {
  const ext = path.extname(name).toLowerCase().replace(".", "");
  return ext || "";
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

  // "<" escapado para que um nome de arquivo nunca feche o <script>
  const dataJson = JSON.stringify(files).replace(/</g, "\\u003c");

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
  <meta name="color-scheme" content="light" />
  <meta name="theme-color" content="#F4F3F7" />
  <title>Arquivos</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%233F5876'/%3E%3Cpath d='M8 11a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z' fill='%23E6ECF3'/%3E%3C/svg%3E" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap" rel="stylesheet">
  <style>
    /* Paleta soft summer: tons frios, acinzentados e suaves.
       Todo texto tem contraste >= 7:1 (WCAG AAA) sobre o fundo em que aparece. */
    :root {
      --bg: #F4F3F7;
      --surface: #FFFFFF;
      --ink: #2A3140;        /* 11.8:1 em --bg */
      --muted: #4A5162;      /* 7.2:1 em --bg, 7.9:1 em branco */
      --accent: #3F5876;     /* azul acinzentado, 7.3:1 em branco */
      --accent-soft: #E6ECF3;
      --border: #D6D4DE;
      --border-strong: #8A90A0;
      --focus: #3F5876;
      --radius: 12px;

      --pdf-bg: #F3E6E9;   --pdf-fg: #7A3E4C;   /* rosa empoeirado */
      --image-bg: #E1ECEA; --image-fg: #2F5B56; /* sálvia */
      --video-bg: #E9E5F1; --video-fg: #54467A; /* lavanda */
      --audio-bg: #F2EBE2; --audio-fg: #6B4A2E; /* taupe */
      --text-bg: #E3E9F1;  --text-fg: #3B5270;  /* azul névoa */
      --html-bg: #E1ECEA;  --html-fg: #2F5B56;
      --link-bg: #ECEBF0;  --link-fg: #4A5162;
    }
    * { box-sizing: border-box }
    [hidden] { display: none !important }
    html { -webkit-text-size-adjust: 100% }
    body {
      margin: 0;
      font-family: "Atkinson Hyperlegible", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      font-size: 1.0625rem;
      background: var(--bg);
      color: var(--ink);
      line-height: 1.5;
    }
    .wrap { max-width: 880px; margin: 0 auto; padding: 0 16px; }
    svg.i { width: 1.25em; height: 1.25em; flex: none; fill: none; stroke: currentColor;
            stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }

    :focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: 8px; }

    header { padding: 40px 0 20px; }
    h1 { margin: 0; font-size: 1.75rem; letter-spacing: -0.01em; }
    .count { margin: .25rem 0 0; color: var(--muted); }

    .toolbar { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
    .search { position: relative; flex: 1 1 260px; }
    .search svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
    input[type="search"], select {
      font: inherit; color: var(--ink); background: var(--surface);
      border: 1px solid var(--border-strong); border-radius: 10px;
      min-height: 48px; padding: 0 14px;
    }
    input[type="search"] { width: 100%; padding-left: 44px; }
    input[type="search"]::placeholder { color: var(--muted); opacity: 1; }
    select { flex: 0 1 auto; cursor: pointer; }

    .list {
      list-style: none; margin: 0 0 48px; padding: 0;
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
      overflow: hidden;
    }
    .list li { display: flex; align-items: center; border-top: 1px solid var(--border); }
    .list li:first-child { border-top: 0; }
    .row {
      flex: 1; min-width: 0; display: flex; align-items: center; gap: 14px;
      padding: 12px 8px 12px 14px; min-height: 68px;
      font: inherit; color: inherit; text-align: left;
      background: none; border: 0; cursor: pointer;
    }
    .row:hover { background: var(--bg); }
    .tile {
      width: 44px; height: 44px; border-radius: 10px; flex: none;
      display: grid; place-items: center;
    }
    .tile svg.i { width: 22px; height: 22px; }
    .t-pdf { background: var(--pdf-bg); color: var(--pdf-fg); }
    .t-image { background: var(--image-bg); color: var(--image-fg); }
    .t-video { background: var(--video-bg); color: var(--video-fg); }
    .t-audio { background: var(--audio-bg); color: var(--audio-fg); }
    .t-text { background: var(--text-bg); color: var(--text-fg); }
    .t-html { background: var(--html-bg); color: var(--html-fg); }
    .t-link { background: var(--link-bg); color: var(--link-fg); }
    .info { min-width: 0; display: flex; flex-direction: column; }
    .name { font-weight: 700; overflow-wrap: anywhere; }
    .meta { color: var(--muted); font-size: .9375rem; }
    .dl {
      flex: none; display: grid; place-items: center;
      width: 48px; height: 48px; margin-right: 10px; border-radius: 10px;
      color: var(--accent); text-decoration: none;
    }
    .dl:hover { background: var(--accent-soft); }
    .empty { color: var(--muted); padding: 32px 16px; text-align: center; }

    /* Visualizador (modal) */
    dialog {
      width: min(1100px, calc(100vw - 32px)); height: calc(100vh - 48px); max-height: none; max-width: none;
      padding: 0; border: 1px solid var(--border); border-radius: var(--radius);
      background: var(--surface); color: var(--ink);
      box-shadow: 0 20px 60px rgba(42, 49, 64, .25);
    }
    dialog[open] { display: flex; flex-direction: column; }
    dialog::backdrop { background: rgba(42, 49, 64, .45); }
    .bar {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      padding: 12px 12px 12px 16px; border-bottom: 1px solid var(--border);
    }
    .bar .info { flex: 1 1 200px; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      min-height: 44px; padding: 0 14px; border-radius: 10px;
      font: inherit; font-size: 1rem; text-decoration: none; cursor: pointer;
      color: var(--accent); background: var(--surface); border: 1px solid var(--border-strong);
    }
    .btn:hover { background: var(--accent-soft); }
    .btn.primary { color: #fff; background: var(--accent); border-color: var(--accent); }
    .btn.primary:hover { background: #33496A; }
    .btn.icon { width: 44px; padding: 0; justify-content: center; }
    .stage { flex: 1; min-height: 0; overflow: auto; background: var(--bg); }
    .stage iframe { display: block; width: 100%; height: 100%; border: 0; background: #fff; }
    .stage img, .stage video { display: block; max-width: 100%; max-height: 100%; margin: auto; object-fit: contain; }
    .stage .center { min-height: 100%; display: grid; place-items: center; padding: 16px; }
    .stage audio { width: min(520px, 100%); }
    .stage pre {
      margin: 0; padding: 16px 20px; white-space: pre-wrap; overflow-wrap: anywhere;
      font: .9375rem/1.6 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: var(--ink); background: var(--surface);
      min-height: 100%;
    }
    .note { color: var(--muted); text-align: center; max-width: 36ch; }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

    @media (max-width: 640px) {
      header { padding-top: 24px; }
      dialog { width: 100vw; height: 100dvh; border-radius: 0; border: 0; }
      .btn .lbl { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
      .btn:not(.icon) { width: 44px; padding: 0; justify-content: center; }
    }
  </style>
</head>
<body>
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <defs>
      <symbol id="i-pdf" viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></symbol>
      <symbol id="i-image" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></symbol>
      <symbol id="i-video" viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></symbol>
      <symbol id="i-audio" viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></symbol>
      <symbol id="i-text" viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 12h6M9 15h6M9 18h3"/></symbol>
      <symbol id="i-html" viewBox="0 0 24 24"><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/></symbol>
      <symbol id="i-link" viewBox="0 0 24 24"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></symbol>
      <symbol id="i-download" viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></symbol>
      <symbol id="i-external" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></symbol>
      <symbol id="i-copy" viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></symbol>
      <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></symbol>
      <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></symbol>
      <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></symbol>
    </defs>
  </svg>

  <div class="wrap">
    <header>
      <h1>Arquivos</h1>
      <p class="count" id="count" aria-live="polite"></p>
    </header>

    <main>
      <div class="toolbar">
        <label class="search">
          <span class="sr">Buscar arquivo</span>
          <svg class="i" aria-hidden="true"><use href="#i-search"/></svg>
          <input id="q" type="search" placeholder="Buscar…" autocomplete="off">
        </label>
        <label>
          <span class="sr">Ordenar</span>
          <select id="sort">
            <option value="mtime-desc">Mais recentes</option>
            <option value="mtime-asc">Mais antigos</option>
            <option value="name-asc">Nome A–Z</option>
            <option value="name-desc">Nome Z–A</option>
            <option value="size-desc">Maiores</option>
            <option value="size-asc">Menores</option>
          </select>
        </label>
      </div>

      <ul id="list" class="list"></ul>
      <p id="empty" class="empty" hidden>Nenhum arquivo encontrado.</p>
    </main>
  </div>

  <dialog id="viewer" aria-labelledby="v-name">
    <div class="bar">
      <span class="tile" id="v-tile" aria-hidden="true"></span>
      <div class="info">
        <span class="name" id="v-name"></span>
        <span class="meta" id="v-meta"></span>
      </div>
      <div class="actions">
        <button class="btn" id="v-copy" type="button" hidden>
          <svg class="i" aria-hidden="true"><use href="#i-copy"/></svg><span class="lbl">Copiar texto</span>
        </button>
        <a class="btn" id="v-open" target="_blank" rel="noopener">
          <svg class="i" aria-hidden="true"><use href="#i-external"/></svg><span class="lbl">Nova aba</span>
        </a>
        <a class="btn primary" id="v-download" download>
          <svg class="i" aria-hidden="true"><use href="#i-download"/></svg><span class="lbl">Baixar</span>
        </a>
        <button class="btn icon" id="v-close" type="button" aria-label="Fechar">
          <svg class="i" aria-hidden="true"><use href="#i-close"/></svg>
        </button>
      </div>
    </div>
    <div class="stage" id="v-stage"></div>
  </dialog>

  <script>
    // Dados embutidos pelo build:
    const FILES = ${dataJson};

    const $ = (id) => document.getElementById(id);
    const list = $('list'), empty = $('empty'), count = $('count');
    const q = $('q'), sort = $('sort');
    const viewer = $('viewer'), stage = $('v-stage'), copyBtn = $('v-copy');

    function humanSize(bytes) {
      const units = ['B','KB','MB','GB','TB'];
      let i = 0, n = bytes;
      while (n >= 1024 && i < units.length-1) { n /= 1024; i++; }
      return (Math.round(n*10)/10).toLocaleString('pt-BR') + ' ' + units[i];
    }
    function fmtDate(ms) {
      return new Date(ms).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });
    }
    function metaFor(f) {
      return [(f.ext || 'sem extensão').toUpperCase(), humanSize(f.size), fmtDate(f.mtimeMs)].join(' · ');
    }
    function urlFor(f) { return encodeURIComponent(f.name); }
    function icon(name) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'i');
      svg.setAttribute('aria-hidden', 'true');
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', '#i-' + name);
      svg.appendChild(use);
      return svg;
    }
    function tile(f, el) {
      el = el || document.createElement('span');
      el.className = 'tile t-' + f.preview;
      el.replaceChildren(icon(f.preview));
      el.setAttribute('aria-hidden', 'true');
      return el;
    }
    function el(tag, cls, text) {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    }

    function applyFilters() {
      const term = (q.value || '').toLowerCase().trim();
      let items = FILES.filter(f => !term || f.name.toLowerCase().includes(term));

      items.sort((a,b) => {
        switch (sort.value) {
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
      const total = FILES.length + (FILES.length === 1 ? ' arquivo' : ' arquivos');
      count.textContent = term ? items.length + ' de ' + total : total;
    }

    function render(items) {
      list.replaceChildren();
      empty.hidden = items.length > 0;
      list.hidden = items.length === 0;

      for (const f of items) {
        const li = el('li');

        const row = el('button', 'row');
        row.type = 'button';
        const info = el('span', 'info');
        info.append(el('span', 'name', f.name), el('span', 'meta', metaFor(f)));
        row.append(tile(f), info);
        row.addEventListener('click', () => openViewer(f));

        const dl = el('a', 'dl');
        dl.href = urlFor(f);
        dl.download = f.name;
        dl.setAttribute('aria-label', 'Baixar ' + f.name);
        dl.title = 'Baixar';
        dl.appendChild(icon('download'));

        li.append(row, dl);
        list.appendChild(li);
      }
    }

    let currentText = null;

    function openViewer(f) {
      const url = urlFor(f);
      tile(f, $('v-tile'));
      $('v-name').textContent = f.name;
      $('v-meta').textContent = metaFor(f);
      $('v-open').href = url;
      $('v-download').href = url;
      $('v-download').download = f.name;
      copyBtn.hidden = true;
      currentText = null;
      stage.replaceChildren();

      const center = () => { const c = el('div', 'center'); stage.appendChild(c); return c; };

      if (f.preview === 'pdf') {
        const iframe = el('iframe');
        iframe.src = url;
        iframe.title = 'Prévia de ' + f.name;
        stage.appendChild(iframe);
      } else if (f.preview === 'image') {
        const img = el('img');
        img.src = url;
        img.alt = f.name;
        center().appendChild(img);
      } else if (f.preview === 'video') {
        const v = el('video');
        v.src = url;
        v.controls = true;
        v.playsInline = true;
        center().appendChild(v);
      } else if (f.preview === 'audio') {
        const a = el('audio');
        a.src = url;
        a.controls = true;
        center().appendChild(a);
      } else if (f.preview === 'html') {
        const iframe = el('iframe');
        iframe.src = url;
        iframe.title = 'Prévia de ' + f.name;
        iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups');
        stage.appendChild(iframe);
      } else if (f.preview === 'text') {
        const pre = el('pre', null, 'Carregando…');
        stage.appendChild(pre);
        fetch(url).then(r => { if (!r.ok) throw r; return r.text(); }).then(txt => {
          currentText = txt;
          pre.textContent = txt;
          copyBtn.hidden = false;
        }).catch(() => {
          pre.textContent = 'Não foi possível carregar a prévia. Use "Baixar" ou "Nova aba".';
        });
      } else {
        center().appendChild(el('p', 'note', 'Este tipo de arquivo não tem prévia. Use "Baixar" ou "Nova aba".'));
      }

      if (!viewer.open) viewer.showModal();
    }

    function setCopyLabel(text, iconName) {
      copyBtn.replaceChildren(icon(iconName), el('span', 'lbl', text));
    }

    copyBtn.addEventListener('click', async () => {
      if (currentText == null) return;
      try {
        await navigator.clipboard.writeText(currentText);
        setCopyLabel('Copiado', 'check');
      } catch {
        setCopyLabel('Não foi possível copiar', 'copy');
      }
      setTimeout(() => setCopyLabel('Copiar texto', 'copy'), 2000);
    });

    $('v-close').addEventListener('click', () => viewer.close());
    viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });
    viewer.addEventListener('close', () => { stage.replaceChildren(); currentText = null; });

    q.addEventListener('input', applyFilters);
    sort.addEventListener('change', applyFilters);

    applyFilters();
  </script>
</body>
</html>`;

  await fsp.writeFile(path.join(dir, "index.html"), html, "utf8");
  await fsp.writeFile(path.join(dir, "robots.txt"), "User-agent: *\nDisallow: /\n", "utf8");
  console.log(`✅ index.html gerado com ${files.length} arquivo(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
