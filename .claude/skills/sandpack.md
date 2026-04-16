---
name: sandpack
version: 1.0
summary: Implement, debug, and extend Sandpack (CodeSandbox browser bundler) integrations — covers the full API surface including SandpackProvider, components, hooks, client, theming, file management, and dependency resolution.
---

# Sandpack Skill

Use this skill when working with `@codesandbox/sandpack-react` or `@codesandbox/sandpack-client`. Sandpack is CodeSandbox's browser bundler toolkit — it compiles and runs framework code (React, Vue, Svelte, Angular, Solid, vanilla) entirely in the browser inside an iframe. AutoDSM uses it to render live component previews from GitHub-sourced code.

## Architecture

Sandpack has four layers:

1. **SandpackProvider** — React context that owns all state: files, dependencies, active file, compilation status, error state. Every other piece communicates through it.
2. **Components** — Pre-built UI: `SandpackCodeEditor`, `SandpackPreview`, `SandpackFileExplorer`, `SandpackConsole`, `SandpackTests`, `SandpackCodeViewer`. All consume context from the provider.
3. **Hooks** — `useSandpack`, `useActiveCode`, `useSandpackNavigation`, `useSandpackConsole`, `useSandpackClient`, `useSandpackTheme`, `useTranspiledCode`. Granular access to provider state.
4. **Client** — `@codesandbox/sandpack-client`. Low-level iframe bundler protocol. Three implementations: `SandpackRuntime` (browser JS), `SandpackNode` (Nodebox for Node frameworks), `SandpackStatic` (service worker for vanilla).

**Data flow:** Provider → creates iframe(s) → loads bundler → compiles files + dependencies → renders output. Components read context; hooks expose it programmatically; client talks directly to the iframe.

## SandpackProvider — The Core

Everything starts with `SandpackProvider`. The `<Sandpack>` preset is just a wrapper that pairs the provider with `SandpackLayout` + default components.

### Provider Props

```tsx
<SandpackProvider
  template="react-ts"           // Starter template (see Templates below)
  theme={sandpackDark}           // Theme object or "auto" | "light" | "dark"
  files={{                       // File map (keys = paths, values = code or object)
    "/App.tsx": { code: "...", active: true, hidden: false, readOnly: false },
    "/utils.ts": "export const x = 1;",  // string shorthand
  }}
  customSetup={{
    dependencies: { "lucide-react": "^0.460.0" },  // npm packages to install
    entry: "/index.tsx",                             // override entry point
  }}
  options={{
    // Execution
    autorun: true,                 // start bundling immediately (default true)
    autoReload: true,              // reload on code changes (default true)
    recompileMode: "delayed",      // "delayed" | "immediate" (default "delayed")
    recompileDelay: 500,           // ms delay for "delayed" mode (default 500)
    initMode: "immediate",         // "immediate" | "lazy" | "user-visible" (default "lazy")
    initModeObserverOptions: { rootMargin: "200px" },  // IntersectionObserver for "user-visible"

    // Layout
    layout: "preview",             // "preview" | "tests" | "console"
    showTabs: true,
    closableTabs: false,
    showLineNumbers: true,
    showInlineErrors: false,
    showRunButton: false,
    showNavigator: false,
    showConsole: false,
    showConsoleButton: false,
    wrapContent: false,
    editorHeight: 300,             // pixels
    editorWidthPercentage: 50,     // 0-100
    resizablePanels: true,
    rtl: false,

    // File control
    readOnly: false,               // global read-only
    showReadOnly: true,            // show read-only badge
    visibleFiles: ["/App.tsx"],    // override hidden flags
    activeFile: "/App.tsx",        // override active flags

    // External
    externalResources: ["https://cdn.example.com/style.css"],  // injected into iframe <head>
    bundlerURL: undefined,         // self-hosted bundler URL override

    // Styling
    classes: {                     // CSS class overrides for sp-* elements
      "sp-wrapper": "my-wrapper",
      "sp-layout": "my-layout",
    },
  }}
>
  {children}
</SandpackProvider>
```

### Templates

Available values for `template`: `static`, `angular`, `react`, `react-ts`, `solid`, `svelte`, `vanilla`, `vue`.

Each template bundles starter files and framework dependencies. `react-ts` includes React 18 + TypeScript. Default is `vanilla`.

### File Object Shape

```ts
{
  code: string;       // file content
  readOnly?: boolean; // default false
  active?: boolean;   // default false — which file is shown in editor
  hidden?: boolean;   // default false — excluded from tabs but still bundled
}
```

- String shorthand: `"/path": "code"` is equivalent to `"/path": { code: "code" }`
- First file becomes active if no `active: true` is set
- `active: true` overrides `hidden: true` (file will be shown)
- `visibleFiles` and `activeFile` on `options` override per-file flags

### Multiple Clients

A single SandpackProvider can manage multiple `SandpackPreview` instances. Each preview creates its own iframe/client. Access all via:

```ts
const { sandpack } = useSandpack();
Object.values(sandpack.clients).forEach(client => {
  client.iframe.contentWindow.postMessage("msg", "*");
});
```

## Components

### SandpackLayout

Wraps components in a responsive two-column grid. Collapses to single column below 700px. Applies theming. Required between `SandpackProvider` and component children.

### SandpackPreview

```tsx
<SandpackPreview
  showNavigator={false}               // browser chrome (back/forward/URL)
  showOpenInCodeSandbox={true}         // "Open in CSB" button
  showRefreshButton={true}
  showSandpackErrorOverlay={true}      // error overlay on compilation failure
  showOpenNewtab={true}
  actionsChildren={<MyButton />}       // extra toolbar JSX
  startRoute="/about"                  // initial route in preview
/>
```

Ref access: `ref.current.getClient()` returns the sandpack client; `ref.current.clientId` returns the client ID.

### SandpackCodeEditor

```tsx
<SandpackCodeEditor
  showTabs={false}
  showLineNumbers={false}
  showInlineErrors={false}
  showRunButton={false}
  wrapContent={false}
  closableTabs={false}
  readOnly={false}
  showReadOnly={true}
  initMode="lazy"                      // "immediate" | "lazy" | "user-visible"
  extensions={[]}                      // CodeMirror Extension[]
  extensionsKeymap={[]}                // CodeMirror KeyBinding[]
  additionalLanguages={[]}             // CustomLanguage[] for extra syntax
/>
```

**CodeMirror access via ref:**
```ts
const ref = useRef();
// ...
const cm = ref.current.getCodemirror();  // EditorView
cm.state;          // editor state
cm.dispatch();     // editor dispatch
```

**Built-in languages:** JavaScript, JSX, TypeScript, TSX, CSS, SCSS, Less, HTML, Vue.

**Adding languages:**
```ts
import { python } from "@codemirror/lang-python";
additionalLanguages={[{ name: "python", extensions: [".py"], language: python() }]}
```

### SandpackFileExplorer

```tsx
<SandpackFileExplorer
  autoHiddenFiles={false}
  initialCollapsedFolder={["/components/src/"]}
/>
```

### SandpackConsole

```tsx
<SandpackConsole
  showHeader={true}
  showSyntaxError={false}
  showResetConsoleButton={true}
  showRestartButton={true}
  maxMessageCount={800}
  resetOnPreviewRestart={false}
  standalone={false}                   // if true, runs its own client
  onLogsChange={(logs) => {}}
  actionsChildren={<MyButton />}
/>
```

Supports: `console.log`, `console.warn`, `console.error`, `console.clear`. Does NOT support nested object inspection — pair with `console-feed` for that.

### SandpackTests

```tsx
<SandpackTests
  verbose={false}                      // show individual test results
  watchMode={true}                     // re-run on file changes
  onComplete={(results) => {}}
/>
```

Supports `.test.js(x)`, `.spec.js(x)`, `.test.ts(x)`, `.spec.ts(x)`. Extend Jest via `expect.extend()`.

### SandpackCodeViewer (read-only)

```tsx
<SandpackCodeViewer
  showTabs={false}
  showLineNumbers={false}
  wrapContent={false}
  code="const x = 1;"                 // override content
  initMode="lazy"
  decorators={[
    { className: "highlight", line: 1 },
    { className: "widget", line: 3, startColumn: 0, endColumn: 10, elementAttributes: {} },
  ]}
/>
```

### Other Components

- `SandpackTranspiledCode` — shows transpiled output of active file
- `FileTabs` — tab bar for file switching
- `Navigator` — URL bar with back/forward
- `OpenInCodeSandboxButton` / `UnstyledOpenInCodeSandboxButton`

## Hooks

All hooks must be called inside `SandpackProvider`. Specialized hooks use `useSandpack()` internally.

### useSandpack()

Full context access. Returns:

```ts
const { sandpack, dispatch, listen } = useSandpack();

// sandpack object:
sandpack.files            // Record<string, { code: string }>
sandpack.activeFile       // string (current file path)
sandpack.visibleFiles     // string[]
sandpack.error            // SandpackError | null
sandpack.clients          // Record<string, SandpackClient>

// Methods on sandpack:
sandpack.updateCurrentFile(code: string)
sandpack.updateFile(path: string, code: string)
sandpack.setActiveFile(path: string)
sandpack.openFile(path: string)
sandpack.closeFile(path: string)
sandpack.deleteFile(path: string)
sandpack.resetFile(path: string)
sandpack.resetAllFiles()

// dispatch/listen — direct bundler communication
dispatch({ type: "refresh" })
const unsub = listen((msg) => { /* bundler messages */ })
```

### useActiveCode()

For third-party editor integration (Monaco, Ace, etc.):

```ts
const { code, updateCode } = useActiveCode();
// code = string content of active file
// updateCode(newCode) = update active file
```

### useSandpackNavigation()

```ts
const { refresh } = useSandpackNavigation();
// refresh() resets the preview iframe
```

### useSandpackConsole()

```ts
const { logs, reset } = useSandpackConsole();
// logs = ConsoleMessage[]
// reset() clears the log buffer
```

### useSandpackClient()

Direct iframe control:

```ts
const { iframe, listen, dispatch } = useSandpackClient();
// iframe = React ref to the iframe element
// listen(callback) = subscribe to client messages, returns unsubscribe
// dispatch(message) = send to bundler
```

### useSandpackTheme()

```ts
const theme = useSandpackTheme();
// theme.id = unique theme identifier
// theme.colors, theme.syntax, etc.
```

### useTranspiledCode()

```ts
const transpiledModule = useTranspiledCode();
// returns the transpiled module from the bundler
```

## Client (Low-Level)

Package: `@codesandbox/sandpack-client`

### loadSandpackClient()

Recommended async factory — picks the right implementation:

```ts
import { loadSandpackClient } from "@codesandbox/sandpack-client";

const client = await loadSandpackClient(iframeElement, {
  files: { "/index.js": { code: "console.log('hi')" } },
  dependencies: { uuid: "latest" },
  entry: "/index.js",
  template: "react-ts",
}, {
  bundlerURL: undefined,
  width: "100%",
  height: "100%",
  skipEval: false,
  showOpenInCodeSandbox: false,
  showErrorScreen: true,
  showLoadingScreen: true,
  externalResources: [],
});
```

### Client Methods

```ts
client.updateSandbox({
  files: { "/index.js": { code: "..." } },
  entry: "/index.js",
  dependencies: { uuid: "latest" },
});

client.updateOptions({ showErrorScreen: false });
client.dispatch({ type: "refresh" });
const unsub = client.listen((msg) => { /* type, data */ });
const { sandboxId, editorUrl, embedUrl } = client.getCodeSandboxURL();
```

## Theming

### Pre-built Themes (import from `@codesandbox/sandpack-themes`)

`aquaBlue`, `atomDark`, `cobalt2`, `cyberpunk`, `dracula`, `ecoLight`, `freeCodeCampDark`, `githubLight`, `gruvboxDark`, `gruvboxLight`, `levelUp`, `monokaiPro`, `neoCyan`, `nightOwl`, `sandpackDark`, `amethyst`

### Custom Theme

```ts
theme={{
  colors: {
    accent: "rebeccapurple",
    surface1: "#1e1e1e",
    surface2: "#252525",
    surface3: "#333",
    clickable: "#999",
    base: "#808080",
    disabled: "#4D4D4D",
    hover: "#C5C5C5",
    error: "#ff453a",
    errorSurface: "#ffeceb",
  },
  syntax: {
    plain: "#FFFFFF",
    comment: { color: "#757575", fontStyle: "italic" },
    keyword: "#77B7D7",
    tag: "#DFAB5C",
    punctuation: "#ffffff",
    definition: "#86D9CA",
    property: "#77B7D7",
    static: "#C64640",
    string: "#977CDC",
  },
  font: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"Fira Mono", monospace',
    size: "13px",
    lineHeight: "20px",
  },
}}
```

Partial objects merge with defaults — you only need to specify overrides.

### Unstyled Import

Strip all default CSS (removes Stitches CSS-in-JS runtime):

```ts
import { Sandpack } from "@codesandbox/sandpack-react/unstyled";
```

### CSS Class Overrides

```ts
options={{
  classes: {
    "sp-wrapper": "custom-wrapper",
    "sp-layout": "custom-layout",
    "sp-tab-button": "custom-tab",
    "sp-preview-container": "custom-preview",
  }
}}
```

### SSR

```ts
import { getSandpackCssText } from "@codesandbox/sandpack-react";

// In your server-rendered HTML head:
<style id="sandpack" dangerouslySetInnerHTML={{ __html: getSandpackCssText() }} />
```

## Common Patterns

### Preview-Only (No Editor)

```tsx
<SandpackProvider template="react-ts" files={files} customSetup={{ dependencies }}>
  <SandpackPreview
    showNavigator={false}
    showOpenInCodeSandbox={false}
    showRefreshButton={false}
    showSandpackErrorOverlay
  />
</SandpackProvider>
```

This is what AutoDSM uses — preview only, no code editor visible.

### Delayed Recompilation

```tsx
options={{
  recompileMode: "delayed",
  recompileDelay: 320,
}}
```

Batches rapid code changes. Good for real-time prop editing.

### Immediate Init (Skip Lazy Loading)

```tsx
options={{ initMode: "immediate" }}
```

Starts bundling immediately instead of waiting for viewport intersection. Use when the preview is the primary content (not below the fold).

### External CSS/JS Injection

```tsx
options={{
  externalResources: [
    "https://cdn.tailwindcss.com",
    "https://fonts.googleapis.com/css2?family=Inter",
  ],
}}
```

Injected into the iframe's `<head>`. Available globally to all files.

### Hot-Updating Files Without Remounting

Use `useSandpack()` to patch files in-place:

```tsx
const { sandpack } = useSandpack();
sandpack.updateFile("/App.tsx", newCode);
```

This triggers recompilation without destroying the SandpackProvider. Faster than changing the `key` prop which fully remounts.

### Multiple Preview Panes

```tsx
<SandpackProvider template="react-ts" files={files}>
  <SandpackPreview />  {/* client 1 */}
  <SandpackPreview />  {/* client 2 — separate iframe */}
</SandpackProvider>
```

Each preview is an independent client under the same provider.

## Gotchas and Pitfalls

1. **`key` prop remounts everything.** Changing `key` on `SandpackProvider` destroys all clients and iframes, reinstalls dependencies, and restarts bundling from scratch. Only do this when the component identity changes (different slug), not for file updates.

2. **`initMode: "lazy"` is the default.** The preview won't start until the component scrolls into view. Use `"immediate"` if the preview is the main content.

3. **`recompileDelay` defaults to 500ms.** This adds perceived latency. For read-only previews (no user editing), set lower (e.g., 320ms) or use `"immediate"` recompile mode.

4. **Template files are always bundled.** When you pass `files`, they merge with the template's default files. The template's `/App.tsx` (or equivalent) is the entry point. If you override `/App.tsx`, the template's version is replaced.

5. **`REACT_TYPESCRIPT_TEMPLATE.files`** is a static object you can clone and extend. It gives you the full `react-ts` file tree. AutoDSM uses this to build custom file sets.

6. **Dependency resolution is automatic.** Sandpack scans `import` statements and installs packages from npm. But `customSetup.dependencies` lets you pin versions. Always pin versions for reproducibility — `"latest"` causes cold-start installs.

7. **Dependencies install on first run.** Sandpack downloads and caches npm packages in the browser via the CodeSandbox CDN. First load is slow; subsequent loads use IndexedDB cache. Pinning exact versions helps cache hits.

8. **Tailwind in Sandpack requires explicit setup.** You must provide `tailwind.config.cjs`, `postcss.config.cjs`, a CSS file with `@tailwind` directives, and add `tailwindcss`, `postcss`, `autoprefixer` to dependencies.

9. **The iframe is sandboxed.** Code runs in an iframe with its own global scope. `window`, `document`, `fetch` all refer to the iframe's context. No access to the parent page.

10. **Console output is limited.** `SandpackConsole` only captures `console.log/warn/error/clear`. No nested object inspection, no network tab, no DOM inspector. Use `console-feed` for richer output.

11. **Error overlay vs. error state.** `showSandpackErrorOverlay` renders a visual overlay inside the preview. The `sandpack.error` from `useSandpack()` gives you programmatic access to the same error for custom UI.

12. **File paths must start with `/`.** All file keys in the `files` object use absolute paths from the sandbox root: `"/App.tsx"`, `"/src/utils.ts"`, etc.

## AutoDSM-Specific Context

AutoDSM uses Sandpack in **preview-only mode** to render React components fetched from GitHub repos. Relevant files:

- `src/components/component-workbench/ComponentWorkbenchSandpack.tsx` — mounts `SandpackProvider` + `SandpackPreview`
- `src/lib/sandpack/build-sandpack-files.ts` — builds the `files` and `dependencies` objects from the component graph
- `src/lib/sandpack/repo-import-rewrite.ts` — rewrites path aliases for the sandbox virtual filesystem
- `src/lib/sandpack/sanitize-component-source.ts` — strips unsupported imports
- `src/lib/sandpack/workbench-preferences.ts` — canvas styling prefs

Current setup:
- Template: `react-ts`
- `initMode: "immediate"` (preview is the hero content)
- `recompileMode: "delayed"`, `recompileDelay: 320`
- `layout: "preview"` (no editor tabs, no console)
- Files are built by cloning `REACT_TYPESCRIPT_TEMPLATE` and injecting component source under `/src/r/...`
- Dependencies are merged from the component's extracted imports + a `KNOWN_VERSIONS` pinned map
- Tailwind support is conditional: enabled when `@tailwind` directives are detected in the repo's CSS
- `MemoryRouter` wraps all previews so `react-router-dom` Link/useLocation work
