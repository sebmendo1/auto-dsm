import type { ReactNode } from "react";

export function TokenSection({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-background-elevated p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground-tertiary">
          {count} tokens
        </span>
      </div>
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}
