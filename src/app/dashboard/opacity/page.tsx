"use client";

import * as React from "react";
import { useBrandStore } from "@/stores/brand";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, SectionHeading } from "@/components/dashboard/page-header";
import { TokenCard } from "@/components/dashboard/token-card";

const CHECKERBOARD = `repeating-conic-gradient(
  var(--border-subtle) 0% 25%,
  transparent 0% 50%
) 50% / 12px 12px`;

export default function OpacityPage() {
  const profile = useBrandStore((s) => s.profile);

  if (!profile || profile.opacity.length === 0) {
    return (
      <div className="px-10 py-10 max-w-[1200px]">
        <PageHeader
          title="Opacity"
          description="Opacity scale values from your theme."
        />
        <div className="mt-10">
          <EmptyState
            title="No opacity tokens detected"
            description="We didn't find any opacity values in this repo."
          />
        </div>
      </div>
    );
  }

  const sorted = [...profile.opacity].sort((a, b) => a.value - b.value);
  const source = profile.meta.tailwindConfigPath || profile.meta.cssSource || "repo";

  return (
    <div className="px-10 py-10 max-w-[1200px]">
      <PageHeader
        title="Opacity"
        description="Opacity scale used across your UI. Previews render on a checkerboard to reveal transparency at a glance."
        source={source}
        count={sorted.length}
      />

      <div className="mt-12">
        <SectionHeading count={sorted.length}>Opacity Tokens</SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sorted.map((op) => {
            const className = `opacity-${op.name}`;
            return (
              <TokenCard
                key={op.name}
                previewHeight={120}
                previewBackground={CHECKERBOARD}
                previewPadding="p-0"
                preview={
                  <div
                    className="absolute inset-0 bg-[var(--accent)]"
                    style={{ opacity: op.value }}
                  />
                }
                title={op.name}
                subtitle={
                  <>
                    {op.percentage} · {op.isCustom ? "custom · " : ""}
                    {op.source}
                  </>
                }
                specs={[
                  { label: "VALUE", value: op.value },
                  { label: "PERCENT", value: op.percentage },
                ]}
                copyables={[
                  { eyebrow: "VALUE", label: "value", value: String(op.value) },
                  { eyebrow: "CLASS", label: "tailwind class", value: className },
                ]}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
