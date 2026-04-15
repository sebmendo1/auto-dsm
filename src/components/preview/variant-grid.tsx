"use client";

import type { PreviewConfig } from "@/lib/renderer/types";
import { PreviewSandbox } from "./preview-sandbox";

interface VariantGridProps {
  componentName: string;
  previews: PreviewConfig[];
  source: string;
  dependencies: string[];
}

export function VariantGrid({
  componentName,
  previews,
  source,
  dependencies,
}: VariantGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {previews.map((preview) => (
        <div key={preview.id} className="flex flex-col items-center rounded-lg bg-neutral-800/50 p-4">
          <div className="mb-3 flex h-24 w-full items-center justify-center rounded bg-white/5">
            <PreviewSandbox
              componentName={componentName}
              source={source}
              previewCode={preview.code}
              dependencies={dependencies}
              height={80}
            />
          </div>
          <p className="text-center text-xs text-neutral-400">{preview.label}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {Object.entries(preview.props).map(([key, value]) => (
              <span
                key={key}
                className="rounded bg-neutral-700 px-1.5 py-0.5 text-[10px] font-mono text-neutral-300"
              >
                {key}={String(value)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
