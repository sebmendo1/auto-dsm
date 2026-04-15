"use client";

import { Card } from "@/components/ui/card";

type TypographySampleProps = {
  name: string;
  value: string;
  size: string;
  fontFamily?: string;
  onCopy: (value: string) => void;
};

export function TypographySample({
  name,
  value,
  size,
  fontFamily,
  onCopy,
}: TypographySampleProps) {
  return (
    <Card className="flex flex-col gap-3 cursor-pointer" onClick={() => onCopy(value)}>
      <div>
        <p className="text-xs text-foreground-tertiary">{name}</p>
        <p className="text-sm font-mono text-foreground-secondary">{value}</p>
      </div>
      <p className="font-medium" style={{ fontSize: size, fontFamily }}>
        The quick brown fox jumps over the lazy dog.
      </p>
    </Card>
  );
}
