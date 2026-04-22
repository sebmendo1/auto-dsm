"use client";

import * as React from "react";
import { useBrandStore } from "@/stores/brand";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, SectionHeading } from "@/components/dashboard/page-header";
import { TokenRow } from "@/components/dashboard/token-row";

export default function BordersPage() {
  const profile = useBrandStore((s) => s.profile);

  if (!profile || profile.borders.length === 0) {
    return (
      <div className="px-10 py-10 max-w-[1200px]">
        <PageHeader
          title="Borders"
          description="Border widths, styles, and colors used in your UI."
        />
        <div className="mt-10">
          <EmptyState
            title="No borders detected"
            description="We didn't find any border tokens in this repo's source files."
          />
        </div>
      </div>
    );
  }

  const source =
    profile.meta.cssSource ||
    profile.meta.tailwindConfigPath ||
    "repo";

  return (
    <div className="px-10 py-10 max-w-[1200px]">
      <PageHeader
        title="Borders"
        description="Border widths, styles, and colors used in your UI. Each token resolves to a CSS shorthand you can drop straight into your stylesheet."
        source={source}
        count={profile.borders.length}
      />

      <div className="mt-12">
        <SectionHeading count={profile.borders.length}>
          Border Tokens
        </SectionHeading>

        {profile.borders.map((border, i) => {
          const shorthand = `${border.width} ${border.style} ${border.color}`;
          return (
            <TokenRow
              key={`${border.name}-${i}`}
              previewWidth={88}
              preview={
                <div
                  className="w-[72px] h-[56px] rounded-lg bg-[var(--bg-secondary)] transition-colors"
                  style={{
                    border: `${border.width} ${border.style} ${border.color}`,
                  }}
                />
              }
              name={border.name}
              meta={
                <span className="inline-flex items-center gap-2">
                  <span>{border.width} · {border.style}</span>
                  <span className="inline-flex items-center gap-1">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-sm border border-[var(--border-default)]"
                      style={{ backgroundColor: border.color }}
                    />
                    <span>{border.color}</span>
                  </span>
                </span>
              }
              submeta={
                border.colorToken
                  ? `${border.colorToken} · ${border.source}`
                  : border.source
              }
              copyables={[
                { eyebrow: "CSS", label: "shorthand", value: shorthand },
                { eyebrow: "WIDTH", label: "width", value: border.width },
                { eyebrow: "STYLE", label: "style", value: border.style },
                { eyebrow: "COLOR", label: "color", value: border.color },
                ...(border.colorToken
                  ? [
                      {
                        eyebrow: "TOKEN",
                        label: "color token",
                        value: border.colorToken,
                      },
                    ]
                  : []),
              ]}
            />
          );
        })}
      </div>
    </div>
  );
}
