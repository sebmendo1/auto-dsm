"use client";

import { ColorSwatch } from "@/components/tokens/color-swatch";

type ColorToken = { name: string; value: string };

type ColorPaletteProps = {
  title: string;
  tokens: ColorToken[];
  onCopy: (value: string) => void;
};

export function ColorPalette({ title, tokens, onCopy }: ColorPaletteProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tokens.map((token) => (
          <ColorSwatch key={token.name} name={token.name} value={token.value} onCopy={onCopy} />
        ))}
      </div>
    </div>
  );
}
