# Rendering

How autoDSM turns a `.tsx` file in a user's GitHub repo into a live, interactive preview in your browser in ~200ms.

This is the heart of the product. Everything else — tokens, docs, AI — hangs off of it.

---

## The hard requirement

Render **arbitrary user React components**, from **arbitrary repos**, with **their dependencies**, without:

1. Running a build on our server per component (too slow, too expensive).
2. Letting the user's code read our session cookies (obvious security disaster).
3. Requiring the user to install anything or fork their repo.

## The shape of the answer

A sandboxed `<iframe>` that receives:

- A **render config** describing the component, its props, its file graph, and its dependencies.
- A **runtime** (small JS bundle) that loads `esbuild-wasm` + `react` + `react-dom` from `esm.sh`, compiles the file graph in-browser, and mounts the component.
- A **postMessage protocol** for two-way communication with the parent page.

No server-side compile. Each render is a few hundred kB of JS into an isolated sandbox.

---

## Data flow

```
┌───────────────────┐   tree + raw files    ┌──────────────────────┐
│  GitHub Public    │ ────────────────────► │  Parser (Babel)      │
│  API (REST)       │                       │  src/lib/parsers/*   │
└───────────────────┘                       └──────────┬───────────┘
                                                       │ ParsedComponent
                                                       ▼
                                            ┌──────────────────────┐
                                            │  Orchestrator        │
                                            │  src/lib/scan/*      │
                                            └──────────┬───────────┘
                                                       │ ScanResult
                                                       │  (cached in memory)
                                                       ▼
                                            ┌──────────────────────┐
                                            │  Browser (parent)    │
                                            │  RenderCanvas        │
                                            └──────────┬───────────┘
                                                       │ postMessage(MOUNT)
                                                       ▼
                                            ┌──────────────────────┐
                                            │  Iframe runtime      │
                                            │  /api/render/iframe  │
                                            │  esbuild-wasm → ESM  │
                                            │  esm.sh  → deps      │
                                            └──────────────────────┘
```

## Render config

See `src/lib/render/types.ts`. Summary:

```ts
interface RenderConfig {
  entry_module: string;                    // component name to mount
  files: Record<string, string>;           // virtual fs, keyed by /absolute/path
  dependencies: Record<string, string>;    // bare imports seen in source
  providers: string[];                     // optional wrappers (best-effort)
  css_url?: string;                        // compiled Tailwind bundle (V2)
  initial_props: Record<string, unknown>;
  prop_controls: PropControl[];
  presets?: { label: string; props: Record<string, unknown> }[];
}
```

It is the *only* thing the iframe needs. No hidden calls back to our server during render.

## The iframe

Served from `/api/render/iframe`. Edge runtime. HTML shell looks like:

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <link rel="stylesheet" href="<css_url>" />
  <style>html,body{margin:0;background:transparent}</style>
</head>
<body>
  <div id="root"></div>
  <script type="module">/* IFRAME_RUNTIME_SOURCE */</script>
</body>
</html>
```

`IFRAME_RUNTIME_SOURCE` lives in `src/lib/render/iframe-runtime.ts` as a template literal. Shipping it as a string (not a Next.js route) keeps it cacheable and lets the iframe stay on a same-document origin while being locked down via `sandbox`.

### Sandbox

```html
<iframe sandbox="allow-scripts" ... />
```

No `allow-same-origin`. This means:

- No access to parent cookies or localStorage.
- No access to indexedDB shared with the parent.
- No way to navigate the top window.
- Cross-origin requests still work (to `esm.sh`, to the CSS bundle).

### postMessage protocol

| Message         | Direction       | Payload                                |
| --------------- | --------------- | -------------------------------------- |
| `RUNTIME_READY` | iframe → parent | (none)                                 |
| `MOUNT`         | parent → iframe | `{ config: RenderConfig }`             |
| `UPDATE_PROPS`  | parent → iframe | `{ props: Record<string, unknown> }`   |
| `RENDER_OK`     | iframe → parent | (none)                                 |
| `RENDER_ERROR`  | iframe → parent | `{ error: { message, stack } }`        |

All messages carry `source: 'autodsm-iframe'` so the parent can filter out messages from other iframes/extensions.

### Resolving imports

Inside the iframe, `esbuild.transform` compiles each TSX file to ESM. We then rewrite imports:

- **Bare imports** (`react`, `lucide-react`, `@radix-ui/react-slot`) → `https://esm.sh/<pkg>?bundle`.
- **Relative imports** (`./utils`, `../lib/cn`) → resolved against the virtual fs, compiled recursively, exposed as blob URLs.

Blob URL creation happens in two passes to handle forward references between files. A Map `<path> → <blobUrl>` is the source of truth.

### React version

React 19 RC from `https://esm.sh/react@19.0.0-rc.1?bundle`. Matched versions for `react-dom/client`. All user components render against this React — if their code references internals, it may break. Most won't.

### Prop updates

The parent debounces prop changes by **200ms** and sends `UPDATE_PROPS`. The iframe re-renders the same `ReactDOM.Root` — no remount, no fetch. Edits in the Preferences panel feel instant.

---

## Scanning

Source: `src/lib/scan/orchestrator.ts`.

1. Parse `owner/repo` from the URL (regex in `src/lib/github/files.ts`).
2. `GET /repos/{owner}/{repo}/git/trees/HEAD?recursive=1` (via `GitHubClient`).
3. Gate on `package.json` — must contain `react` and either `typescript` or `tsx` files.
4. Filter the tree:
   - `.tsx` files only.
   - Basename is PascalCase **or** path contains `/components/`.
   - Excludes: `node_modules`, `*.test.*`, `*.stories.*`, `dist`, `build`, `.next`.
   - Cap: 80 files per scan, 60 KB per file.
5. `GET` each raw file in parallel (batched).
6. Babel-parse, extract component name + props + variants (see `src/lib/parsers/components.ts`).
7. Walk the import graph to pull in local dependencies (`./utils`, etc.).
8. Return a `ScanResult { repo, components, tokens, render_configs, commits, assets }`.

The scan streams progress via Server-Sent Events at `/api/scan/stream`. The final result is cached in an in-memory LRU (10 entries) at `src/lib/scan/cache.ts` and fetched on-demand at `/api/scan/result`.

## Failure modes and fallbacks

| Failure                     | What the user sees                                     | What we do                                                         |
| --------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------ |
| Rate limited on GitHub      | "GitHub returned 403"                                  | Tell the user to add a PAT in Settings.                           |
| `esbuild.transform` error   | Fallback panel with "syntax error in `<path>`"         | Offer **Try AI repair**.                                           |
| Unresolved bare import      | Runtime error, fallback panel                          | Repair agent often removes/stubs the import.                       |
| Component needs a provider  | Runtime error ("useContext ... undefined")             | Add the provider name to `RenderConfig.providers` (best-effort).   |
| Infinite loop in effect     | Iframe freezes, `RENDER_ERROR` never arrives           | Parent timeout at 8s, shows fallback. (V2.)                        |

## Security notes

- **Never** set `sandbox="allow-same-origin"`. The point of the sandbox is that user code cannot read our cookies.
- **Never** inject an untrusted URL into the iframe's src or any attribute. Only the fixed `/api/render/iframe` URL is used.
- **Never** serialize a function into `postMessage`. Props are JSON only — function props (`onClick`, etc.) get replaced by `() => {}` stubs on the iframe side.
- The runtime swallows all errors with a top-level `try`/`catch` + `window.onerror` + `window.onunhandledrejection` handler. We report them via `RENDER_ERROR`; we never crash silently.

## Performance targets

| Phase                      | Target  | Notes                                 |
| -------------------------- | ------- | ------------------------------------- |
| Full scan (40 files)       | < 3 s   | Dominated by GitHub network IO.       |
| First render (cold iframe) | < 1 s   | esbuild-wasm init is ~400ms.          |
| Subsequent renders         | < 100ms | Module graph cached in the iframe.    |
| Prop update round-trip     | < 16ms  | Single postMessage + React re-render. |

## V2 additions

- **Tailwind precompile.** A scoped Tailwind build runs once per scan, emits a CSS bundle to Supabase Storage, URL goes into `css_url`. Much faster than resolving Tailwind via esm.sh.
- **Module federation cache.** Parent-served blob URL store, shared across iframes.
- **Playwright-in-worker** for visual regression.
