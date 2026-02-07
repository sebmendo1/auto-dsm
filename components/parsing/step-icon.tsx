import { Check, Loader2, X } from "lucide-react";

type StepIconProps = {
  status: "pending" | "active" | "complete" | "error";
};

export function StepIcon({ status }: StepIconProps) {
  if (status === "complete") {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-green/20">
        <Check className="h-4 w-4 text-accent-green animate-checkmark" />
      </div>
    );
  }

  if (status === "active") {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-blue/20">
        <Loader2 className="h-4 w-4 animate-spin text-accent-blue" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-red/20">
        <X className="h-4 w-4 text-accent-red" />
      </div>
    );
  }

  return <div className="h-6 w-6 rounded-full border border-border-hover" />;
}
