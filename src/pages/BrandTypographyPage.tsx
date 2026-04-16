import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { ParseResult, TypographyStyleRow } from "@/lib/parser";
import { readStoredTokens } from "@/lib/parser/storage";

const PREVIEW_SAMPLE = "the fox jumped over the lazy dog";

const HEADINGS_DESCRIPTION =
  "There are 6 heading options in your application. Headings can be used in elements like headlines, navigation, and section headings.";

type ScaleRow = {
  label: string;
  size: string;
  weight?: number;
  lineHeight: string;
  letterSpacing?: string;
};

function formatLetterSpacingSpec(raw: string | undefined): string {
  if (raw === undefined || raw === null) return "0px";
  const t = String(raw).trim();
  if (t === "" || t === "0" || t === "0em" || t === "0px") return "0px";
  return t;
}

function headingTitle(label: string): string {
  const m = /^H([1-6])$/i.exec(label.trim());
  if (m) return `Heading ${m[1]}`;
  return label;
}

function isHeadingLabel(label: string): boolean {
  return /^H[1-6]$/i.test(label.trim());
}

function formatSpecValue(value: string | undefined, fallback = "—"): string {
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  return String(value).trim();
}

function previewStyleFromRepoRow(row: TypographyStyleRow): CSSProperties {
  const weightRaw = row.fontWeight?.trim();
  let fontWeight: CSSProperties["fontWeight"] = 600;
  if (weightRaw) {
    const n = Number(weightRaw);
    fontWeight = Number.isFinite(n) && !Number.isNaN(n) ? n : weightRaw;
  }

  return {
    fontFamily: row.fontFamilyCss,
    fontSize: row.fontSize ?? "16px",
    fontWeight,
    lineHeight: row.lineHeight ?? "normal",
    letterSpacing: row.letterSpacing ?? "normal",
    color: "var(--color-content-primary)",
  };
}

export function BrandTypographyPage() {
  const [tokens, setTokens] = useState<ParseResult | null>(null);
  const [fonts, setFonts] = useState<{ name: string; openSource: boolean; source: string }[]>([]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      setTokens(readStoredTokens());
      try {
        const storedFonts = localStorage.getItem("autodsm:fonts");
        if (storedFonts) setFonts(JSON.parse(storedFonts));
      } catch {
        // ignore
      }
    };
    load();
    window.addEventListener("autodsm:updated", load);
    return () => window.removeEventListener("autodsm:updated", load);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const googleFonts = fonts
      .filter((font) => font.openSource)
      .map((font) => font.name)
      .filter(Boolean);
    if (googleFonts.length === 0) return;
    const families = googleFonts
      .map(
        (name) =>
          `family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@300;400;500;600;700`,
      )
      .join("&");
    const href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    const existing = document.getElementById("autodsm-google-fonts") as HTMLLinkElement | null;
    if (existing) {
      if (existing.href !== href) existing.href = href;
      return;
    }
    const link = document.createElement("link");
    link.id = "autodsm-google-fonts";
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }, [fonts]);

  const typography = useMemo(() => tokens?.typography ?? [], [tokens]);
  const repoRows = useMemo(() => {
    const raw = tokens?.typographyRows ?? [];
    return [...raw].sort(
      (a, b) =>
        a.sourcePath.localeCompare(b.sourcePath) || a.displayName.localeCompare(b.displayName),
    );
  }, [tokens?.typographyRows]);
  const hasRepoRows = repoRows.length > 0;

  const primaryFont = fonts[0]?.name ?? "Geist";
  const fontStack = useMemo(() => {
    if (!primaryFont) return "var(--font-geist-sans), system-ui, sans-serif";
    return `"${primaryFont}", var(--font-geist-sans), system-ui, sans-serif`;
  }, [primaryFont]);

  const fallbackScale: ScaleRow[] = [
    { label: "H1", size: "48px", weight: 700, lineHeight: "56px", letterSpacing: "-0.02em" },
    { label: "H2", size: "40px", weight: 700, lineHeight: "48px", letterSpacing: "-0.02em" },
    { label: "H3", size: "32px", weight: 700, lineHeight: "40px", letterSpacing: "-0.01em" },
    { label: "H4", size: "24px", weight: 600, lineHeight: "32px", letterSpacing: "-0.01em" },
    { label: "H5", size: "20px", weight: 600, lineHeight: "28px", letterSpacing: "-0.005em" },
    { label: "H6", size: "16px", weight: 600, lineHeight: "24px", letterSpacing: "0em" },
    { label: "Body", size: "16px", weight: 400, lineHeight: "24px", letterSpacing: "0em" },
    { label: "Small", size: "14px", weight: 400, lineHeight: "20px", letterSpacing: "0em" },
    { label: "Caption", size: "12px", weight: 400, lineHeight: "16px", letterSpacing: "0.01em" },
  ];

  const extractedScale = useMemo((): ScaleRow[] => {
    const sizeTokens = typography.filter((token) =>
      /(\d+(?:\.\d+)?)(px|rem|em|%)$/.test(token.value),
    );
    return sizeTokens.map((token) => ({
      label: token.name,
      size: token.value,
      lineHeight: token.lineHeight ?? "normal",
      weight: undefined,
      letterSpacing: undefined,
    }));
  }, [typography]);

  const scale = extractedScale.length > 0 ? extractedScale : fallbackScale;
  const useFallbackLayout = !hasRepoRows && extractedScale.length === 0;
  const mainRows = useFallbackLayout ? scale.filter((row) => isHeadingLabel(row.label)) : scale;
  const supplementaryRows = useFallbackLayout
    ? scale.filter((row) => !isHeadingLabel(row.label))
    : [];

  const hasContent =
    typography.length > 0 ||
    fonts.length > 0 ||
    hasRepoRows ||
    (!hasRepoRows && extractedScale.length > 0);

  const previewStyle = (style: ScaleRow): CSSProperties => ({
    fontFamily: fontStack,
    fontSize: style.size,
    fontWeight: style.weight ?? 600,
    lineHeight: style.lineHeight ?? "normal",
    letterSpacing: style.letterSpacing ?? "normal",
    color: "var(--color-content-primary)",
  });

  return (
    <div className="box-border -mx-5 -mt-8 flex min-h-0 w-[calc(100%_+_2.5rem)] min-w-0 max-w-none flex-1 flex-col self-stretch sm:-mx-8 sm:-mt-10 sm:w-[calc(100%_+_4rem)]">
      <header className="box-border h-fit w-full min-w-0 shrink-0 self-stretch border-b border-border px-4 pb-4 pt-4">
        <h6 className="text-base font-semibold leading-6 tracking-normal text-foreground">
          Typography
        </h6>
      </header>

      <div className="mx-auto w-full max-w-[700px] flex-1 space-y-8 px-5 pb-8 pt-6 sm:px-8 sm:pb-10 sm:pt-8">
        {loading ? (
          <div className="py-12 text-center">
            <p className="text-sm text-foreground-secondary">Parsing typography...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-foreground-secondary">{error}</p>
          </div>
        ) : !hasContent ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-foreground">No typography data yet</p>
            <p className="mt-2 text-sm text-foreground-secondary">
              Connect a repository to extract your typography tokens.
            </p>
          </div>
        ) : !hasContent ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-foreground">No typography tokens found</p>
            <p className="mt-2 text-sm text-foreground-secondary">
              No font-size or font-family tokens were detected.
            </p>
          </div>
        ) : (
          <>
            {hasRepoRows ? (
              <section className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Type scale
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
                    Styles merged from CSS rules, theme files, and Tailwind config in your connected
                    repository. Each row shows extracted font metrics and a live preview.
                  </p>
                </div>

                <div className="divide-y divide-border">
                  {repoRows.map((row) => (
                    <div
                      key={row.id}
                      className="grid gap-8 py-8 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-start sm:gap-12 lg:grid-cols-[minmax(0,16rem)_1fr]"
                    >
                      <div className="space-y-4">
                        <p className="text-sm font-semibold text-foreground">{row.displayName}</p>
                        <p className="text-[11px] text-foreground-tertiary">{row.sourcePath}</p>
                        <dl className="space-y-2 text-sm text-foreground-secondary">
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                            <dt className="text-foreground-tertiary">Font family</dt>
                            <dd className="font-medium text-foreground-secondary">{row.fontFamily}</dd>
                          </div>
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                            <dt className="text-foreground-tertiary">Size</dt>
                            <dd className="font-mono text-xs text-foreground-secondary">
                              {formatSpecValue(row.fontSize)}
                            </dd>
                          </div>
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                            <dt className="text-foreground-tertiary">Line height</dt>
                            <dd className="font-mono text-xs text-foreground-secondary">
                              {row.lineHeight === undefined || row.lineHeight === ""
                                ? "—"
                                : row.lineHeight === "normal"
                                  ? "normal"
                                  : row.lineHeight}
                            </dd>
                          </div>
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                            <dt className="text-foreground-tertiary">Letter spacing</dt>
                            <dd className="font-mono text-xs text-foreground-secondary">
                              {formatLetterSpacingSpec(row.letterSpacing)}
                            </dd>
                          </div>
                          {row.fontWeight ? (
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                              <dt className="text-foreground-tertiary">Font weight</dt>
                              <dd className="font-mono text-xs text-foreground-secondary">
                                {row.fontWeight}
                              </dd>
                            </div>
                          ) : null}
                        </dl>
                      </div>
                      <p
                        className="min-w-0 break-words text-foreground"
                        style={previewStyleFromRepoRow(row)}
                      >
                        {PREVIEW_SAMPLE}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <>
                <section className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      {useFallbackLayout ? "Headings" : "Type scale"}
                    </h2>
                    {useFallbackLayout ? (
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
                        {HEADINGS_DESCRIPTION}
                      </p>
                    ) : (
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
                        Sizes and line heights detected from your repository, shown with a live
                        preview.
                      </p>
                    )}
                  </div>

                  <div className="divide-y divide-border">
                    {mainRows.map((style) => (
                      <div
                        key={style.label}
                        className="grid gap-8 py-8 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-start sm:gap-12 lg:grid-cols-[minmax(0,16rem)_1fr]"
                      >
                        <div className="space-y-4">
                          <p className="text-sm font-semibold text-foreground">
                            {headingTitle(style.label)}
                          </p>
                          <dl className="space-y-2 text-sm text-foreground-secondary">
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                              <dt className="text-foreground-tertiary">Font family</dt>
                              <dd className="font-medium text-foreground-secondary">{primaryFont}</dd>
                            </div>
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                              <dt className="text-foreground-tertiary">Size</dt>
                              <dd className="font-mono text-xs text-foreground-secondary">
                                {style.size}
                              </dd>
                            </div>
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                              <dt className="text-foreground-tertiary">Line height</dt>
                              <dd className="font-mono text-xs text-foreground-secondary">
                                {style.lineHeight === "normal" ? "normal" : style.lineHeight}
                              </dd>
                            </div>
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                              <dt className="text-foreground-tertiary">Letter spacing</dt>
                              <dd className="font-mono text-xs text-foreground-secondary">
                                {formatLetterSpacingSpec(style.letterSpacing)}
                              </dd>
                            </div>
                          </dl>
                        </div>
                        <p
                          className="min-w-0 break-words text-foreground"
                          style={previewStyle(style)}
                        >
                          {PREVIEW_SAMPLE}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {supplementaryRows.length > 0 ? (
                  <section className="space-y-6 border-t border-border pt-10">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                        Body & UI text
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm text-foreground-secondary">
                        Supporting styles for paragraphs, captions, and dense UI.
                      </p>
                    </div>
                    <div className="divide-y divide-border">
                      {supplementaryRows.map((style) => (
                        <div
                          key={style.label}
                          className="grid gap-8 py-8 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-start sm:gap-12 lg:grid-cols-[minmax(0,16rem)_1fr]"
                        >
                          <div className="space-y-4">
                            <p className="text-sm font-semibold text-foreground">{style.label}</p>
                            <dl className="space-y-2 text-sm text-foreground-secondary">
                              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                                <dt className="text-foreground-tertiary">Font family</dt>
                                <dd className="font-medium text-foreground-secondary">{primaryFont}</dd>
                              </div>
                              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                                <dt className="text-foreground-tertiary">Size</dt>
                                <dd className="font-mono text-xs text-foreground-secondary">
                                  {style.size}
                                </dd>
                              </div>
                              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                                <dt className="text-foreground-tertiary">Line height</dt>
                                <dd className="font-mono text-xs text-foreground-secondary">
                                  {style.lineHeight === "normal" ? "normal" : style.lineHeight}
                                </dd>
                              </div>
                              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                                <dt className="text-foreground-tertiary">Letter spacing</dt>
                                <dd className="font-mono text-xs text-foreground-secondary">
                                  {formatLetterSpacingSpec(style.letterSpacing)}
                                </dd>
                              </div>
                            </dl>
                          </div>
                          <p
                            className="min-w-0 break-words text-foreground"
                            style={previewStyle(style)}
                          >
                            {PREVIEW_SAMPLE}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
              </>
            )}

            {typography.length > 0 ? (
              <details className="group border-t border-border pt-10">
                <summary className="cursor-pointer list-none text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                  <span className="underline-offset-4 group-open:underline">
                    Raw detected tokens ({typography.length})
                  </span>
                </summary>
                <div className="mt-6 space-y-4">
                  {typography.map((row, index) => {
                    const isSize = /(\d+(?:\.\d+)?)(px|rem|em|%)$/.test(row.value);
                    const fontFamilyValue = row.value.includes("var(")
                      ? fontStack
                      : row.value.includes(",")
                        ? row.value
                        : `"${row.value}", ${fontStack}`;
                    const sampleStyle: CSSProperties = isSize
                      ? { fontFamily: fontStack, fontSize: row.value, lineHeight: row.lineHeight ?? "1.4" }
                      : { fontFamily: fontFamilyValue, fontSize: "18px", lineHeight: "1.4" };
                    return (
                      <div
                        key={`${row.name}-${row.value}-${row.lineHeight ?? "auto"}-${index}`}
                        className="rounded-lg border border-border bg-background-elevated/50 px-4 py-4"
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-foreground-tertiary">
                          {row.name}
                        </p>
                        <p className="mt-3 w-full text-foreground" style={sampleStyle}>
                          Almost before we knew it, we had left the ground.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px] text-foreground-tertiary">
                          <span>Value {row.value}</span>
                          {row.lineHeight ? <span>· Line {row.lineHeight}</span> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

