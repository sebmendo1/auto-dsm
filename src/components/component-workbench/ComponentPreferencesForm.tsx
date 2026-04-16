import type { ExtractedProp, ExtractedVariant } from "@/lib/renderer/types";

type Props = {
  propsMeta: ExtractedProp[];
  variantsMeta: ExtractedVariant[];
  propValues: Record<string, string | boolean>;
  onPropValuesChange: (next: Record<string, string | boolean>) => void;
  fileName: string;
};

function PillToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-border text-xs font-medium">
      <button
        type="button"
        className={`px-3 py-1.5 transition-colors ${
          !value
            ? "bg-brand text-white"
            : "bg-transparent text-foreground-secondary hover:text-foreground"
        }`}
        onClick={() => onChange(false)}
      >
        Off
      </button>
      <button
        type="button"
        className={`px-3 py-1.5 transition-colors ${
          value
            ? "bg-brand text-white"
            : "bg-transparent text-foreground-secondary hover:text-foreground"
        }`}
        onClick={() => onChange(true)}
      >
        On
      </button>
    </div>
  );
}

function labelForPropName(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export function ComponentPreferencesForm({
  propsMeta,
  variantsMeta,
  propValues,
  onPropValuesChange,
  fileName,
}: Props) {
  const booleanProps = propsMeta.filter(
    (p) =>
      (p.type === "boolean" || p.type === "boolean | undefined") &&
      !variantsMeta.some((v) => v.name === p.name),
  );

  const stringProps = propsMeta.filter(
    (p) =>
      (p.type === "string" ||
        p.type === "string | undefined" ||
        p.type === "ReactNode" ||
        p.type === "ReactNode | undefined") &&
      !variantsMeta.some((v) => v.name === p.name) &&
      (p.name === "children" || p.name === "label" || p.name === "title" || p.name === "text" || p.name === "placeholder"),
  );

  const hasControls = variantsMeta.length > 0 || booleanProps.length > 0 || stringProps.length > 0;

  const update = (key: string, value: string | boolean) => {
    onPropValuesChange({ ...propValues, [key]: value });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6 overflow-y-auto p-5">
      {hasControls ? (
        <>
          {/* Variant dropdowns (Configuration, State, Size, etc.) */}
          {variantsMeta.map((variant) => (
            <div key={variant.name} className="space-y-2">
              <label
                className="text-xs font-medium text-foreground-secondary"
                htmlFor={`prop-${variant.name}`}
              >
                {labelForPropName(variant.name)}
              </label>
              <select
                id={`prop-${variant.name}`}
                className="w-full rounded-md border border-border bg-input-bg px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus"
                value={(propValues[variant.name] as string) ?? variant.defaultValue ?? variant.values[0]}
                onChange={(e) => update(variant.name, e.target.value)}
              >
                {variant.values.map((v) => (
                  <option key={v} value={v}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Boolean toggles (Selected, Disabled, Loading, etc.) */}
          {booleanProps.map((prop) => (
            <div key={prop.name} className="space-y-2">
              <label className="text-xs font-medium text-foreground-secondary">
                {labelForPropName(prop.name)}
              </label>
              <PillToggle
                value={!!propValues[prop.name]}
                onChange={(v) => update(prop.name, v)}
              />
            </div>
          ))}

          {/* String inputs (Label, Title, Children, etc.) */}
          {stringProps.map((prop) => (
            <div key={prop.name} className="space-y-2">
              <label
                className="text-xs font-medium text-foreground-secondary"
                htmlFor={`prop-${prop.name}`}
              >
                {labelForPropName(prop.name)}
              </label>
              <input
                id={`prop-${prop.name}`}
                type="text"
                className="w-full rounded-md border border-border bg-input-bg px-3 py-2 text-sm text-foreground placeholder:text-foreground-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus"
                placeholder="Value"
                value={(propValues[prop.name] as string) ?? ""}
                onChange={(e) => update(prop.name, e.target.value)}
              />
            </div>
          ))}
        </>
      ) : (
        <p className="text-xs text-foreground-secondary">
          No extractable props found for <span className="font-mono">{fileName}</span>. Controls
          appear automatically when the component has typed props or CVA variants.
        </p>
      )}
    </div>
  );
}
