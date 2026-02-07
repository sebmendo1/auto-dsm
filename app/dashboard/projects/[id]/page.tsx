"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { ParsingProgress } from "@/components/parsing/parsing-progress";
import { TokenSection } from "@/components/tokens/token-section";
import { ColorPalette } from "@/components/tokens/color-palette";
import { TypographyScale } from "@/components/tokens/typography-scale";
import { SpacingScale } from "@/components/tokens/spacing-scale";
import { Toast } from "@/components/ui/toast";

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

export default function ProjectDetailPage() {
  const [toast, setToast] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const state = searchParams.get("state") ?? "ready";

  const showToast = (message: string) => setToast(message);
  const handleCopy = async (value: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    }
    showToast(`Copied ${value}`);
  };

  return (
    <div className="space-y-8">
      <Header
        title="memento-app"
        subtitle="github.com/sebastian/memento-app · Last synced 2 minutes ago"
        actionLabel="Sync"
      />

      {state === "parsing" ? (
        <ParsingProgress repoFullName="sebastian/memento-app" currentStep={2} />
      ) : state === "parsing-error" ? (
        <div className="space-y-6">
          <ParsingProgress
            repoFullName="sebastian/memento-app"
            currentStep={2}
            errorStep={2}
          />
          <section className="rounded-2xl border border-border bg-background-elevated p-8 text-center">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="mt-2 text-sm text-foreground-secondary">
              We couldn&apos;t analyze this repo. This might be a temporary issue.
            </p>
            <div className="mt-6 flex justify-center">
              <button className="btn-primary">Try Again</button>
            </div>
          </section>
        </div>
      ) : state === "tokens-empty" ? (
        <div className="space-y-6">
          <ParsingProgress
            repoFullName="sebastian/memento-app"
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
              <button className="btn-secondary">Learn More</button>
              <button className="btn-primary">Re-sync Repository</button>
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
            <button className="btn-secondary">Learn More</button>
            <button className="btn-primary">Re-sync</button>
          </div>
        </section>
      ) : state === "error" ? (
        <section className="rounded-2xl border border-border bg-background-elevated p-10 text-center">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="mt-2 text-sm text-foreground-secondary">
            We couldn&apos;t analyze this repo. This might be a temporary issue.
          </p>
          <div className="mt-6 flex justify-center">
            <button className="btn-primary">Try Again</button>
          </div>
        </section>
      ) : (
        <div className="space-y-6">
          <TokenSection title="Colors" count={24}>
            {colorGroups.map((group) => (
              <ColorPalette
                key={group.title}
                title={group.title}
                tokens={group.tokens}
                onCopy={handleCopy}
              />
            ))}
          </TokenSection>

          <TokenSection title="Typography" count={8}>
            <TypographyScale tokens={typographyTokens} onCopy={handleCopy} />
          </TokenSection>

          <TokenSection title="Spacing" count={12}>
            <SpacingScale tokens={spacingTokens} onCopy={handleCopy} />
          </TokenSection>
        </div>
      )}

      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </div>
  );
}
