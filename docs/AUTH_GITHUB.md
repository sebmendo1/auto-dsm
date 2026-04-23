# GitHub authentication and repository access

## Supabase OAuth (this app)

- **Start:** [`/auth/oauth?provider=github`](../src/app/auth/oauth/route.ts) with scopes `read:user user:email repo` so the user can list repositories and (with the same token) read private repo content for scans.
- **Token in session:** `session.provider_token` (used by [`GET /api/github/repos`](../src/app/api/github/repos/route.ts) and passed server-side into [`src/lib/github/fetch.ts`](../src/lib/github/fetch.ts) for `POST /api/scan`).
- **Google sign-in:** no GitHub `provider_token`; users paste a public `owner/name` or sign out and use GitHub for listing private repos.

## GitHub App (optional, advanced)

- Environment variables in [`.env.example`](../.env.example) support a **GitHub App** for org installs, webhooks, and least-privilege access. This is separate from user OAuth. `app_users.github_installation_id` in the database is reserved for a future install flow.

## Re-authentication

If the repo list is empty and `needsGitHubReauth` is true, the user should sign in again with GitHub after OAuth scope changes. The connect step offers a control to sign out and start GitHub OAuth.
