import { ParsingStep } from "@/components/parsing/parsing-step";

const PARSING_STEPS = [
  {
    id: "connect",
    title: "Connecting to repository",
    pendingSubtitle: "Establishing connection...",
    activeSubtitle: "Authenticating with GitHub...",
    completeSubtitle: (data?: Record<string, unknown>) =>
      `github.com/${String(data?.repoFullName ?? "memento-app")}`,
  },
  {
    id: "scan",
    title: "Scanning file structure",
    pendingSubtitle: "Waiting...",
    activeSubtitle: "Reading repository tree...",
    completeSubtitle: (data?: Record<string, unknown>) =>
      `Found ${String(data?.fileCount ?? 847)} files`,
  },
  {
    id: "extract",
    title: "Extracting design tokens",
    pendingSubtitle: "Waiting...",
    activeSubtitle: (data?: Record<string, unknown>) =>
      `Parsing ${String(data?.currentFile ?? "globals.css")}...`,
    completeSubtitle: (data?: Record<string, unknown>) =>
      `Found ${String(data?.tokenCount ?? 67)} tokens`,
  },
  {
    id: "categorize",
    title: "Categorizing tokens",
    pendingSubtitle: "Colors, typography, spacing",
    activeSubtitle: "Analyzing token types...",
    completeSubtitle: (data?: Record<string, unknown>) =>
      `${String(data?.colorCount ?? 24)} colors, ${String(
        data?.typographyCount ?? 8,
      )} typography, ${String(data?.spacingCount ?? 8)} spacing`,
  },
  {
    id: "generate",
    title: "Generating preview",
    pendingSubtitle: "Building visual display",
    activeSubtitle: "Preparing your design system...",
    completeSubtitle: "Ready to view",
  },
] as const;

type ParsingProgressProps = {
  repoFullName: string;
  currentStep: number;
  stepData?: Record<string, Record<string, unknown>>;
  errorStep?: number | null;
};

export function ParsingProgress({
  repoFullName,
  currentStep,
  stepData = {},
  errorStep = null,
}: ParsingProgressProps) {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-background-elevated p-8">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground">
          Analyzing {repoFullName.split("/")[1]}
        </h2>
        <p className="mt-1 text-sm text-foreground-secondary">
          This usually takes 30-60 seconds.
        </p>
      </div>
      <div>
        {PARSING_STEPS.map((step, index) => {
          const isError = errorStep === index;
          const status = isError
            ? "error"
            : index < currentStep
              ? "complete"
              : index === currentStep
                ? "active"
                : "pending";
          return (
            <ParsingStep
              key={step.id}
              step={step}
              status={status}
              data={stepData[step.id]}
              isLast={index === PARSING_STEPS.length - 1}
            />
          );
        })}
      </div>
    </div>
  );
}
