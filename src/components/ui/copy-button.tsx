"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  label?: string;
  iconSize?: number;
}

export function CopyButton({
  value,
  label,
  iconSize = 14,
  className,
  ...props
}: Props) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`Copied ${label ?? "value"}`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex items-center justify-center rounded-[6px] h-7 w-7",
        "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]",
        "transition-colors duration-150 [transition-timing-function:var(--ease-standard)]",
        className,
      )}
      aria-label={`Copy ${label ?? "value"}`}
      {...props}
    >
      {copied ? (
        <Check size={iconSize} strokeWidth={1.8} />
      ) : (
        <Copy size={iconSize} strokeWidth={1.5} />
      )}
    </button>
  );
}
