"use client";

import { useEffect, useRef, useState } from "react";
import { generateSandboxHtml, transformJsxToCreateElement } from "@/lib/renderer/sandbox";

interface PreviewSandboxProps {
  componentName: string;
  source: string;
  previewCode: string;
  dependencies: string[];
  height?: number;
  cssVariables?: string;
}

export function PreviewSandbox({
  componentName,
  source,
  previewCode,
  dependencies,
  height = 120,
  cssVariables,
}: PreviewSandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    try {
      const transformedSource = transformComponentSource(source, componentName);
      const transformedPreview = transformJsxToCreateElement(previewCode);
      const html = generateSandboxHtml(
        transformedSource,
        transformedPreview,
        dependencies,
        cssVariables,
      );

      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;

      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to render preview");
      setLoading(false);
    }
  }, [componentName, source, previewCode, dependencies, cssVariables]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-red-400">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height }}>
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : null}
      <iframe
        ref={iframeRef}
        className="h-full w-full border-0 bg-transparent"
        sandbox="allow-scripts"
        title="Component Preview"
      />
    </div>
  );
}

function transformComponentSource(source: string, componentName: string): string {
  let result = source
    .replace(/:\s*\w+(?:<[^>]+>)?/g, "")
    .replace(/interface\s+\w+\s*\{[^}]+\}/g, "")
    .replace(/type\s+\w+\s*=\s*[^;]+;/g, "")
    .replace(/import\s+type\s+[^;]+;/g, "")
    .replace(/<\w+>/g, "");

  if (!result.includes(`export { ${componentName} }`)) {
    if (
      !result.includes(`export default ${componentName}`) &&
      !result.includes(`export function ${componentName}`) &&
      !result.includes(`export const ${componentName}`)
    ) {
      result += `\nexport { ${componentName} };`;
    }
  }

  return result;
}
