'use client';

import { Palette, Boxes, ImageIcon, FileText } from 'lucide-react';
import { TopBar } from '@/components/shell/TopBar';
import { useScanStore } from '@/stores/scan';
import { formatRelativeDate } from '@/lib/utils';

export default function DashboardPage() {
  const { result } = useScanStore();
  if (!result) return null;

  const metrics = [
    { label: 'Design tokens', count: result.tokens.length, icon: Palette },
    { label: 'Components', count: result.components.length, icon: Boxes },
    { label: 'Visual assets', count: result.assets.length, icon: ImageIcon },
    { label: 'Documentation', count: result.components.filter((c) => c.description).length, icon: FileText },
  ];

  return (
    <>
      <TopBar />
      <div className="flex-1 overflow-y-auto p-10">
        <h1 className="font-display font-bold text-[30px] leading-[38px] text-t-primary" style={{ letterSpacing: '-0.015em' }}>
          Your GitHub project
        </h1>
        <p className="mt-2 text-[15px] leading-[24px] text-t-secondary max-w-[640px]">
          Here are all your active components and performance metrics around them.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-t-default p-5 h-[112px] flex flex-col justify-between"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <span className="text-[14px] font-medium text-t-secondary">{m.label}</span>
              <div className="flex items-end gap-3">
                <m.icon size={24} className="text-t-tertiary" strokeWidth={1.5} />
                <span className="font-display font-bold text-[28px] leading-none text-t-primary">
                  {m.count}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-6 rounded-xl border border-t-default p-6"
          style={{ background: 'var(--bg-elevated)' }}
        >
          <h2 className="text-[14px] font-medium text-t-secondary mb-4">Recent changes</h2>
          {result.commits.length === 0 ? (
            <p className="text-[13px] text-t-tertiary">No commits retrieved.</p>
          ) : (
            <ul>
              {result.commits.map((c, i) => (
                <li
                  key={c.sha}
                  className={
                    'flex items-center justify-between py-3 ' +
                    (i < result.commits.length - 1 ? 'border-b border-t-subtle' : '')
                  }
                >
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[14px] font-medium text-t-primary truncate mr-4 hover:underline underline-offset-4"
                  >
                    {c.message}
                  </a>
                  <span className="text-[13px] text-t-tertiary shrink-0 font-mono">
                    {formatRelativeDate(c.date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
