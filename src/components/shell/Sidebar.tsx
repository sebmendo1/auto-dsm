'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Feather, PanelLeft, Settings as SettingsIcon } from 'lucide-react';
import { useScanStore } from '@/stores/scan';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface Props {
  onToggle?: () => void;
}

export function Sidebar({ onToggle }: Props) {
  const pathname = usePathname();
  const { result, repo } = useScanStore();

  const tokenCategories = Array.from(
    new Set(result?.tokens.map((t) => t.category)),
  );

  const components = (result?.components ?? []).slice().sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const workspaceName = repo ? repo.split('/')[1] : 'autoDSM';
  const initials = (workspaceName || 'AB')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="h-screen w-[240px] flex flex-col surface-primary">
      <div className="flex items-center h-[52px] px-3">
        <button
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className="h-8 w-8 flex items-center justify-center rounded-md text-t-tertiary hover:text-t-primary hover:bg-[var(--bg-tertiary)] transition-base"
        >
          <PanelLeft size={20} strokeWidth={2} />
        </button>
      </div>

      <nav className="px-3 flex flex-col gap-0.5">
        <SidebarLink
          href="/dashboard/agent"
          icon={<Feather size={16} strokeWidth={2} className="font-black" />}
          active={pathname === '/dashboard/agent'}
        >
          New agent
        </SidebarLink>
        <SidebarLink href="/dashboard" icon={<Compass size={16} strokeWidth={2} />} active={pathname === '/dashboard'}>
          Dashboard
        </SidebarLink>
      </nav>

      <div className="px-3 mt-4 flex-1 overflow-y-auto flex flex-col gap-2">
        <Accordion
          type="multiple"
          defaultValue={['tokens', 'components']}
          className="flex flex-col gap-1"
        >
          <AccordionItem value="tokens" className="border-none">
            <AccordionTrigger className="!px-2">DESIGN TOKENS</AccordionTrigger>
            <AccordionContent className="pl-1">
              <ul className="flex flex-col">
                {tokenCategories.length === 0 && (
                  <li className="px-3 py-1.5 text-[13px] text-t-tertiary">No design tokens detected.</li>
                )}
                {tokenCategories.map((cat) => (
                  <li key={cat}>
                    <SidebarSubLink
                      href={`/dashboard/tokens/${cat}`}
                      active={pathname.includes(`/tokens/${cat}`)}
                      label={capitalize(cat)}
                    />
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="components" className="border-none">
            <AccordionTrigger className="!px-2">COMPONENTS</AccordionTrigger>
            <AccordionContent className="pl-1">
              <ul className="flex flex-col max-h-[45vh] overflow-y-auto">
                {components.length === 0 && (
                  <li className="px-3 py-1.5 text-[13px] text-t-tertiary">No components detected</li>
                )}
                {components.map((c) => (
                  <li key={c.slug}>
                    <SidebarSubLink
                      href={`/dashboard/components/${c.slug}`}
                      active={pathname === `/dashboard/components/${c.slug}`}
                      label={`${c.name}.tsx`}
                    />
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="p-3 flex flex-col gap-1">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[14px] font-medium transition-base',
            pathname === '/dashboard/settings'
              ? 'bg-[var(--bg-tertiary)] text-t-primary'
              : 'text-t-secondary hover:text-t-primary hover:bg-[var(--bg-tertiary)]',
          )}
        >
          <span className="text-t-tertiary">
            <SettingsIcon size={16} strokeWidth={2} />
          </span>
          <span>Settings</span>
        </Link>
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--bg-tertiary)] cursor-pointer transition-base">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[12px] font-semibold"
            style={{ background: 'var(--accent)' }}
          >
            {initials}
          </div>
          <span className="text-[13px] font-medium text-t-primary truncate">
            {workspaceName}
          </span>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  icon,
  active,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[14px] font-medium transition-base',
        active
          ? 'bg-[var(--bg-tertiary)] text-t-primary'
          : 'text-t-secondary hover:text-t-primary hover:bg-[var(--bg-tertiary)]',
      )}
    >
      <span className="text-t-tertiary">{icon}</span>
      <span>{children}</span>
    </Link>
  );
}

function SidebarSubLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'relative flex items-center pl-4 pr-3 py-1.5 text-[13px] transition-base rounded-md',
        active
          ? 'bg-[var(--accent-subtle)] text-t-primary'
          : 'text-t-secondary hover:text-t-primary',
      )}
    >
      {active && (
        <span
          className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full"
          style={{ background: 'var(--accent)' }}
        />
      )}
      <span className="truncate">{label}</span>
    </Link>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
