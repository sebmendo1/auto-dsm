export default function CardsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-foreground-tertiary">Components</p>
        <h1 className="text-3xl font-semibold">Cards</h1>
      </header>
      <section className="rounded-2xl border border-border bg-background-elevated p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {["Elevated", "Outlined"].map((title) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-background px-6 py-5"
            >
              <p className="text-sm text-foreground-tertiary">{title}</p>
              <p className="mt-3 text-lg font-semibold">Card title</p>
              <p className="mt-2 text-sm text-foreground-secondary">
                Use cards to group tokens, components, or scan summaries.
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
