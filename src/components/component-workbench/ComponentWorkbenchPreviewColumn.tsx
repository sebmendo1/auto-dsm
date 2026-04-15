import { Suspense, lazy } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { SandpackWorkbenchPayload } from "./ComponentWorkbenchSandpack";

const LazySandpack = lazy(() =>
  import("./ComponentWorkbenchSandpack").then((m) => ({ default: m.ComponentWorkbenchSandpack })),
);

type Props = {
  slug: string;
  payload: SandpackWorkbenchPayload;
  fileName: string;
};

function SandpackFallback() {
  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 text-sm text-foreground-secondary">
        <Skeleton className="h-4 w-4 rounded-full" />
        Starting Sandpack…
      </div>
      <Skeleton className="h-[min(420px,50vh)] w-full rounded-md" />
    </div>
  );
}

export function ComponentWorkbenchPreviewColumn({ slug, payload, fileName }: Props) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:min-h-[calc(100vh-8rem)]">
      <span className="sr-only">{fileName}</span>
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <Suspense fallback={<SandpackFallback />}>
          <LazySandpack key={slug} slug={slug} payload={payload} />
        </Suspense>
      </div>
    </div>
  );
}
