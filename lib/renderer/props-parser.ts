import type { ExtractedProp } from "./types";

export function parseProps(source: string): ExtractedProp[] {
  const props: ExtractedProp[] = [];

  const patterns = [
    /interface\s+(\w*Props)\s*(?:extends[^\{]*)?\{([\s\S]*?)\}/,
    /type\s+(\w*Props)\s*=\s*\{([\s\S]*?)\}/,
    /type\s+(\w*Props)\s*=\s*(?:React\.\w+<[^>]+>\s*&\s*)?\{([\s\S]*?)\}/,
  ];

  let propsContent: string | null = null;

  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match) {
      propsContent = match[2];
      break;
    }
  }

  if (!propsContent) return props;

  const lines = propsContent.split("\n");
  let currentJsDoc = "";

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("/**") || trimmed.startsWith("*")) {
      currentJsDoc += trimmed.replace(/^\/?\*+\s?/, "") + " ";
      continue;
    }
    if (trimmed.startsWith("*/")) {
      continue;
    }

    const propMatch = trimmed.match(/^(\w+)(\?)?:\s*(.+?);?\s*$/);
    if (propMatch) {
      const [, name, optional, type] = propMatch;
      props.push({
        name,
        type: cleanType(type),
        required: !optional,
        description: currentJsDoc.trim() || undefined,
      });

      currentJsDoc = "";
    }
  }

  return props;
}

function cleanType(type: string): string {
  return type.replace(/\s+/g, " ").replace(/React\./g, "").trim();
}

export function extractStateProps(props: ExtractedProp[]): string[] {
  const stateKeywords = [
    "disabled",
    "loading",
    "active",
    "selected",
    "checked",
    "open",
    "expanded",
    "focused",
    "hovered",
    "pressed",
    "readonly",
    "required",
    "invalid",
    "error",
  ];

  return props
    .filter((prop) => prop.type === "boolean" || prop.type === "boolean | undefined")
    .filter((prop) => stateKeywords.some((keyword) => prop.name.toLowerCase().includes(keyword)))
    .map((prop) => prop.name);
}
