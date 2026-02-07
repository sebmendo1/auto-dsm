const rows = [
  { label: "H1", weight: "Bold", size: "48px" },
  { label: "H2", weight: "Bold", size: "40px" },
  { label: "H3", weight: "Bold", size: "32px" },
  { label: "H4", weight: "Bold", size: "24px" },
  { label: "H5", weight: "Bold", size: "20px" },
  { label: "H6", weight: "Bold", size: "16px" },
  { label: "Body 1", weight: "Medium", size: "16px" },
  { label: "Body 2", weight: "Medium", size: "14px" },
  { label: "Caption", weight: "Medium", size: "12px" },
];

export default function TypographyPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-foreground-tertiary">Brand guidelines</p>
        <h1 className="text-3xl font-semibold">Typography</h1>
      </header>

      <section className="rounded-2xl border border-border bg-background-elevated p-6">
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <p
                className={`font-semibold ${
                  row.weight === "Medium" ? "font-medium" : "font-semibold"
                }`}
                style={{ fontSize: row.size }}
              >
                {row.label}: Geist {row.weight} {row.size}
              </p>
              <span className="text-xs text-foreground-tertiary">{row.size}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
