# Vercel `autodsm` + Supabase auth (contribute build)

Use this checklist so the **contribute build** on Vercel uses **`brand-book-v1`** and **Supabase Auth (GitHub OAuth)** works end-to-end.

## 1. Git ↔ Vercel (source of truth)

| Check | Action |
|--------|--------|
| Repository | **GitHub**: `sebmendo1/auto-dsm` |
| Contribute branch | **`brand-book-v1`** (contains auth routes: `/login`, `/auth/callback`, `/auth/bridge`) |
| Vercel project | Open [Vercel Dashboard](https://vercel.com) → project **`autodsm`** → **Settings → Git** |

**If “contribute build” = Production**

- **Settings → Git → Production Branch** → set to **`brand-book-v1`**.
- Redeploy Production (or push to `brand-book-v1`).

**If “contribute build” = Preview only**

- Keep Production Branch as `main` (or your default).
- Open a PR from `brand-book-v1` → default branch, or push to `brand-book-v1` and confirm a **Preview** deployment is created for that branch.

## 2. Build settings (Vercel)

| Setting | Value |
|---------|--------|
| **Root Directory** | **`.` (repo root)** — must be the folder that contains this repo’s `package.json` and `package-lock.json`. If you see *“No Next.js version detected”*, the Root Directory is almost always wrong (e.g. parent monorepo folder, or a subpath that does not contain `next` in `package.json`). |
| Framework | Next.js (also set in [`vercel.json`](../vercel.json)) |
| Install | `npm install` (repo uses `package-lock.json`; `pnpm` is optional if you align lockfiles) |
| Build | `npm run build` |
| Output | Default (Next.js) |

## 3. Environment variables (Vercel)

Set in **Project → Settings → Environment Variables** for **Preview** and/or **Production** (match where you test).

### Supabase (this project)

- **Project URL**: `https://mujlucfkoqvghvdikkhw.supabase.co`
- **Project ref**: `mujlucfkoqvghvdikkhw`

| Name | Notes |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mujlucfkoqvghvdikkhw.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | From Supabase Dashboard → **Project Settings → API** (publishable / anon-style key used by the browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional legacy fallback if you do not use publishable key |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Optional: some Vercel or Supabase integrations add these **without** `NEXT_PUBLIC_`. This repo’s [`next.config.mjs`](../next.config.mjs) maps them into the client bundle at build time so login works without duplicating keys. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; only if routes need to bypass RLS (keep out of client) |
| `NEXT_PUBLIC_APP_URL` | **Exact** deployed origin, e.g. `https://autodsm.vercel.app` or your custom domain (no trailing slash) |

After changing env vars, **redeploy** so the build picks them up.

## 4. Supabase Auth (Dashboard)

Project: [Supabase Dashboard](https://supabase.com/dashboard) → project **`mujlucfkoqvghvdikkhw`**.

### URL configuration

**Authentication → URL Configuration**

- **Site URL**: use your primary **app** URL (e.g. `https://autodsm.vercel.app`). Do **not** set Site URL to `https://mujlucfkoqvghvdikkhw.supabase.co` — that can break OAuth and surface errors on paths like `/oauth/consent` on the Supabase host.
- **Redirect URLs**: add every origin you use for OAuth return:

```
https://<your-production-domain>/auth/callback
https://<your-preview-deployment>.vercel.app/auth/callback
```

**Current production deploys** (add each to **Redirect URLs** if you use that origin):

- `https://autodsm.vercel.app/auth/callback`
- `https://www.autodsm.ai/auth/callback` (production alias on the Vercel project)

Vercel **Production** should also define `NEXT_PUBLIC_APP_URL` to the same primary origin you use as **Site URL** (e.g. `https://autodsm.vercel.app` with no trailing slash).

For rotating Vercel preview URLs, either:

- Add each preview URL after deploy, or  
- Use a **wildcard** redirect pattern if your Supabase plan/settings allow (e.g. `https://*.vercel.app/auth/callback` — confirm in Supabase docs for your project).

OAuth is started from the browser on [`/login`](../src/app/login/page.tsx) via `signInWithOAuth`, with `redirectTo` = `NEXT_PUBLIC_APP_URL` (if set) or `window.location.origin`, plus **`/auth/callback`**. That URL must appear in Supabase **Redirect URLs**.

### GitHub provider

**Authentication → Providers → GitHub**

- Enable GitHub.
- Paste **Client ID** and **Client Secret** from a GitHub OAuth App whose **Authorization callback URL** is Supabase’s (shown in the Supabase GitHub provider setup — typically `https://mujlucfkoqvghvdikkhw.supabase.co/auth/v1/callback`).

### Google provider (optional)

Same section → **Google** — only if you use “Continue with Google” on `/login`.

## 5. End-to-end verification (deployed URL)

**Smoke (no OAuth):** `GET https://autodsm.vercel.app/login` should return **200** once the latest build is live.

On the Vercel deployment URL (e.g. deployment overview: [autodsm deployment](https://vercel.com)):

1. Open **`/login`**.
2. Click **Continue with GitHub** (starts Supabase OAuth in the browser, then redirects to GitHub).
3. Complete GitHub consent.
4. Expect: **`/auth/callback`** → **`/auth/bridge`** → **`/dashboard`** or **`/onboarding`**.
5. Refresh **`/dashboard`** — session should persist (cookies + middleware in [`src/middleware.ts`](../src/middleware.ts)).

### Failure quick map

| Symptom | Likely fix |
|---------|------------|
| `{"error":"requested path is invalid"}` (often on `*.supabase.co`) | Usually **`GET /oauth/consent`** on the project host (not served on hosted projects). Fix **Site URL** to your Vercel app origin; ensure **Redirect URLs** include `https://<your-app>/auth/callback`. |
| “Redirect URL not allowed” | Add exact `https://<host>/auth/callback` to Supabase Redirect URLs. |
| Login button does nothing / instant error | Missing or wrong `NEXT_PUBLIC_SUPABASE_*` in Vercel; redeploy. |
| Callback then always `/login` | `exchangeCodeForSession` failing — check Supabase logs; confirm Site URL / redirect allowlist. |

## 6. Related code paths

- OAuth start (browser): `src/app/login/page.tsx`
- Code exchange: `src/app/auth/callback/route.ts`
- Client bridge: `src/app/auth/bridge/page.tsx`
- Supabase clients: `src/lib/supabase/{client,server,middleware}.ts`
