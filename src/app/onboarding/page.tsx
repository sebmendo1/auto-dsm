'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { parseRepoIdentifier } from '@/lib/github/files';

export default function OnboardingPage() {
  const [value, setValue] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  function submit() {
    const ref = parseRepoIdentifier(value);
    if (!ref) {
      setErr('Enter a full GitHub URL or `owner/repo`.');
      return;
    }
    const normalized = `${ref.owner}/${ref.name}`;
    router.push(`/onboarding/scanning?repo=${encodeURIComponent(normalized)}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center surface-primary px-4">
      <div
        className="w-full max-w-[480px] rounded-2xl border border-t-default p-10"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <div className="flex justify-center">
          <Image src="/brand/autodsm-icon-dark.svg" alt="autoDSM" width={32} height={32} />
        </div>
        <h1 className="mt-6 text-center font-display font-semibold text-[24px] text-t-primary">
          Connect a repository
        </h1>
        <p className="mt-2 text-center text-[14px] text-t-secondary">
          autoDSM will scan your repo and build a living design system from your source code.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <div>
            <label className="text-[13px] font-medium text-t-secondary">Paste a public GitHub repository URL</label>
            <Input
              placeholder="github.com/shadcn-ui/ui"
              value={value}
              onChange={(e) => { setValue(e.target.value); setErr(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              className="mt-2"
            />
            {err && <p className="mt-2 text-[12px] text-[var(--error)]">{err}</p>}
          </div>
          <Button onClick={submit} size="lg" className="w-full">Continue</Button>
          <p className="text-center text-[12px] text-t-tertiary">
            Need private repo access?{' '}
            <a className="underline underline-offset-2 hover:text-t-secondary" href="https://github.com/apps/autodsm/installations/new" target="_blank" rel="noreferrer">
              Connect GitHub →
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
