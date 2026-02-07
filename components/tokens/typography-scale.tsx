"use client";

import { TypographySample } from "@/components/tokens/typography-sample";

type TypographyToken = { name: string; value: string; size: string; fontFamily?: string };

type TypographyScaleProps = {
  tokens: TypographyToken[];
  onCopy: (value: string) => void;
};

export function TypographyScale({ tokens, onCopy }: TypographyScaleProps) {
  return (
    <div className="space-y-3">
      {tokens.map((token) => (
        <TypographySample
          key={token.name}
          name={token.name}
          value={token.value}
          size={token.size}
          fontFamily={token.fontFamily}
          onCopy={onCopy}
        />
      ))}
    </div>
  );
}
