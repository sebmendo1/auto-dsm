"use client";

import { SpacingRow } from "@/components/tokens/spacing-row";

type SpacingToken = { name: string; value: string };

type SpacingScaleProps = {
  tokens: SpacingToken[];
  onCopy: (value: string) => void;
};

export function SpacingScale({ tokens, onCopy }: SpacingScaleProps) {
  return (
    <div className="space-y-3">
      {tokens.map((token) => (
        <SpacingRow key={token.name} name={token.name} value={token.value} onCopy={onCopy} />
      ))}
    </div>
  );
}
