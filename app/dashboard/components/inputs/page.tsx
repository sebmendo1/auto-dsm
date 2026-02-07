export default function InputsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-foreground-tertiary">Components</p>
        <h1 className="text-3xl font-semibold">Inputs</h1>
      </header>
      <section className="rounded-2xl border border-border bg-background-elevated p-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-foreground-tertiary">Search</p>
            <input
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/60"
              placeholder="Search tokens"
            />
          </div>
          <div>
            <p className="text-sm text-foreground-tertiary">Name</p>
            <input
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/60"
              placeholder="Token name"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
