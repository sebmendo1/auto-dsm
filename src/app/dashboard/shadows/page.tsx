"use client";

import * as React from "react";
import { useBrandStore } from "@/stores/brand";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, SectionHeading, Eyebrow } from "@/components/dashboard/page-header";
import { TokenCard } from "@/components/dashboard/token-card";

export default function ShadowsPage() {
  const profile = useBrandStore((s) => s.profile);
  const [surface, setSurface] = React.useState<"light" | "dark">("light");

  if (!profile || profile.shadows.length === 0) {
    return (
      <div className="px-10 py-10 max-w-[1200px]">
        <PageHeader
          title="Shadows"
          description="Elevation tokens for cards, modals, and focus rings."
        />
        <div className="mt-10">
          <EmptyState
            title="No shadows detected"
            description="We didn't find any shadow tokens in this repo's source files."
          />
        </div>
      </div>
    );
  }

  const source =
    profile.meta.cssSource ||
    profile.meta.tailwindConfigPath ||
    "repo";

  const previewSurface = surface === "light" ? "#F9F9FA" : "#0A0A0B";
  const previewInner = surface === "light" ? "#FFFFFF" : "#141416";

  return (
    <div className="px-10 py-10 max-w-[1200px]">
      <PageHeader
        title="Shadows"
        description="Elevation tokens for cards, modals, and focus rings. Toggle the preview surface to see how each shadow reads on light and dark backgrounds."
        source={source}
        count={profile.shadows.length}
        actions={
          <div className="flex items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-secondary)] p-0.5 gap-0.5">
            {(["light", "dark"] as const).map((mode) => {
              const active = mode === surface;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSurface(mode)}
                  className={
                    "px-3 py-1 rounded-full text-[12px] font-medium transition-all duration-150 [transition-timing-function:var(--ease-standard)] " +
                    (active
                      ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]")
                  }
                  style={{ fontFamily: "var(--font-geist-sans)" }}
                >
                  {mode === "light" ? "Light surface" : "Dark surface"}
                </button>
              );
            })}
          </div>
        }
      />

      <div className="mt-12">
        <SectionHeading count={profile.shadows.length}>
          Elevation Tokens
        </SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {profile.shadows.map((shadow) => (
            <TokenCard
              key={shadow.name}
              previewHeight={160}
              previewBackground={previewSurface}
              previewPadding="p-0"
              preview={
                <div className="flex items-center justify-center w-full h-full">
                  <div
                    className="w-[72px] h-[72px] rounded-xl"
                    style={{
                      backgroundColor: previewInner,
                      boxShadow: shadow.value,
                    }}
                  />
                </div>
              }
              title={shadow.name}
              subtitle={
                <>
                  {shadow.tailwindClass}
                  {shadow.isCustom ? " · custom" : ""}
                  {shadow.source ? ` · ${shadow.source}` : ""}
                </>
              }
              specs={[
                { label: "LAYERS", value: String(shadow.layers.length) },
                {
                  label: "INSET",
                  value: shadow.layers.some((l) => l.inset) ? "yes" : "no",
                },
              ]}
              copyables={[
                { eyebrow: "CSS", label: "css value", value: shadow.value },
                {
                  eyebrow: "CLASS",
                  label: "tailwind class",
                  value: shadow.tailwindClass,
                },
              ]}
            >
              {shadow.layers.length > 0 ? (
                <details className="mt-4 group/details">
                  <summary
                    className="cursor-pointer list-none text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] select-none inline-flex items-center gap-1.5"
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 11,
                    }}
                  >
                    <span className="transition-transform duration-150 group-open/details:rotate-90">
                      ›
                    </span>
                    {shadow.layers.length} layer
                    {shadow.layers.length > 1 ? "s" : ""}
                  </summary>
                  <div className="mt-3 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-hidden">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          {["X", "Y", "BLUR", "SPREAD", "COLOR"].map((col) => (
                            <th
                              key={col}
                              className="text-left px-2.5 py-1.5 border-b border-[var(--border-subtle)] text-[var(--text-placeholder)] uppercase tracking-[0.04em]"
                              style={{
                                fontFamily: "var(--font-geist-mono)",
                                fontSize: 10,
                                fontWeight: 500,
                              }}
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {shadow.layers.map((layer, i) => (
                          <tr
                            key={i}
                            className={
                              i < shadow.layers.length - 1
                                ? "border-b border-[var(--border-subtle)]"
                                : ""
                            }
                          >
                            {[layer.offsetX, layer.offsetY, layer.blur, layer.spread].map(
                              (v, j) => (
                                <td
                                  key={j}
                                  className="px-2.5 py-1.5 text-[var(--text-secondary)]"
                                  style={{
                                    fontFamily: "var(--font-geist-mono)",
                                    fontSize: 11,
                                  }}
                                >
                                  {v || "—"}
                                </td>
                              ),
                            )}
                            <td className="px-2.5 py-1.5">
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-3 h-3 rounded-sm border border-[var(--border-default)]"
                                  style={{ backgroundColor: layer.colorHex }}
                                />
                                <span
                                  className="text-[var(--text-secondary)]"
                                  style={{
                                    fontFamily: "var(--font-geist-mono)",
                                    fontSize: 11,
                                  }}
                                >
                                  {layer.colorHex}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              ) : null}
            </TokenCard>
          ))}
        </div>
      </div>

      {/* Section 2: Usage legend — rows */}
      <div className="mt-14">
        <SectionHeading>Reading the tokens</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5">
            <Eyebrow>LIGHT SURFACE</Eyebrow>
            <p
              className="mt-2 text-[var(--text-secondary)] text-body-s"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              Multi-layer shadows with soft ambient + tight contact layers
              read best on light backgrounds. Use for cards and popovers
              above the canvas.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5">
            <Eyebrow>DARK SURFACE</Eyebrow>
            <p
              className="mt-2 text-[var(--text-secondary)] text-body-s"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              On dark canvases, shadows disappear quickly. Rely on the
              border-strong token plus a subtle inset highlight, and reserve
              box-shadow for modal + overlay layers only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
