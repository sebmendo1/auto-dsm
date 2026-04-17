import { Suspense } from 'react';
import { ScanBoot } from '@/components/shell/ScanBoot';
import { DashboardShell } from '@/components/shell/DashboardShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ScanBoot>
        <DashboardShell>{children}</DashboardShell>
      </ScanBoot>
    </Suspense>
  );
}
