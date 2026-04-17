'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Check, Github, KeyRound, Moon, Sun, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useScanStore } from '@/stores/scan';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { repo, clear, result } = useScanStore();
  const [ghToken, setGhToken] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [savedGh, setSavedGh] = useState(false);
  const [savedGemini, setSavedGemini] = useState(false);

  useEffect(() => {
    setMounted(true);
    setGhToken(localStorage.getItem('autodsm.gh_token') || '');
    setGeminiKey(localStorage.getItem('autodsm.gemini_key') || '');
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

  return (
    <div className="max-w-[720px] mx-auto px-8 py-10 flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-[24px] font-semibold tracking-tight font-heading">Settings</h1>
        <p className="text-[14px] text-t-secondary">
          Workspace, credentials, and appearance.
        </p>
      </header>

      <Section title="Appearance" description="Default to dark. Works everywhere.">
        <div className="grid grid-cols-2 gap-2">
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
        </div>
      </Section>

      <Section
        title="GitHub access"
        description="Optional personal access token. Raises the rate limit from 60 to 5,000 requests per hour and unlocks private repos. Stored locally in your browser."
      >
        <div className="flex flex-col gap-3">
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
          <p className="text-[12px] text-t-tertiary">
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
      </Section>

      <Section
        title="AI repair key"
        description="Gemini Flash-Lite key used when a component fails to render. Automatic repair is off by default."
      >
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
      </Section>

      <Section
        title="Workspace"
        description="Linked repository. Clear to onboard a new one."
      >
        <div className="rounded-lg border border-t-default p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[13px] text-t-tertiary">Repository</span>
            <span className="text-[14px] font-medium font-mono">
              {repo || '—'}
            </span>
            {result && (
              <span className="text-[12px] text-t-tertiary mt-1">
                {result.components.length} components · {result.tokens.length} tokens
              </span>
            )}
          </div>
          <Button variant="ghost" onClick={clearWorkspace} className="text-t-tertiary hover:text-[var(--danger)]">
            <Trash2 size={14} strokeWidth={1.5} />
            <span className="ml-2">Clear workspace</span>
          </Button>
        </div>
      </Section>

      <Section title="About" description="Build info.">
        <dl className="text-[13px] text-t-secondary flex flex-col gap-1.5">
          <Row label="Version" value="0.1.0 · local preview" />
          <Row label="Runtime" value="Next.js 15 · React 19" />
          <Row label="Renderer" value="iframe srcdoc · esbuild-wasm · esm.sh" />
        </dl>
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[15px] font-semibold tracking-tight font-heading">{title}</h2>
        {description && (
          <p className="text-[13px] text-t-secondary max-w-[560px]">{description}</p>
        )}
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
      <span className="flex items-center gap-2 text-[14px] font-medium">
        <span className="text-t-tertiary">{icon}</span>
        {label}
      </span>
      {active && <Check size={14} strokeWidth={2} style={{ color: 'var(--accent)' }} />}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-t-tertiary">{label}</dt>
      <dd className="font-mono text-[12px]">{value}</dd>
    </div>
  );
}
