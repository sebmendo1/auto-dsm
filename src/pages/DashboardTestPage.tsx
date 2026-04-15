/**
 * Dev workbench — same shell as production dashboard.
 * Open: /dashboard/dev/workbench
 */
export function DashboardTestPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight text-content-primary">Workbench</h1>
      <p className="text-sm leading-relaxed text-content-muted">
        Use this route for isolated UI experiments. The overview lives at{" "}
        <span className="font-mono text-xs text-content-faint">/dashboard</span>.
      </p>
    </div>
  );
}
