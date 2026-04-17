'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Check, Github, KeyRound, LogOut, Monitor, Moon, RefreshCcw, Sun, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useScanStore } from '@/stores/scan';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/env';

interface UserSummary {
  email?: string;
  name?: string;
  avatarUrl?: string;
  provider?: string;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { repo, clear, result } = useScanStore();
  const [ghToken, setGhToken] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [savedGh, setSavedGh] = useState(false);
  const [savedGemini, setSavedGemini] = useState(false);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setMounted(true);
    setGhToken(localStorage.getItem('autodsm.gh_token') || '');
    setGeminiKey(localStorage.getItem('autodsm.gemini_key') || '');

    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      setUser({
        email: u.email ?? undefined,
        name: (u.user_metadata?.full_name as string | undefined) ?? (u.user_metadata?.name as string | undefined),
        avatarUrl: u.user_metadata?.avatar_url as string | undefined,
        provider: (u.app_metadata?.provider as string | undefined) ?? 'email',
      });
    });
  }, []);

  function saveGh() {
    localStorage.setItem('autodsm.gh_token', ghToken);
    setSavedGh(true);
    setTimeout(() => setSavedGh(false), 1500);
  }

  function saveGemini() {
    localStorage.setItem('autodsm.gemini_key', geminiKey);
    setSavedGemini(true);
    setTimeout(() => setSavedGemini(false), 1500);
  }

  function clearWorkspace() {
    clear();
    localStorage.removeItem('autodsm.pendingRepo');
    sessionStorage.removeItem('autodsm.pendingRepo');
    window.location.href = '/onboarding';
  }

  const initials = (user?.name || user?.email || '?')
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="max-w-[720px] mx-auto px-4 md:px-8 py-6 md:py-10 flex flex-col gap-6 w-full">
      <header className="flex flex-col gap-1">
        <h1 className="type-h1">Settings</h1>
        <p className="type-body text-t-secondary">
          Account, repository, appearance, and access controls.
        </p>
      </header>

      {/* 1. Account */}
      <Card title="Account" description="Signed-in identity from Supabase.">
        <div className="flex items-center gap-4">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-[13px] font-semibold"
              style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
            >
              {initials || '?'}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="type-body font-medium truncate">{user?.name ?? user?.email ?? 'Guest'}</span>
            <span className="type-body-s text-t-tertiary truncate">
              {user?.email ?? 'not signed in'}
              {user?.provider ? ` · ${user.provider}` : ''}
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="/auth/signout"
            className="inline-flex items-center gap-2 rounded-lg border border-t-default px-4 py-2 text-[13px] font-medium text-t-primary hover:bg-[var(--bg-tertiary)] transition-base w-fit"
          >
            <LogOut size={14} strokeWidth={1.5} className="text-t-tertiary" />
            Sign out
          </a>
        </div>

        {/* AI repair key lives with the account — it is per-user and sent
            only when the server has no GEMINI_API_KEY configured. */}
        <div className="mt-5 pt-5 border-t border-t-subtle">
          <label className="flex flex-col gap-2">
            <span className="type-caption text-t-tertiary">AI repair key</span>
            <div className="flex items-center gap-2">
              <KeyRound size={16} strokeWidth={1.5} className="text-t-tertiary" />
              <Input
                type="password"
                autoComplete="off"
                spellCheck={false}
                placeholder="AIza••••••••••••••••••••"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="flex-1 font-mono text-[13px]"
              />
              <Button onClick={saveGemini} variant="secondary">
                {savedGemini ? <Check size={14} /> : 'Save'}
              </Button>
            </div>
            <span className="type-body-s text-t-tertiary">
              Gemini Flash-Lite key used when a component fails to render. Server-configured keys take precedence.
            </span>
          </label>
        </div>
      </Card>

      {/* 2. Repository */}
      <Card title="Repository" description="Linked source. Scans are cached per commit.">
        <div className="rounded-lg border border-t-default p-4 flex items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="type-body-s text-t-tertiary">Repository</span>
            <span className="type-body font-medium font-mono truncate">{repo || '—'}</span>
            {result && (
              <span className="type-body-s text-t-tertiary mt-1">
                {result.components.length} components · {result.tokens.length} tokens ·{' '}
                <span className="font-mono">Public repo — URL only</span>
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="ghost"
              onClick={() => repo && (window.location.href = `/onboarding/scanning?repo=${encodeURIComponent(repo)}`)}
              disabled={!repo}
            >
              <RefreshCcw size={14} strokeWidth={1.5} />
              <span className="ml-2">Refresh scan</span>
            </Button>
            <Button variant="ghost" onClick={() => (window.location.href = '/onboarding')}>
              <span>Change repo</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Appearance */}
      <Card title="Appearance" description="Dark by default. Pick System to follow your OS.">
        <div className="grid grid-cols-3 gap-2">
          <ThemeCard
            icon={<Moon size={16} strokeWidth={1.5} />}
            label="Dark"
            active={mounted && theme === 'dark'}
            onClick={() => setTheme('dark')}
          />
          <ThemeCard
            icon={<Sun size={16} strokeWidth={1.5} />}
            label="Light"
            active={mounted && theme === 'light'}
            onClick={() => setTheme('light')}
          />
          <ThemeCard
            icon={<Monitor size={16} strokeWidth={1.5} />}
            label="System"
            active={mounted && theme === 'system'}
            onClick={() => setTheme('system')}
          />
        </div>
      </Card>

      {/* 4. GitHub */}
      <Card
        title="GitHub"
        description="Private repo access will be handled through the autoDSM GitHub App once it is wired up. In the meantime, a personal access token raises the public API rate limit from 60 to 5,000 requests per hour."
      >
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-lg border border-t-default px-4 py-2 text-[13px] font-medium text-t-tertiary w-fit cursor-not-allowed"
            title="GitHub App install flow is not yet wired"
          >
            <Github size={14} strokeWidth={1.5} />
            Connect GitHub App (coming soon)
          </button>
          <div className="flex items-center gap-2">
            <Github size={16} strokeWidth={1.5} className="text-t-tertiary" />
            <Input
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="ghp_••••••••••••••••••••"
              value={ghToken}
              onChange={(e) => setGhToken(e.target.value)}
              className="flex-1 font-mono text-[13px]"
            />
            <Button onClick={saveGh} variant="secondary">
              {savedGh ? <Check size={14} /> : 'Save'}
            </Button>
          </div>
          <p className="type-body-s text-t-tertiary">
            Create one with <span className="font-mono">repo</span> scope at{' '}
            <a
              href="https://github.com/settings/tokens?type=beta"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-t-secondary"
            >
              github.com/settings/tokens
            </a>
            .
          </p>
        </div>
      </Card>

      {/* 5. Danger zone */}
      <Card
        title="Danger zone"
        description="Destructive actions. These cannot be undone."
        danger
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col min-w-0">
              <span className="type-body font-medium">Clear workspace</span>
              <span className="type-body-s text-t-tertiary">Forget the current repo, tokens, and components on this device.</span>
            </div>
            <Button
              variant="ghost"
              onClick={clearWorkspace}
              className="text-t-tertiary hover:text-[var(--error)] shrink-0"
            >
              <Trash2 size={14} strokeWidth={1.5} />
              <span className="ml-2">Clear</span>
            </Button>
          </div>
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-t-subtle">
            <div className="flex flex-col min-w-0">
              <span className="type-body font-medium">Delete account</span>
              <span className="type-body-s text-t-tertiary">Permanently remove your account and every scan tied to it.</span>
            </div>
            <Button
              variant="ghost"
              disabled={!confirmDelete}
              onClick={() => {
                // Server-side deletion endpoint is not yet wired; surface the
                // placeholder so the confirm flow is testable but nothing ships.
                alert('Account deletion is not yet wired. File an issue or contact support to remove your account.');
                setConfirmDelete(false);
              }}
              className="shrink-0"
              style={{ color: 'var(--error)' }}
            >
              <Trash2 size={14} strokeWidth={1.5} />
              <span className="ml-2">Delete account</span>
            </Button>
          </div>
          <label className="flex items-center gap-2 text-[12px] text-t-tertiary">
            <input
              type="checkbox"
              checked={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.checked)}
            />
            I understand this is permanent.
          </label>
        </div>
      </Card>
    </div>
  );
}

function Card({
  title,
  description,
  danger,
  children,
}: {
  title: string;
  description?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        'rounded-xl border p-6 flex flex-col gap-4',
        danger ? 'border-[color:color-mix(in_oklab,var(--error)_40%,var(--border-default))]' : 'border-t-default',
      )}
      style={{ background: 'var(--bg-elevated)' }}
    >
      <div className="flex flex-col gap-1">
        <h2 className="type-h3">{title}</h2>
        {description && <p className="type-body-s text-t-secondary max-w-[560px]">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function ThemeCard({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-base',
        active
          ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
          : 'border-t-default hover:border-[var(--border-strong)]',
      )}
    >
      <span className="flex items-center gap-2 type-body font-medium">
        <span className="text-t-tertiary">{icon}</span>
        {label}
      </span>
      {active && <Check size={14} strokeWidth={2} style={{ color: 'var(--accent)' }} />}
    </button>
  );
}
