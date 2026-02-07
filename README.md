# AutoDSM UI Boilerplate

Vercel-ready Next.js App Router UI for an onboarding → token-visualization flow. This repo is frontend-only: no Supabase or GitHub wiring yet.

## What’s Included

- Landing page → login → empty dashboard → connect repo dialog → parsing progress → token display
- Sidebar + canvas layout for brand guidelines and component previews
- Modern parsing progress UI (vertical steps)
- Click-to-copy with toast feedback

## Routes

- `/` Landing page
- `/login` Sign in screen (button routes to dashboard for now)
- `/dashboard` Empty dashboard with connect dialog
- `/dashboard/projects/[id]` Token display + states
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

## Deploy to Vercel

- Push to GitHub
- Import into Vercel
- No special build settings needed

## Environment Variables (Optional)

Copy `.env.example` to `.env.local` and fill in values when you wire auth:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Notes

- This UI is intentionally static; wire Supabase + GitHub later.
- The parsing progress is a UI-only simulation right now.
