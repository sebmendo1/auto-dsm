"use client";

import { Card } from "@/components/ui/card";

type ColorSwatchProps = {
  name: string;
  value: string;
  onCopy: (value: string) => void;
};

export function ColorSwatch({ name, value, onCopy }: ColorSwatchProps) {
  return (
    <Card
      className="flex items-center gap-4 cursor-pointer"
      onClick={() => onCopy(value)}
    >
      <div
        className="h-12 w-12 rounded-md border border-border"
        style={{ backgroundColor: value }}
      />
      <div className="flex-1">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs font-mono text-foreground-tertiary">{value}</p>
      </div>
      <span className="text-xs text-foreground-tertiary">Copy</span>
    </Card>
  );
}
