import { useCallback, useEffect, useMemo, useState } from "react";
import { Toast } from "@/components/ui/toast";
import type { ColorToken, ParseResult } from "@/lib/parser";
import { readStoredTokens } from "@/lib/parser/storage";

const PRIMARY_SECTION_DESCRIPTION =
  "Primary colors are used for your main brand. These are the essential pieces of your experience.";

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  primary: PRIMARY_SECTION_DESCRIPTION,
};

/** First segment of the token name (e.g. `primary-font-color` → `primary`) for section grouping. */
function nameSectionKey(name: string | null | undefined): string {
  const n = name?.trim();
  if (!n) return "tokens";
  const parts = n.split(/[-_/]/).filter(Boolean);
  const head = (parts[0] ?? n).toLowerCase();
  return head || "tokens";
}

function sectionDisplayTitle(key: string): string {
  if (key === "tokens") return "Tokens";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function sectionDescriptionFor(sectionKey: string): string {
  const lower = sectionKey.toLowerCase();
  return (
    CATEGORY_DESCRIPTIONS[lower] ??
    `Shades and variants for “${sectionDisplayTitle(sectionKey)}” from your connected repository.`
  );
}

function parseRgbFromComputed(rgb: string): { r: number; g: number; b: number; a: number } | null {
  const t = rgb.trim();
  const rgba = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i.exec(t);
  if (!rgba) return null;
  const r = Math.round(Number(rgba[1]));
  const g = Math.round(Number(rgba[2]));
  const b = Math.round(Number(rgba[3]));
  const a = rgba[4] !== undefined ? Number(rgba[4]) : 1;
  if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
  return { r, g, b, a };
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toLowerCase();
}

function rgbToHslString(r: number, g: number, b: number): string {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      default:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }
  }
  const hh = Math.round(h * 360);
  const ss = Math.round(s * 1000) / 10;
  const ll = Math.round(l * 1000) / 10;
  return `hsl(${hh}, ${ss}%, ${ll}%)`;
}

function resolveColorFormats(cssValue: string): { hex: string; rgb: string; hsl: string } {
  if (typeof document === "undefined") {
    return { hex: cssValue.trim(), rgb: "—", hsl: "—" };
  }
  const probe = document.createElement("div");
  probe.style.color = cssValue;
  probe.style.position = "absolute";
  probe.style.width = "0";
  probe.style.height = "0";
  probe.style.overflow = "hidden";
  probe.style.clipPath = "inset(50%)";
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  const parsed = parseRgbFromComputed(computed);
  if (!parsed) {
    return { hex: cssValue.trim(), rgb: "—", hsl: "—" };
  }
  const { r, g, b, a } = parsed;
  const hex = rgbToHex(r, g, b);
  const rgb =
    a < 1 && !Number.isNaN(a)
      ? `rgba(${r}, ${g}, ${b}, ${a === Math.floor(a) ? a : Number(a.toFixed(3))})`
      : `rgb(${r}, ${g}, ${b})`;
  const hsl = rgbToHslString(r, g, b);
  return { hex, rgb, hsl };
}

type ColorRowView = ColorToken & { hex: string; rgb: string; hsl: string };

export function BrandColorsPage() {
  const [tokens, setTokens] = useState<ParseResult | null>(null);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setTokens(readStoredTokens());
    const onUpdate = () => setTokens(readStoredTokens());
    window.addEventListener("autodsm:updated", onUpdate);
    return () => window.removeEventListener("autodsm:updated", onUpdate);
  }, []);

  const displayColors = useMemo(() => tokens?.colors ?? [], [tokens]);
  const colorCount = displayColors.length;

  const rowsWithFormats: ColorRowView[] = useMemo(
    () => displayColors.map((c) => ({ ...c, ...resolveColorFormats(c.value) })),
    [displayColors],
  );

  const grouped = useMemo(() => {
    const byKey = new Map<string, ColorRowView[]>();
    for (const row of rowsWithFormats) {
      const key = nameSectionKey(row.name);
      const list = byKey.get(key) ?? [];
      list.push(row);
      byKey.set(key, list);
    }
    for (const list of byKey.values()) {
      list.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }),
      );
    }
    const keys = Array.from(byKey.keys());
    keys.sort((a, b) => {
      if (a === "primary") return -1;
      if (b === "primary") return 1;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
    return keys.map((key) => ({
      key,
      title: sectionDisplayTitle(key),
      items: byKey.get(key) ?? [],
    }));
  }, [rowsWithFormats]);

  const copyColor = useCallback(async (color: ColorRowView) => {
    const text =
      color.hex.startsWith("#") && color.hex.length >= 4 ? color.hex : (color.value.trim() || color.hex);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setToast(`Copied ${text}`);
      } else {
        setToast("Clipboard unavailable");
      }
    } catch {
      setToast("Could not copy");
    }
  }, []);

  const hasContent = colorCount > 0;

  return (
    <div className="box-border -mx-5 -mt-8 flex min-h-0 w-[calc(100%_+_2.5rem)] min-w-0 max-w-none flex-1 flex-col self-stretch sm:-mx-8 sm:-mt-10 sm:w-[calc(100%_+_4rem)]">
      <header className="box-border h-fit w-full min-w-0 shrink-0 self-stretch border-b border-border px-4 pb-4 pt-4">
        <h6 className="text-base font-semibold leading-6 tracking-normal text-foreground">Colors</h6>
      </header>

      <div className="mx-auto w-full max-w-[700px] flex-1 space-y-8 px-5 pb-8 pt-6 sm:px-8 sm:pb-10 sm:pt-8">
        {loading ? (
          <div className="py-12 text-center">
            <p className="text-sm text-foreground-secondary">Parsing colors...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-foreground-secondary">{error}</p>
          </div>
        ) : !hasContent ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-foreground">No colors found</p>
            <p className="mt-2 text-sm text-foreground-secondary">
              No CSS color tokens were detected. Check the repo path or file patterns.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-foreground-tertiary">
              {colorCount} colors
            </p>
            {grouped.map((section) => (
              <section key={section.key} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {section.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
                    {sectionDescriptionFor(section.key)}
                  </p>
                  <p className="mt-2 text-xs text-foreground-tertiary">
                    {section.items.length} tint{section.items.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="divide-y divide-border">
                  {section.items.map((color, index) => (
                    <button
                      key={`${color.name}-${color.value}-${index}`}
                      type="button"
                      className="grid w-full cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-4 border-0 bg-transparent py-4 text-left outline-none transition-colors hover:bg-foreground/[0.04] focus-visible:bg-foreground/[0.04] focus-visible:ring-2 focus-visible:ring-border"
                      aria-label={`Copy ${color.hex}`}
                      onClick={() => void copyColor(color)}
                    >
                      <span
                        className="block h-12 w-12 shrink-0 rounded-xl border border-border sm:h-14 sm:w-14"
                        style={{ backgroundColor: color.value }}
                        aria-hidden
                      />
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="block text-sm font-semibold text-foreground">
                          {color.name?.trim() || color.value}
                        </span>
                        <span className="block text-sm text-foreground-tertiary">
                          {color.category?.trim() ? color.category : "description"}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col gap-0.5 text-right font-mono text-xs leading-relaxed text-foreground-tertiary">
                        <span className="block">{color.hex}</span>
                        <span className="block">{color.rgb}</span>
                        <span className="block">{color.hsl}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </div>
  );
}

