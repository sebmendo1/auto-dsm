import { StepIcon } from "@/components/parsing/step-icon";

type ParsingStepData = {
  title: string;
  pendingSubtitle: string;
  activeSubtitle: string | ((data?: Record<string, unknown>) => string);
  completeSubtitle: string | ((data?: Record<string, unknown>) => string);
};

type ParsingStepProps = {
  step: ParsingStepData;
  status: "pending" | "active" | "complete" | "error";
  data?: Record<string, unknown>;
  isLast: boolean;
};

export function ParsingStep({ step, status, data, isLast }: ParsingStepProps) {
  const subtitle =
    status === "complete"
      ? typeof step.completeSubtitle === "function"
        ? step.completeSubtitle(data)
        : step.completeSubtitle
      : status === "active"
        ? typeof step.activeSubtitle === "function"
          ? step.activeSubtitle(data)
          : step.activeSubtitle
        : step.pendingSubtitle;

  return (
    <div className="relative">
      {!isLast ? (
        <div
          className={`absolute left-3 top-7 h-full w-px ${
            status === "complete" ? "bg-border" : "border-l border-dashed border-border"
          }`}
        />
      ) : null}
      <div className={`flex gap-4 pb-6 ${status === "active" ? "animate-step-active" : ""}`}>
        <div className="relative z-10">
          <StepIcon status={status} />
        </div>
        <div className="flex-1 pt-0.5">
          <p
            className={`text-sm font-medium ${
              status === "pending" ? "text-foreground-tertiary" : "text-foreground"
            }`}
          >
            {step.title}
          </p>
          <p
            className={`mt-0.5 text-sm ${
              status === "active" ? "text-foreground-secondary" : "text-foreground-tertiary"
            }`}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
