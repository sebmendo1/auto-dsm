import type { ExtractedVariant, PreviewConfig, PreviewGroup } from "./types";

export function generatePreviewConfigs(
  componentName: string,
  variants: ExtractedVariant[],
  stateProps: string[],
): PreviewGroup[] {
  const groups: PreviewGroup[] = [];

  for (const variant of variants) {
    const previews: PreviewConfig[] = [];
    const sizeVariant = variants.find((item) => item.name === "size");

    for (const value of variant.values) {
      if (sizeVariant && variant.name !== "size") {
        for (const size of sizeVariant.values) {
          previews.push({
            id: `${variant.name}-${value}-${size}`,
            label: `${capitalize(value)} / ${capitalize(size)}`,
            props: {
              [variant.name]: value,
              size,
            },
            code: generateJsx(componentName, { [variant.name]: value, size }),
          });
        }
      } else {
        previews.push({
          id: `${variant.name}-${value}`,
          label: capitalize(value),
          props: { [variant.name]: value },
          code: generateJsx(componentName, { [variant.name]: value }),
        });
      }
    }

    groups.push({
      name: variant.name,
      value: variant.name,
      previews,
    });
  }

  if (stateProps.length > 0) {
    const statePreview: PreviewConfig[] = [];
    for (const stateProp of stateProps) {
      statePreview.push({
        id: `state-${stateProp}`,
        label: capitalize(stateProp),
        props: { [stateProp]: true },
        code: generateJsx(componentName, { [stateProp]: true }),
      });
    }

    groups.push({
      name: "states",
      value: "states",
      previews: statePreview,
    });
  }

  return groups;
}

function generateJsx(
  componentName: string,
  props: Record<string, any>,
  children?: string,
): string {
  const propsStr = Object.entries(props)
    .map(([key, value]) => {
      if (typeof value === "boolean") {
        return value ? key : "";
      }
      if (typeof value === "string") {
        return `${key}="${value}"`;
      }
      return `${key}={${JSON.stringify(value)}}`;
    })
    .filter(Boolean)
    .join(" ");

  const childContent = children || componentName;

  if (propsStr) {
    return `<${componentName} ${propsStr}>${childContent}</${componentName}>`;
  }
  return `<${componentName}>${childContent}</${componentName}>`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
