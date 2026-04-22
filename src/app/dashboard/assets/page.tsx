"use client";

import * as React from "react";
import { Image as ImageIcon } from "lucide-react";
import { useBrandStore } from "@/stores/brand";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, SectionHeading, Eyebrow } from "@/components/dashboard/page-header";
import type { BrandAsset } from "@/lib/brand/types";
import { cn } from "@/lib/utils";

const CATEGORY_ORDER: BrandAsset["category"][] = [
  "logo",
  "favicon",
  "icon",
  "illustration",
  "image",
];

const CATEGORY_LABELS: Record<BrandAsset["category"], string> = {
  logo: "Logos",
  favicon: "Favicons",
  icon: "Icons",
  illustration: "Illustrations",
  image: "Images",
};

const CHECKERBOARD = `repeating-conic-gradient(
  var(--border-subtle) 0% 25%,
  transparent 0% 50%
) 50% / 12px 12px`;

function AssetPreview({ asset }: { asset: BrandAsset }) {
  if (asset.type === "svg" && asset.content) {
    return (
      <div
        className="w-full h-full flex items-center justify-center p-6 [&>svg]:max-w-full [&>svg]:max-h-full"
        dangerouslySetInnerHTML={{ __html: asset.content }}
      />
    );
  }
  if (asset.storageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={asset.storageUrl}
        alt={asset.name}
        className="max-w-full max-h-full object-contain p-6"
      />
    );
  }
  return (
    <ImageIcon
      size={32}
      strokeWidth={1.5}
      className="text-[var(--text-tertiary)]"
    />
  );
}

function AssetCard({
  asset,
  transparentBg,
}: {
  asset: BrandAsset;
  transparentBg: boolean;
}) {
  return (
    <div
      className={cn(
        "group rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden",
        "transition-colors duration-150 [transition-timing-function:var(--ease-standard)]",
        "hover:border-[var(--border-strong)]",
      )}
    >
      {/* Preview */}
      <div
        className="relative h-[180px] w-full flex items-center justify-center overflow-hidden"
        style={{
          background:
            asset.hasTransparency && transparentBg
              ? CHECKERBOARD
              : "var(--bg-primary)",
        }}
      >
        <AssetPreview asset={asset} />
      </div>

      {/* Body */}
      <div className="p-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              className="text-[var(--text-primary)] font-medium truncate"
              style={{ fontFamily: "var(--font-geist-sans)", fontSize: 13 }}
              title={asset.name}
            >
              {asset.name}
            </div>
            <div
              className="text-[var(--text-tertiary)] mt-0.5 flex items-center gap-2"
              style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
            >
              <span className="uppercase">{asset.type}</span>
              {asset.dimensions ? (
                <>
                  <span className="text-[var(--text-placeholder)]">·</span>
                  <span>
                    {asset.dimensions.width}×{asset.dimensions.height}
                  </span>
                </>
              ) : null}
              {asset.fileSizeFormatted ? (
                <>
                  <span className="text-[var(--text-placeholder)]">·</span>
                  <span>{asset.fileSizeFormatted}</span>
                </>
              ) : null}
            </div>
          </div>

          {/* Transparency indicator */}
          {asset.hasTransparency ? (
            <span
              className="shrink-0 inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-1.5 py-0.5 text-[var(--text-tertiary)]"
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 10,
                lineHeight: 1,
              }}
              title="Has transparency"
            >
              α
            </span>
          ) : null}
        </div>

        {/* Path copy chip */}
        <div className="mt-3 flex items-center gap-2 rounded-md bg-[var(--bg-code)] border border-[var(--border-subtle)] pl-2 pr-0.5 py-1 hover:border-[var(--border-default)] transition-colors duration-150 [transition-timing-function:var(--ease-standard)]">
          <span
            className="flex-1 min-w-0 text-[var(--text-code)] truncate"
            style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
            title={asset.path}
          >
            {asset.path}
          </span>
          <CopyButton value={asset.path} label="path" iconSize={12} />
        </div>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const profile = useBrandStore((s) => s.profile);
  const [transparentBg, setTransparentBg] = React.useState(false);

  if (!profile || profile.assets.length === 0) {
    return (
      <div className="px-10 py-10 max-w-[1200px]">
        <PageHeader
          title="Assets"
          description="Logos, icons, and images from your repo."
        />
        <div className="mt-10">
          <EmptyState
            title="No assets found"
            description="We didn't find any SVGs, PNGs, or images in this repo's public or assets folders."
          />
        </div>
      </div>
    );
  }

  const source = `${profile.meta.filesScanned} files`;

  const byCategory = new Map<BrandAsset["category"], BrandAsset[]>();
  for (const a of profile.assets) {
    const arr = byCategory.get(a.category) ?? [];
    arr.push(a);
    byCategory.set(a.category, arr);
  }

  return (
    <div className="px-10 py-10 max-w-[1200px]">
      <PageHeader
        title="Assets"
        description="Logos, icons, illustrations, and raster assets discovered across your repo."
        source={source}
        count={profile.assets.length}
        actions={
          <div className="flex items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-secondary)] p-0.5 gap-0.5">
            {([
              { label: "Surface", value: false },
              { label: "Transparent", value: true },
            ] as const).map((mode) => {
              const active = mode.value === transparentBg;
              return (
                <button
                  key={mode.label}
                  type="button"
                  onClick={() => setTransparentBg(mode.value)}
                  className={
                    "px-3 py-1 rounded-full text-[12px] font-medium transition-all duration-150 [transition-timing-function:var(--ease-standard)] " +
                    (active
                      ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]")
                  }
                  style={{ fontFamily: "var(--font-geist-sans)" }}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        }
      />

      <div className="mt-12 space-y-14">
        {CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((cat) => {
          const items = byCategory.get(cat) ?? [];
          return (
            <section key={cat}>
              <div className="flex items-center gap-4 mb-5">
                <SectionHeading className="mb-0" count={items.length}>
                  {CATEGORY_LABELS[cat]}
                </SectionHeading>
                <div className="flex-1 h-px bg-[var(--border-subtle)]" />
              </div>

              {items.length === 0 ? (
                <Eyebrow>No {CATEGORY_LABELS[cat].toLowerCase()} found</Eyebrow>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {items.map((asset) => (
                    <AssetCard
                      key={asset.path}
                      asset={asset}
                      transparentBg={transparentBg}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
