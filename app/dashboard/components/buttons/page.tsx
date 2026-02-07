import { ArrowRight } from "lucide-react";

export default function ButtonsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-foreground-tertiary">Components</p>
        <h1 className="text-3xl font-semibold">Buttons</h1>
      </header>

      <section className="rounded-2xl border border-border bg-background-elevated p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-border bg-background px-6 py-5">
            <p className="text-sm text-foreground-tertiary">Primary</p>
            <button className="btn-primary inline-flex items-center gap-2">
              Primary action
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4 rounded-2xl border border-border bg-background px-6 py-5">
            <p className="text-sm text-foreground-tertiary">Secondary</p>
            <button className="btn-secondary inline-flex items-center gap-2">
              Secondary action
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4 rounded-2xl border border-border bg-background px-6 py-5">
            <p className="text-sm text-foreground-tertiary">Ghost</p>
            <button className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-background-tertiary">
              Ghost action
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4 rounded-2xl border border-border bg-background px-6 py-5">
            <p className="text-sm text-foreground-tertiary">Loading</p>
            <button className="btn-primary inline-flex items-center gap-2 opacity-70">
              Processing
              <span className="h-2 w-2 animate-pulse rounded-full bg-background" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
