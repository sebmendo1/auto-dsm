# AutoDSM UI

Vite + React + TypeScript SPA for an onboarding → token-visualization flow. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for routes, APIs, and persistence.

## What’s Included

- Landing page → login → empty dashboard → connect repo dialog → parsing progress → token display
- Sidebar + canvas layout for brand guidelines and component previews
- Modern parsing progress UI (vertical steps)
- Click-to-copy with toast feedback
- Express API on `/api` for GitHub component discovery and source fetch (same origin in production preview)

## Routes

- `/` Landing page
- `/login` Sign in screen (button routes to dashboard for now)
- `/dashboard` Overview (metrics, recent activity, connect repo) + light/dark theming
- `/dashboard/settings` Appearance (light / dark / system)
- `/dashboard/projects/:id` Token display + states
- `/dashboard/brand/colors` Brand colors
- `/dashboard/brand/typography` Typography scale
- `/dashboard/components/buttons` Component previews (examples)

## UI State Previews

- Parsing: `/dashboard/projects/memento-app?state=parsing`
- Parsing error: `/dashboard/projects/memento-app?state=parsing-error`
- No tokens: `/dashboard/projects/memento-app?state=tokens-empty`
- Success: `/dashboard/projects/memento-app`

## Local Dev

```bash
npm install
npm run dev
```

- Vite: [http://localhost:5173](http://localhost:5173)
- API server: port `3001` (Vite proxies `/api` to it)

## Production-style preview

```bash
npm run build
npm run preview
```

Serves the built app and `/api` on [http://localhost:3000](http://localhost:3000) (override with `PORT`).

## Deploy

- **Static + API:** Run `npm run build` and host `dist/` plus the Express `server/` (or reimplement the two `/api` routes on your platform).
- **Split:** Deploy `dist/` to any static host and run the API elsewhere; set the client `fetch` base URL accordingly (today the app uses relative `/api`).

## Environment Variables (Optional)

Copy `.env.example` to `.env.local` when wiring auth:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Notes

- The parsing progress on the project page includes a UI-only simulation path; GitHub theme parsing uses the public GitHub API from the browser where applicable.
- Component discovery uses Octokit on the server (`server/index.ts`).
