import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Shown in the shell header (e.g. `button.tsx`). Falls back to "Components". */
  title?: string;
};

/**
 * Full-bleed brand shell aligned with Typography / Colors / Assets pages.
 */
export function ComponentWorkbenchShell({ children, title }: Props) {
  const heading = title?.trim() || "Components";
  return (
    <div className="box-border -mx-5 -mt-8 flex min-h-0 w-[calc(100%_+_2.5rem)] min-w-0 max-w-none flex-1 flex-col self-stretch sm:-mx-8 sm:-mt-10 sm:w-[calc(100%_+_4rem)]">
      <header className="box-border h-fit w-full min-w-0 shrink-0 self-stretch border-b border-border px-4 pb-4 pt-4">
        <h6 className="text-base font-semibold leading-6 tracking-normal text-foreground">{heading}</h6>
      </header>
      <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-5 pb-8 pt-6 sm:px-8 sm:pb-10 sm:pt-8">{children}</div>
    </div>
  );
}
