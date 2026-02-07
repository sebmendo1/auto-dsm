export default function ModalsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-foreground-tertiary">Components</p>
        <h1 className="text-3xl font-semibold">Modals</h1>
      </header>
      <section className="rounded-2xl border border-border bg-background-elevated p-6">
        <div className="rounded-2xl border border-border bg-background px-6 py-5">
          <p className="text-sm text-foreground-tertiary">Example modal</p>
          <h3 className="mt-3 text-lg font-semibold">Connect repository</h3>
          <p className="mt-2 text-sm text-foreground-secondary">
            This modal will handle GitHub repo selection and token scanning.
          </p>
          <div className="mt-4 flex gap-3">
            <button className="btn-secondary">Cancel</button>
            <button className="btn-primary">Connect</button>
          </div>
        </div>
      </section>
    </div>
  );
}
