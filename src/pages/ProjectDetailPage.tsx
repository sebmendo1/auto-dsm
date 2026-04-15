import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { ParsingProgress } from "@/components/parsing/parsing-progress";
import { TokenSection } from "@/components/tokens/token-section";
import { ColorPalette } from "@/components/tokens/color-palette";
import { TypographyScale } from "@/components/tokens/typography-scale";
import { SpacingScale } from "@/components/tokens/spacing-scale";
import { Toast } from "@/components/ui/toast";
import type { ParseResult } from "@/lib/parser";
import { parseGithubThemeFiles } from "@/lib/parser/github";
import { notifyAppDataUpdated } from "@/lib/app-events";
import { readStoredTokens } from "@/lib/parser/storage";

const colorGroups = [
  {
    title: "Primary",
    tokens: [
      { name: "primary-500", value: "#0b3bdb" },
      { name: "primary-400", value: "#0b34c4" },
      { name: "primary-300", value: "#0b2cab" },
      { name: "primary-200", value: "#0b2493" },
    ],
  },
  {
    title: "Neutral",
    tokens: [
      { name: "neutral-900", value: "#111111" },
      { name: "neutral-700", value: "#3f3f3f" },
      { name: "neutral-500", value: "#737373" },
      { name: "neutral-300", value: "#a3a3a3" },
    ],
  },
];

const typographyTokens = [
  { name: "text-xs", value: "12px", size: "12px" },
  { name: "text-sm", value: "14px", size: "14px" },
  { name: "text-base", value: "16px", size: "16px" },
  { name: "text-lg", value: "18px", size: "18px" },
  { name: "text-xl", value: "20px", size: "20px" },
];

const spacingTokens = [
  { name: "spacing-1", value: "4px" },
  { name: "spacing-2", value: "8px" },
  { name: "spacing-4", value: "16px" },
  { name: "spacing-6", value: "24px" },
  { name: "spacing-8", value: "32px" },
];

export function ProjectDetailPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [searchParams] = useSearchParams();
  const state = searchParams.get("state") ?? "ready";
  const repoFullName = searchParams.get("repo") ?? "sebastian/memento-app";

  const showToast = (message: string) => setToast(message);
  const handleCopy = async (value: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    }
    showToast(`Copied ${value}`);
  };

  useEffect(() => {
    if (state !== "parsing") return;
    let mounted = true;
    const run = async () => {
      try {
        setParseError(null);
        setStep(0);
        await new Promise((resolve) => setTimeout(resolve, 150));
        if (!mounted) return;
        setStep(1);
        const result = await parseGithubThemeFiles(repoFullName);
        if (!mounted) return;
        setStep(3);
        setParsed(result);
        localStorage.setItem("autodsm:tokens", JSON.stringify(result));
        notifyAppDataUpdated();
        setStep(4);
        const hasTokens =
          result.colors.length > 0 ||
          result.typography.length > 0 ||
          (result.typographyRows?.length ?? 0) > 0;
        navigate(
          `/dashboard/projects/${repoFullName.replace(/\W+/g, "-")}?repo=${encodeURIComponent(
            repoFullName,
          )}${hasTokens ? "" : "&state=tokens-empty"}`,
          { replace: true },
        );
      } catch (error) {
        if (!mounted) return;
        setParseError(error instanceof Error ? error.message : "Failed to parse repo");
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [repoFullName, state, navigate]);

  useEffect(() => {
    if (state === "parsing") return;
    if (parsed) return;
    const stored = readStoredTokens();
    if (stored) setParsed(stored);
  }, [parsed, state]);

  const fallbackColors = colorGroups.flatMap((group) =>
    group.tokens.map((token) => ({
      ...token,
      category: group.title.toLowerCase(),
    })),
  );
  const colors = (parsed?.colors ?? fallbackColors).map((color) => ({
    ...color,
    category: color.category ?? null,
  }));
  const typography = parsed?.typography ?? typographyTokens;

  const groupedColors = colors.reduce<Record<string, typeof colors>>((acc, color) => {
    const category = color.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(color);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <Header
        title={repoFullName.split("/")[1] ?? "memento-app"}
        subtitle={`github.com/${repoFullName} · Last synced 2 minutes ago`}
        actionLabel="Sync"
      />

      {state === "parsing" ? (
        parseError ? (
          <div className="space-y-6">
            <ParsingProgress repoFullName={repoFullName} currentStep={step} errorStep={step} />
            <section className="rounded-2xl border border-border bg-background-elevated p-8 text-center">
              <h2 className="text-lg font-semibold">Something went wrong</h2>
              <p className="mt-2 text-sm text-foreground-secondary">
                {parseError}
              </p>
              <div className="mt-6 flex justify-center">
                <button type="button" className="btn-primary">
                  Try Again
                </button>
              </div>
            </section>
          </div>
        ) : (
          <ParsingProgress repoFullName={repoFullName} currentStep={step} />
        )
      ) : state === "parsing-error" ? (
        <div className="space-y-6">
          <ParsingProgress
            repoFullName={repoFullName}
            currentStep={2}
            errorStep={2}
          />
          <section className="rounded-2xl border border-border bg-background-elevated p-8 text-center">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="mt-2 text-sm text-foreground-secondary">
              We couldn&apos;t analyze this repo. This might be a temporary issue.
            </p>
            <div className="mt-6 flex justify-center">
              <button type="button" className="btn-primary">
                Try Again
              </button>
            </div>
          </section>
        </div>
      ) : state === "tokens-empty" ? (
        <div className="space-y-6">
          <ParsingProgress
            repoFullName={repoFullName}
            currentStep={3}
            errorStep={3}
          />
          <section className="rounded-2xl border border-border bg-background-elevated p-8 text-center">
            <h2 className="text-lg font-semibold">No design tokens found</h2>
            <p className="mt-2 text-sm text-foreground-secondary">
              We couldn&apos;t find any tokens in this repository. Make sure you have
              globals.css with CSS variables or a Tailwind config file.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" className="btn-secondary">
                Learn More
              </button>
              <button type="button" className="btn-primary">
                Re-sync Repository
              </button>
            </div>
          </section>
        </div>
      ) : state === "empty" ? (
        <section className="rounded-2xl border border-border bg-background-elevated p-10 text-center">
          <h2 className="text-lg font-semibold">No design tokens found</h2>
          <p className="mt-2 text-sm text-foreground-secondary">
            We couldn&apos;t find any tokens. Ensure you have globals.css with CSS
            variables or a Tailwind config file.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button type="button" className="btn-secondary">
              Learn More
            </button>
            <button type="button" className="btn-primary">
              Re-sync
            </button>
          </div>
        </section>
      ) : state === "error" ? (
        <section className="rounded-2xl border border-border bg-background-elevated p-10 text-center">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="mt-2 text-sm text-foreground-secondary">
            We couldn&apos;t analyze this repo. This might be a temporary issue.
          </p>
          <div className="mt-6 flex justify-center">
            <button type="button" className="btn-primary">
              Try Again
            </button>
          </div>
        </section>
      ) : (
        <div className="space-y-6">
          <TokenSection title="Colors" count={colors.length}>
            {Object.entries(groupedColors).map(([title, tokens]) => (
              <ColorPalette key={title} title={title} tokens={tokens} onCopy={handleCopy} />
            ))}
          </TokenSection>

          <TokenSection title="Typography" count={typography.length}>
            <TypographyScale
              tokens={typography.map((token) => {
                const sizeMatch = token.value.match(/\d+(?:\.\d+)?(px|rem|em)/);
                const isSize = Boolean(sizeMatch);
                return {
                  name: token.name,
                  value: token.value,
                  size: isSize ? token.value : "16px",
                  fontFamily: isSize ? undefined : token.value,
                };
              })}
              onCopy={handleCopy}
            />
          </TokenSection>

          <TokenSection title="Spacing" count={spacingTokens.length}>
            <SpacingScale tokens={spacingTokens} onCopy={handleCopy} />
          </TokenSection>
        </div>
      )}

      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </div>
  );
}
