import { Suspense } from 'react';
import { Sidebar } from '@/components/shell/Sidebar';
import { ScanBoot } from '@/components/shell/ScanBoot';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ScanBoot>
        <div className="flex min-h-screen surface-primary">
          <Sidebar />
          <div className="flex-1 pt-4 pr-4 pb-4">
            <div
              className="h-[calc(100vh-32px)] rounded-2xl border border-t-default flex flex-col overflow-hidden"
              style={{ background: 'var(--bg-secondary)' }}
            >
              {children}
            </div>
          </div>
        </div>
      </ScanBoot>
    </Suspense>
  );
}
