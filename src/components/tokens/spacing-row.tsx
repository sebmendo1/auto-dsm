"use client";

import { Card } from "@/components/ui/card";

type SpacingRowProps = {
  name: string;
  value: string;
  onCopy: (value: string) => void;
};

export function SpacingRow({ name, value, onCopy }: SpacingRowProps) {
  return (
    <Card
      className="flex items-center gap-4 cursor-pointer"
      onClick={() => onCopy(value)}
    >
      <div className="flex-1">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs font-mono text-foreground-tertiary">{value}</p>
      </div>
      <div className="flex h-8 items-center justify-end">
        <div className="h-2 rounded-full bg-accent-blue" style={{ width: value }} />
      </div>
    </Card>
  );
}
