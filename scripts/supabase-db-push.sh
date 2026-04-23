#!/usr/bin/env bash
# Pushes migrations using a direct Postgres URL (avoids hosted cli_login_postgres API bug).
# Add to .env.local: SUPABASE_DB_PASSWORD=... (Dashboard → Project Settings → Database)
# Optional: SUPABASE_PROJECT_REF=yourref (default: mujlucfkoqvghvdikkhw)
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
[ -f .env.local ] && . ./.env.local
set +a

if [ -n "${DIRECT_URL:-}" ] || [ -n "${DATABASE_URL:-}" ]; then
  echo "db push: using DIRECT_URL or DATABASE_URL"
  exec npx supabase@latest db push --db-url "${DIRECT_URL:-$DATABASE_URL}"
fi

if [ -z "${SUPABASE_DB_PASSWORD:-}" ]; then
  echo "Missing SUPABASE_DB_PASSWORD in .env.local." >&2
  echo "Get it from: Supabase Dashboard → Project Settings → Database." >&2
  exit 1
fi

REF="${SUPABASE_PROJECT_REF:-mujlucfkoqvghvdikkhw}"
DBURL="$(node -e "const p=process.env.SUPABASE_DB_PASSWORD, r=process.env.SUPABASE_PROJECT_REF||'$REF'; if(!p) process.exit(1); console.log('postgresql://postgres:'+encodeURIComponent(p)+'@db.'+r+'.supabase.co:5432/postgres')")"

echo "db push: using direct db.<ref>.supabase.co:5432 connection"
exec npx supabase@latest db push --db-url "$DBURL"
