'use client';

import { usePathname } from 'next/navigation';
import { useScanStore } from '@/stores/scan';

interface Props {
  /** Override auto-detected label. */
  label?: string;
  /** Align left instead of center (component + token detail pages). */
  align?: 'center' | 'left';
}

export function TopBar({ label, align = 'center' }: Props) {
  const pathname = usePathname();
  const { repo, result } = useScanStore();

  const auto =
    label ??
    (() => {
      if (!repo) return '';
      if (pathname.startsWith('/dashboard/components/')) {
        const slug = pathname.split('/').pop();
        const c = result?.components.find((x) => x.slug === slug);
        return c ? `${c.name}.tsx` : '';
      }
      if (pathname.startsWith('/dashboard/tokens/')) {
        const cat = pathname.split('/').pop() ?? '';
        return cat.charAt(0).toUpperCase() + cat.slice(1);
      }
      // Dashboard / Agent / Settings → repo slug
      return repo.replace('/', '-');
    })();

  return (
    <div
      className={
        'h-[48px] md:h-[56px] flex items-center border-b border-t-default px-4 md:px-6 ' +
        (align === 'center' ? 'justify-center' : '')
      }
    >
      <span className="text-[13px] md:text-[14px] font-medium text-t-secondary truncate">{auto}</span>
    </div>
  );
}
