import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Component",
};

export default function ComponentDetailPage({ params }: { params: { slug: string } }) {
  const name = decodeURIComponent(params.slug)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs text-foreground-tertiary">Components</p>
        <h1 className="text-3xl font-semibold">{name}</h1>
      </header>
      <section className="rounded-2xl border border-border bg-background-elevated px-6 py-6">
        <p className="text-sm text-foreground-secondary">
          Component preview and documentation will appear here once parsing is connected.
        </p>
      </section>
    </div>
  );
}
