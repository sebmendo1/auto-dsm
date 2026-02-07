const colorRows = [
  {
    label: "Primary",
    swatches: [
      "#0b3bdb",
      "#0b38d0",
      "#0b34c4",
      "#0b30b8",
      "#0b2cab",
      "#0b289f",
      "#0b2493",
      "#0b2087",
    ],
  },
  {
    label: "Secondary",
    swatches: [
      "#e6e6e6",
      "#cfcfcf",
      "#b8b8b8",
      "#a1a1a1",
      "#8a8a8a",
      "#737373",
      "#5c5c5c",
      "#454545",
    ],
  },
  {
    label: "Text",
    swatches: ["#d4d4d4", "#a3a3a3", "#737373", "#525252", "#3f3f3f"],
  },
  {
    label: "Borders",
    swatches: ["#404040", "#353535", "#2a2a2a", "#202020", "#161616"],
  },
];

export default function ColorsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-foreground-tertiary">Brand guidelines</p>
        <h1 className="text-3xl font-semibold">Colors</h1>
      </header>

      <section className="rounded-2xl border border-border bg-background-elevated p-6">
        <div className="space-y-6">
          {colorRows.map((row) => (
            <div key={row.label} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{row.label}</h3>
              <div className="flex flex-wrap gap-3">
                {row.swatches.map((color) => (
                  <div key={color} className="flex flex-col items-center gap-2">
                    <div
                      className="h-14 w-14 rounded-2xl border border-border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-foreground-tertiary">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
