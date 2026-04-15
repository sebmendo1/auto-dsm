# AutoDSM architecture

This document describes the Vite + React application (migrated from Next.js App Router). It is the parity reference for routes, layout rules, persistence, HTTP APIs, and shared libraries.

## Route map

| Path | Description |
|------|-------------|
| `/` | Landing |
| `/login` | Sign-in screen (stub; routes to dashboard) |
| `/onboarding` | Onboarding copy and CTAs |
| `/dashboard` | Overview (Figma-style metrics, recent activity, connect repo) |
| `/dashboard/settings` | Settings; appearance (light / dark / system) |
| `/dashboard/assets` | Assets placeholder (future extraction) |
| `/dashboard/dev/workbench` | Dev workbench |
| `/dashboard/projects/:id` | Project detail; `?repo=` and `?state=` drive parsing and UI modes |
| `/dashboard/brand/colors` | Color tokens; `?state=parsing&repo=` triggers client-side fetch |
| `/dashboard/brand/typography` | Typography tokens and scale |
| `/dashboard/components/buttons` | Static button previews |
| `/dashboard/components/cards` | Static card previews |
| `/dashboard/components/inputs` | Static input previews |
| `/dashboard/components/modals` | Static modal previews |
| `/dashboard/components/:slug` | Component source viewer (uses API + localStorage) |

### Dashboard layout and sidebar

All `/dashboard/*` routes use a **single global wash** (`surface-base`), a **persistent left sidebar**, and a **gradient content well** (`.app-well`) that wraps the main `<Outlet />` (see [`src/layouts/DashboardLayout.tsx`](../src/layouts/DashboardLayout.tsx)).

**Sidebar** ([`src/components/layout/sidebar.tsx`](../src/components/layout/sidebar.tsx)): Cursor-style rail; in **dark** mode the rail background is **`#151617`** (`--color-sidebar-bg`). Primary nav (Dashboard with gauge icon, Typography, Colors, Assets), collapsible **Components** (indented list from discovery), footer workspace row + Settings (gear). GitHub discovery behavior is unchanged.

### Theme (light / dark)

- `html` uses class `dark` when the resolved theme is dark (`tailwind.config` `darkMode: 'class'`).
- User preference is stored as `autodsm:theme`: `light` | `dark` | `system` (default when unset: **system**, aligned with the inline script in `index.html`).
- [`src/theme/ThemeProvider.tsx`](../src/theme/ThemeProvider.tsx) syncs preference, `prefers-color-scheme` when `system`, and `document.documentElement.classList`.

### Same-tab data refresh

`window.dispatchEvent(new CustomEvent("autodsm:updated"))` is fired via [`notifyAppDataUpdated()`](../src/lib/app-events.ts) after tokens, `lastRepo`, or components are written so the dashboard overview and sidebar footer can refresh without a full reload.

## Client persistence (`localStorage`)

| Key | Purpose |
|-----|---------|
| `autodsm:tokens` | JSON `ParseResult` from parser (`lib/parser/storage.ts` reads this key) |
| `autodsm:lastRepo` | Last analyzed repo full name, e.g. `owner/repo` |
| `autodsm:components` | JSON array of discovered components for sidebar and detail page |
| `autodsm:fonts` | JSON array of font metadata for typography page |
| `autodsm:theme` | `light` \| `dark` \| `system` — appearance preference |

## HTTP API (same-origin `/api/*`)

The SPA calls these endpoints with **relative URLs** so dev uses the Vite proxy and production uses the same Node server that serves the built app.

### `POST /api/github/discover-components`

**Body (JSON):** `{ "repoFullName": "owner/repo" }`

**Success:** JSON from `discoverComponents()` — includes `components`, `repo`, `totalCount`, etc.

**Errors:**

- `400` — missing or invalid `repoFullName`
- `404` — repository not found (GitHub)
- `500` — discovery failure; body `{ "error": string }`

### `GET /api/components/:slug`

**Query:** `repo` (full name `owner/repo`), `filePath` (path in repo)

**Success:** `{ name, filePath, source, dependencies, hasDefaultExport, exportName }`

**Errors:** `400` if `repo` or `filePath` missing; `500` on fetch failure.

## Where code runs

- **Browser:** All route UI under `src/pages/`, `src/components/`, and most of `src/lib/` (including `lib/parser/github.ts` and `lib/github/fetcher.ts`, which call the GitHub HTTP API from the client for token extraction).
- **Node (Express, `server/`):** Only the two routes above — uses Octokit in `lib/github/component-discovery.ts` and `lib/github/component-fetcher.ts`. Prefer **server-side** GitHub tokens here if you add auth; do not put secrets in `VITE_*` env vars.

## Design system

- **Semantic colors:** `surface.*`, `content.*`, `brand`, `hairline`, etc. in `tailwind.config.ts` map to CSS variables in `src/index.css` (`:root` for light, `.dark` for dark).
- **Legacy aliases:** `background.*`, `foreground.*`, and `border.*` map to the same variables so older components keep working.
- **Dashboard well:** `.app-well` applies the inset gradient panel border/radius.
- **Fonts:** Geist WOFF2 in `/fonts/`; `--font-geist-sans` / `--font-geist-mono` on `:root`.

## Library index (`src/lib/`)

| Area | Role |
|------|------|
| `lib/github/types.ts` | Shared types for discovery |
| `lib/github/component-discovery.ts` | Octokit tree walk; used by API server |
| `lib/github/component-fetcher.ts` | Fetch component source; used by API server |
| `lib/github/fetcher.ts` | Public-repo file fetch for colors/typography; **browser** |
| `lib/github/patterns.ts` | Path patterns for components |
| `lib/parser/*` | Parse results, storage, GitHub theme parsing, CSS/Tailwind helpers |
| `lib/renderer/*` | Preview sandbox, props, variants (component previews) |

## Scripts (`scripts/`)

Node/TS utilities, not required to run the web app:

- `extract-colors.ts`, `extract-typography.tsx` — extraction helpers
- `test-component-discovery.ts` — exercises discovery logic

Run with `npx tsx scripts/...` if needed.

## Local development

1. `npm install`
2. `npm run dev` — Vite (default `http://localhost:5173`) and API server on port `3001`; Vite proxies `/api` to `3001`.

## Production-style preview

`npm run build` then `npm run preview` — single process serves `dist/` and `/api` on `PORT` (default `3000`).

## Environment variables

See [`.env.example`](../.env.example). Client-only vars use the `VITE_` prefix. GitHub OAuth secrets belong on the server only, if wired later.
