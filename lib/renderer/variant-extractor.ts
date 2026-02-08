import type { ExtractedVariant } from "./types";

export function extractCvaVariants(source: string): ExtractedVariant[] {
  const variants: ExtractedVariant[] = [];
  const cvaMatch = source.match(/cva\s*\(\s*[`"'][^`"']*[`"']\s*,\s*\{([\s\S]*?)\}\s*\)/);
  if (!cvaMatch) return variants;

  const cvaContent = cvaMatch[1];
  const variantsMatch = cvaContent.match(/variants\s*:\s*\{([\s\S]*?)\}\s*,?\s*(?:defaultVariants|compoundVariants|\})/);
  if (!variantsMatch) return variants;

  const variantsContent = variantsMatch[1];
  const variantRegex = /(\w+)\s*:\s*\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = variantRegex.exec(variantsContent)) !== null) {
    const variantName = match[1];
    const variantValues = match[2];
    const values: string[] = [];
    const valueRegex = /(\w+)\s*:/g;
    let valueMatch: RegExpExecArray | null;

    while ((valueMatch = valueRegex.exec(variantValues)) !== null) {
      values.push(valueMatch[1]);
    }

    if (values.length > 0) {
      variants.push({
        name: variantName,
        values,
        defaultValue: extractDefaultVariant(cvaContent, variantName),
      });
    }
  }

  return variants;
}

function extractDefaultVariant(cvaContent: string, variantName: string): string | undefined {
  const defaultMatch = cvaContent.match(/defaultVariants\s*:\s*\{([^}]+)\}/);
  if (!defaultMatch) return undefined;

  const regex = new RegExp(`${variantName}\\s*:\\s*["']?(\\w+)["']?`);
  const match = defaultMatch[1].match(regex);
  return match ? match[1] : undefined;
}

export function extractVariantsFromProps(source: string): ExtractedVariant[] {
  const variants: ExtractedVariant[] = [];
  const propsMatch = source.match(/(?:interface|type)\s+\w*Props[^{]*\{([\s\S]*?)\}/);
  if (!propsMatch) return variants;

  const propsContent = propsMatch[1];
  const unionRegex = /(\w+)\??\s*:\s*((?:["']\w+["']\s*\|\s*)+["']\w+["'])/g;
  let match: RegExpExecArray | null;

  while ((match = unionRegex.exec(propsContent)) !== null) {
    const propName = match[1];
    const unionStr = match[2];

    const values: string[] = [];
    const valueRegex = /["'](\w+)["']/g;
    let valueMatch: RegExpExecArray | null;

    while ((valueMatch = valueRegex.exec(unionStr)) !== null) {
      values.push(valueMatch[1]);
    }

    if (values.length > 1) {
      variants.push({ name: propName, values });
    }
  }

  return variants;
}

export function extractAllVariants(source: string): ExtractedVariant[] {
  let variants = extractCvaVariants(source);
  if (variants.length === 0) {
    variants = extractVariantsFromProps(source);
  }
  return variants;
}
