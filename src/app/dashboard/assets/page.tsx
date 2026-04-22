"use client";

import * as React from "react";
import { Image as ImageIcon, Images } from "lucide-react";
import { useBrandStore } from "@/stores/brand";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  BrandTokenPageHero,
  BrandTokenPageLayout,
  LastUpdatedLabel,
  TokenPageProvenanceLine,
} from "@/components/dashboard/brand-token-page-layout";
import { brandTokenSurface } from "@/components/ui/brand-card-tokens";
import { cn } from "@/lib/utils";
import type { BrandAsset } from "@/lib/brand/types";

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

const HERO_DESC =
  "Logos, icons, illustrations, and raster assets discovered across your repository.";

function AssetPreview({ asset }: { asset: BrandAsset }) {
  if (asset.type === "svg" && asset.content) {
    return (
      <div
        className="flex h-full w-full items-center justify-center p-4"
        dangerouslySetInnerHTML={{ __html: asset.content }}
      />
    );
  }
  if (asset.storageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- dynamic external URLs (Supabase)
      <img
        src={asset.storageUrl}
        alt={asset.name}
        className="max-h-full max-w-full object-contain"
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

export default function AssetsPage() {
  const profile = useBrandStore((s) => s.profile);

  if (!profile || profile.assets.length === 0) {
    return (
      <BrandTokenPageLayout
        hero={
          <BrandTokenPageHero
            title="Assets"
            description={HERO_DESC}
            icon={<Images size={20} strokeWidth={1.75} className="shrink-0" aria-hidden />}
          />
        }
        metaRight={profile?.scannedAt ? <LastUpdatedLabel scannedAt={profile.scannedAt} /> : undefined}
      >
        <EmptyState
          title="No assets found"
          description="We didn't find any SVGs, PNGs, or images in this repo's public or assets folders."
        />
      </BrandTokenPageLayout>
    );
  }

  const byCategory = new Map<BrandAsset["category"], BrandAsset[]>();
  for (const a of profile.assets) {
    const arr = byCategory.get(a.category) ?? [];
    arr.push(a);
    byCategory.set(a.category, arr);
  }

  return (
    <BrandTokenPageLayout
      hero={
        <BrandTokenPageHero
          title="Assets"
          description={HERO_DESC}
          icon={<Images size={20} strokeWidth={1.75} className="shrink-0" aria-hidden />}
        />
      }
      metaRight={<LastUpdatedLabel scannedAt={profile.scannedAt} />}
    >
      <div className="space-y-6">
        <TokenPageProvenanceLine>
          {profile.assets.length} assets · scanned from {profile.meta.filesScanned} files
        </TokenPageProvenanceLine>

        <div className="space-y-12">
          {CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((cat) => {
            const items = byCategory.get(cat) ?? [];
            return (
              <section key={cat}>
                <div className="mb-4 flex items-baseline justify-between">
                  <h2 className="text-h3 text-[var(--text-primary)]">
                    {CATEGORY_LABELS[cat]}
                  </h2>
                  <span
                    className="text-[var(--text-tertiary)]"
                    style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
                  >
                    {items.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {items.map((asset) => (
                    <div
                      key={asset.path}
                      className={cn(brandTokenSurface, "overflow-hidden")}
                    >
                      <div className="flex h-36 items-center justify-center bg-[var(--bg-primary)]">
                        <AssetPreview asset={asset} />
                      </div>
                      <div className="p-3">
                        <div
                          className="truncate text-[var(--text-primary)]"
                          style={{ fontFamily: "var(--font-geist-sans)", fontSize: 13 }}
                          title={asset.name}
                        >
                          {asset.name}
                        </div>
                        <div
                          className="mt-0.5 flex items-center gap-2 text-[var(--text-tertiary)]"
                          style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
                        >
                          <span className="uppercase">{asset.type}</span>
                          {asset.dimensions && (
                            <span>
                              {asset.dimensions.width}×{asset.dimensions.height}
                            </span>
                          )}
                          <span>{asset.fileSizeFormatted}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1">
                          <span
                            className="flex-1 truncate text-[var(--text-tertiary)]"
                            style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
                            title={asset.path}
                          >
                            {asset.path}
                          </span>
                          <CopyButton value={asset.path} iconSize={12} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </BrandTokenPageLayout>
  );
}
