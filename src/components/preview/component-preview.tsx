"use client";

import { useState } from "react";
import type { ComponentAnalysis } from "@/lib/renderer/types";
import { PreviewSandbox } from "./preview-sandbox";
import { VariantGrid } from "./variant-grid";
import { PropsTable } from "./props-table";
import { Copy, ExternalLink, Code } from "lucide-react";

interface ComponentPreviewProps {
  analysis: ComponentAnalysis;
  repoUrl: string;
}

export function ComponentPreview({ analysis, repoUrl }: ComponentPreviewProps) {
  const [activeVariant, setActiveVariant] = useState<string | null>(
    analysis.previewGroups[0]?.name || null,
  );
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(analysis.source);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeGroup = analysis.previewGroups.find((group) => group.name === activeVariant);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{analysis.name}</h1>
          <p className="mt-1 font-mono text-sm text-neutral-500">{analysis.filePath}</p>
        </div>

        <a
          href={`${repoUrl}/blob/main/${analysis.filePath}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 rounded-lg bg-neutral-800 px-3 py-1.5 text-sm transition-colors hover:bg-neutral-700"
        >
          <ExternalLink className="h-4 w-4" />
          View on GitHub
        </a>
      </div>

      {analysis.previewGroups.length > 0 ? (
        <div className="flex gap-1 border-b border-neutral-800 pb-2">
          {analysis.previewGroups.map((group) => (
            <button
              key={group.name}
              onClick={() => setActiveVariant(group.name)}
              className={`rounded-t-lg px-4 py-2 text-sm transition-colors ${
                activeVariant === group.name
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-500 hover:bg-neutral-900 hover:text-white"
              }`}
            >
              {capitalize(group.name)}
            </button>
          ))}
        </div>
      ) : null}

      {activeGroup ? (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <VariantGrid
            componentName={analysis.name}
            previews={activeGroup.previews}
            source={analysis.source}
            dependencies={analysis.dependencies}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <PreviewSandbox
            componentName={analysis.name}
            source={analysis.source}
            previewCode={`<${analysis.name}>Preview</${analysis.name}>`}
            dependencies={analysis.dependencies}
          />
        </div>
      )}

      {analysis.props.length > 0 ? (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="mb-4 font-medium">Props</h2>
          <PropsTable props={analysis.props} />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
          <button
            onClick={() => setShowSource((value) => !value)}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white"
          >
            <Code className="h-4 w-4" />
            Source Code
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded bg-neutral-800 px-2 py-1 text-xs transition-colors hover:bg-neutral-700"
          >
            <Copy className="h-3 w-3" />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {showSource ? (
          <pre className="max-h-96 overflow-auto p-4 text-sm text-neutral-300">
            <code>{analysis.source}</code>
          </pre>
        ) : null}
      </div>
    </div>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
