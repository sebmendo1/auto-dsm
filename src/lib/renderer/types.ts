export interface ExtractedVariant {
  name: string;
  values: string[];
  defaultValue?: string;
}

export interface ExtractedProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export interface PreviewConfig {
  id: string;
  label: string;
  props: Record<string, any>;
  code: string;
}

export interface PreviewGroup {
  name: string;
  value: string;
  previews: PreviewConfig[];
}

export interface ComponentAnalysis {
  name: string;
  filePath: string;
  source: string;
  variants: ExtractedVariant[];
  props: ExtractedProp[];
  previewGroups: PreviewGroup[];
  dependencies: string[];
  hasDefaultExport: boolean;
  exportName: string;
}
