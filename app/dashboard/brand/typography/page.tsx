"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import type { ParseResult } from "@/lib/parser";
import { readStoredTokens } from "@/lib/parser/storage";
import { extractTypographyFromRepo } from "@/lib/github/fetcher";

export default function TypographyPage() {
  const [tokens, setTokens] = useState<ParseResult | null>(null);
  const [fonts, setFonts] = useState<{ name: string; openSource: boolean; source: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const state = searchParams.get("state");
  const repo = searchParams.get("repo");
  const [repoToParse, setRepoToParse] = useState<string | null>(null);

  useEffect(() => {
    setTokens(readStoredTokens());
    if (typeof window !== "undefined") {
      const storedFonts = localStorage.getItem("autodsm:fonts");
      if (storedFonts) {
        try {
          setFonts(JSON.parse(storedFonts));
        } catch {
          // ignore parse errors
        }
      }
      const storedRepo = localStorage.getItem("autodsm:lastRepo");
      if (storedRepo) setRepoToParse(storedRepo);
    }
  }, []);

  useEffect(() => {
    const targetRepo = repo ?? repoToParse;
    const shouldParse =
      Boolean(targetRepo) &&
      (state === "parsing" || (tokens?.typography ?? []).length === 0);
    if (!shouldParse || !targetRepo) return;
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const results = await extractTypographyFromRepo(targetRepo);
        if (!mounted) return;
        const merged = dedupeTypography(results.flatMap((entry) => entry.typography));
        const mergedFonts = dedupeFonts(results.flatMap((entry) => entry.fonts));
        const payload: ParseResult = { colors: tokens?.colors ?? [], typography: merged };
        setTokens(payload);
        setFonts(mergedFonts);
        localStorage.setItem("autodsm:tokens", JSON.stringify(payload));
        localStorage.setItem("autodsm:fonts", JSON.stringify(mergedFonts));
        localStorage.setItem("autodsm:lastRepo", targetRepo);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to parse typography");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [repo, repoToParse, state, tokens?.colors, tokens?.typography]);

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

  const typography = tokens?.typography ?? [];
  const primaryFont = fonts[0]?.name ?? "Geist";
  const fontStack = useMemo(() => {
    if (!primaryFont) return "var(--font-geist-sans), system-ui, sans-serif";
    return `"${primaryFont}", var(--font-geist-sans), system-ui, sans-serif`;
  }, [primaryFont]);
  const fallbackScale = [
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
  const extractedScale = useMemo(() => {
    const sizeTokens = typography.filter((token) =>
      /(\d+(?:\.\d+)?)(px|rem|em|%)$/.test(token.value),
    );
    return sizeTokens.map((token) => ({
      label: token.name,
      size: token.value,
      lineHeight: token.lineHeight,
      weight: undefined as number | undefined,
      letterSpacing: undefined as string | undefined,
    }));
  }, [typography]);
  const scale = extractedScale.length > 0 ? extractedScale : fallbackScale;
  const weightLabel = (weight: number) => {
    if (weight >= 700) return "Bold";
    if (weight >= 600) return "Semibold";
    if (weight >= 500) return "Medium";
    return "Regular";
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-foreground-tertiary">Brand guidelines</p>
        <h1 className="text-3xl font-semibold">Typography</h1>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-border bg-background-elevated px-6 py-10 text-center">
          <p className="text-sm text-foreground-secondary">Parsing typography...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-border bg-background-elevated px-6 py-10 text-center">
          <p className="text-sm text-foreground-secondary">{error}</p>
        </div>
      ) : typography.length === 0 && fonts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-background-elevated px-6 py-10 text-center">
          <p className="text-sm font-medium">No typography tokens found</p>
          <p className="mt-2 text-xs text-foreground-tertiary">
            No font-size or font-family tokens were detected.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-background-elevated px-6 py-5">
            <p className="text-xs text-foreground-tertiary">Primary font</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-border px-3 py-1 text-xs text-foreground-secondary">
                {primaryFont}
              </div>
              {fonts.map((font) => (
                <div
                  key={font.name}
                  className="rounded-full border border-border px-3 py-1 text-xs text-foreground-secondary"
                  title={font.source}
                >
                  {font.name}
                  {font.openSource ? " • Open Source" : ""}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {scale.map((style) => (
              <div
                key={style.label}
                className="rounded-2xl border border-border bg-background-elevated px-6 py-6"
              >
                <div
                  className="w-full text-foreground"
                  style={{
                    fontFamily: fontStack,
                    fontSize: style.size,
                    fontWeight: style.weight ?? 400,
                    lineHeight: style.lineHeight ?? "normal",
                    letterSpacing: style.letterSpacing ?? "normal",
                  }}
                >
                  {style.label}: {primaryFont}{" "}
                  {style.weight ? weightLabel(style.weight) : "Regular"} {style.size}
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase text-foreground-tertiary">
                  <span className="rounded-full border border-border px-2 py-1 font-mono">
                    Size {style.size}
                  </span>
                  {style.lineHeight ? (
                    <span className="rounded-full border border-border px-2 py-1 font-mono">
                      Line {style.lineHeight}
                    </span>
                  ) : null}
                  {style.weight ? (
                    <span className="rounded-full border border-border px-2 py-1 font-mono">
                      Weight {style.weight}
                    </span>
                  ) : null}
                  {style.letterSpacing ? (
                    <span className="rounded-full border border-border px-2 py-1 font-mono">
                      Tracking {style.letterSpacing}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {typography.length > 0 ? (
            <div className="rounded-2xl border border-border bg-background-elevated px-6 py-6">
              <p className="text-xs text-foreground-tertiary">Detected tokens</p>
              <div className="mt-5 space-y-3">
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
                      className="rounded-xl border border-border/60 bg-background px-4 py-4"
                    >
                      <p className="text-xs uppercase text-foreground-tertiary">{row.name}</p>
                      <p className="mt-3 w-full text-foreground" style={sampleStyle}>
                        Almost before we knew it, we had left the ground.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase text-foreground-tertiary">
                        <span className="rounded-full border border-border px-2 py-1 font-mono">
                          Value {row.value}
                        </span>
                        {row.lineHeight ? (
                          <span className="rounded-full border border-border px-2 py-1 font-mono">
                            Line {row.lineHeight}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function dedupeFonts(
  fonts: { name: string; openSource: boolean; source: string }[],
) {
  const seen = new Map<string, { name: string; openSource: boolean; source: string }>();
  for (const font of fonts) {
    const key = font.name.toLowerCase();
    if (!seen.has(key)) seen.set(key, font);
  }
  return Array.from(seen.values());
}

function dedupeTypography(tokens: { name: string; value: string; lineHeight?: string }[]) {
  const seen = new Map<string, { name: string; value: string; lineHeight?: string }>();
  for (const token of tokens) {
    const key = `${token.name}:${token.value}`.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, token);
      continue;
    }
    const existing = seen.get(key);
    if (existing && !existing.lineHeight && token.lineHeight) {
      existing.lineHeight = token.lineHeight;
    }
  }
  return Array.from(seen.values());
}
