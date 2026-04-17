/**
 * iframe-runtime.ts — shipped **as source text** into the render iframe.
 *
 * DO NOT import this from Next.js directly. It's loaded via a route handler
 * (/api/render/runtime) as a plain JS/text response that the parent embeds
 * via iframe srcdoc.
 *
 * Responsibilities:
 *   1. Initialise esbuild-wasm (single-threaded, no SAB required).
 *   2. On MOUNT: transform every .tsx/.ts in config.files into JS, rewrite
 *      bare imports to esm.sh URLs, rewrite relative imports to blob URLs,
 *      then `import()` the entry module via a blob URL.
 *   3. Render the resolved component with initial props, mount into #root.
 *   4. On UPDATE_PROPS: re-render with new props using the same root —
 *      NO retransform, NO network.
 *   5. Any error → postMessage RENDER_ERROR back to the parent.
 *
 * This file is authored in TS so the Next.js typechecker stays honest, and
 * delivered as JS by stripping the types at build time. In practice we keep
 * it JS-clean (no runtime TS constructs) so a simple tsc or esbuild drop
 * works.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const IFRAME_RUNTIME_SOURCE = /* js */ `
(function () {
  const ESBUILD_WASM_URL = 'https://esm.sh/esbuild-wasm@0.23.1/esbuild.wasm';
  const ESBUILD_ES_URL = 'https://esm.sh/esbuild-wasm@0.23.1/esm/browser.js';
  const ESM_BASE = 'https://esm.sh';

  let esbuild;
  let esbuildReady;
  let currentConfig = null;
  let currentRoot = null;
  let currentComponent = null;
  let currentProps = {};
  let React_ = null;
  let ReactDOM_ = null;
  let LucideIcons = null;

  function send(msg) {
    parent.postMessage({ source: 'autodsm-iframe', ...msg }, '*');
  }

  function loadEsbuild() {
    if (esbuildReady) return esbuildReady;
    esbuildReady = import(ESBUILD_ES_URL).then(async (mod) => {
      esbuild = mod;
      await mod.initialize({ wasmURL: ESBUILD_WASM_URL, worker: false });
      return mod;
    });
    return esbuildReady;
  }

  async function loadCore() {
    if (React_ && ReactDOM_) return;
    const [R, RD, L] = await Promise.all([
      import(ESM_BASE + '/react@19'),
      import(ESM_BASE + '/react-dom@19/client'),
      import(ESM_BASE + '/lucide-react').catch(() => ({})),
    ]);
    React_ = R.default || R;
    ReactDOM_ = RD.default || RD;
    LucideIcons = L;
  }

  // Rewrite bare imports: "lucide-react" → "https://esm.sh/lucide-react"
  // Relative imports stay as-is and are resolved against the virtual FS below.
  function rewriteBareImports(code, fileKey) {
    return code.replace(
      /(from\\s+|import\\s+)(['"])([^'"./][^'"]*)\\2/g,
      (_, kw, q, spec) => {
        if (spec === 'react' || spec === 'react/jsx-runtime' || spec === 'react/jsx-dev-runtime') {
          return kw + q + ESM_BASE + '/react@19' + (spec === 'react' ? '' : spec.slice(5)) + q;
        }
        if (spec === 'react-dom' || spec.startsWith('react-dom/')) {
          return kw + q + ESM_BASE + '/' + spec.replace('react-dom', 'react-dom@19') + q;
        }
        // Everything else → esm.sh. ?bundle ensures transitive deps are pre-bundled.
        return kw + q + ESM_BASE + '/' + spec + '?bundle' + q;
      },
    );
  }

  async function transformAllFiles(config) {
    await loadEsbuild();
    const urls = new Map();
    // First pass: transform each file independently (JSX → JS).
    const transformed = new Map();
    for (const [path, source] of Object.entries(config.files)) {
      const loader = path.endsWith('.ts') ? 'ts' : path.endsWith('.tsx') ? 'tsx' : 'jsx';
      const out = await esbuild.transform(source, {
        loader,
        jsx: 'automatic',
        jsxImportSource: 'react',
        target: 'es2020',
        format: 'esm',
        sourcemap: 'inline',
      });
      transformed.set(path, out.code);
    }
    // Second pass: rewrite relative imports to blob URLs. We iterate until
    // fixed-point because blob URLs for later files need earlier blobs.
    // Simpler strategy: reserve blob URLs up front, then do a single rewrite.
    const reserved = new Map();
    for (const path of transformed.keys()) {
      // reserve a placeholder URL we'll replace after we know the real blob URL.
      reserved.set(path, '__AUTODSM_BLOB__' + Math.random().toString(36).slice(2) + '__');
    }
    // Build blob URLs, replacing placeholders with real URLs of referenced files.
    const blobFor = new Map();
    for (const [path, code] of transformed.entries()) {
      let rewritten = rewriteBareImports(code, path);
      rewritten = rewritten.replace(
        /(from\\s+|import\\s+)(['"])(\\.[^'"]+)\\2/g,
        (m, kw, q, rel) => {
          const candidates = [
            resolveRel(path, rel),
            resolveRel(path, rel + '.ts'),
            resolveRel(path, rel + '.tsx'),
            resolveRel(path, rel + '/index.ts'),
            resolveRel(path, rel + '/index.tsx'),
          ];
          const hit = candidates.find((c) => reserved.has(c));
          if (!hit) return m; // leave as-is; will error at import time (handled below).
          return kw + q + reserved.get(hit) + q;
        },
      );
      const blob = new Blob([rewritten], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      blobFor.set(path, url);
    }
    // Now resolve the placeholders — blob URLs don't embed content, so we
    // need to re-stitch: rebuild each blob substituting placeholders for the
    // real blob URLs we just minted.
    const finalUrls = new Map();
    for (const [path, _] of transformed.entries()) {
      let code = rewriteBareImports(transformed.get(path), path).replace(
        /(from\\s+|import\\s+)(['"])(\\.[^'"]+)\\2/g,
        (m, kw, q, rel) => {
          const candidates = [
            resolveRel(path, rel),
            resolveRel(path, rel + '.ts'),
            resolveRel(path, rel + '.tsx'),
            resolveRel(path, rel + '/index.ts'),
            resolveRel(path, rel + '/index.tsx'),
          ];
          const hit = candidates.find((c) => blobFor.has(c));
          return hit ? kw + q + blobFor.get(hit) + q : m;
        },
      );
      const b = new Blob([code], { type: 'text/javascript' });
      finalUrls.set(path, URL.createObjectURL(b));
    }
    // Release the first-pass blobs (unused) but GC is fine.
    urls.__finalUrls = finalUrls;
    return finalUrls;
  }

  function resolveRel(fromPath, rel) {
    // crude but works for the subset we support.
    const stack = fromPath.split('/');
    stack.pop();
    for (const seg of rel.split('/')) {
      if (seg === '.' || seg === '') continue;
      if (seg === '..') stack.pop();
      else stack.push(seg);
    }
    return '/' + stack.filter(Boolean).join('/');
  }

  async function mount(config) {
    currentConfig = config;
    currentProps = { ...config.initial_props };
    try {
      await loadCore();
      const urls = await transformAllFiles(config);
      const entryPath = pickEntryPath(config);
      if (!entryPath) throw new Error('Entry module not found in render config files.');
      const mod = await import(/* @vite-ignore */ urls.get(entryPath));
      const Component =
        mod[config.entry_module] ||
        mod.default ||
        // Last resort: first exported function/class.
        Object.values(mod).find((v) => typeof v === 'function');
      if (!Component) throw new Error('Could not locate exported component: ' + config.entry_module);

      currentComponent = Component;
      const rootEl = document.getElementById('root');
      currentRoot = ReactDOM_.createRoot(rootEl);
      render();
      send({ type: 'RENDER_OK' });
    } catch (err) {
      send({
        type: 'RENDER_ERROR',
        error: { message: String(err && err.message || err), stack: err && err.stack },
      });
    }
  }

  function pickEntryPath(config) {
    const candidates = Object.keys(config.files);
    // 1) file whose basename matches the entry_module.
    const byName = candidates.find(
      (p) => p.toLowerCase().endsWith('/' + (config.entry_module + '').toLowerCase() + '.tsx'),
    );
    if (byName) return byName;
    // 2) the largest tsx file as a proxy for "the main one".
    return candidates
      .filter((p) => p.endsWith('.tsx'))
      .sort((a, b) => config.files[b].length - config.files[a].length)[0] || candidates[0];
  }

  function render() {
    if (!currentComponent || !currentRoot) return;
    const children = resolveChildren(currentProps);
    const props = { ...currentProps };
    delete props.__withIcon;
    delete props.children;
    try {
      currentRoot.render(React_.createElement(currentComponent, props, children));
    } catch (err) {
      send({
        type: 'RENDER_ERROR',
        error: { message: String(err && err.message || err), stack: err && err.stack },
      });
    }
  }

  function resolveChildren(props) {
    const withIcon = props.__withIcon;
    const text = typeof props.children === 'string' ? props.children : '';
    const icon = withIcon && LucideIcons && LucideIcons.Star
      ? React_.createElement(LucideIcons.Star, { size: 16, style: { marginRight: text ? 8 : 0 } })
      : null;
    if (icon && text) {
      return [icon, React_.createElement('span', { key: 't' }, text)];
    }
    return icon || text || undefined;
  }

  window.addEventListener('message', (ev) => {
    const data = ev.data || {};
    if (data.source === 'autodsm-iframe') return; // ignore echoes
    if (data.type === 'MOUNT') {
      mount(data.config);
    } else if (data.type === 'UPDATE_PROPS') {
      currentProps = { ...currentProps, ...data.props };
      render();
    }
  });

  window.addEventListener('error', (ev) => {
    send({
      type: 'RENDER_ERROR',
      error: { message: String(ev.message), stack: ev.error && ev.error.stack },
    });
  });
  window.addEventListener('unhandledrejection', (ev) => {
    send({
      type: 'RENDER_ERROR',
      error: { message: String(ev.reason && ev.reason.message || ev.reason) },
    });
  });

  send({ type: 'RUNTIME_READY' });
})();
`;
