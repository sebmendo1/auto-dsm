/**
 * The render config is the *only* thing the iframe runtime needs to render
 * a component. It is produced by the parser during scan and persisted in
 * Supabase `components.render_config`. The iframe runtime treats it as the
 * single source of truth — no hidden server calls during a live render.
 */

export type PropControlType =
  | 'boolean'
  | 'string'
  | 'number'
  | 'enum'
  | 'node'
  | 'function'
  | 'unknown';

export interface PropControl {
  name: string;
  type: PropControlType;
  /** Original TS type expression, e.g. `'default' | 'destructive'` or `ReactNode`. */
  raw?: string;
  /** Only populated when type === 'enum'. */
  values?: string[];
  required?: boolean;
  defaultValue?: unknown;
  description?: string;
}

export interface RenderConfig {
  /** Exported identifier to render. Almost always the component name. */
  entry_module: string;
  /**
   * The full in-memory filesystem the iframe needs to resolve imports. Keyed
   * by virtual absolute path (e.g. `/Button.tsx`, `/lib/utils.ts`). Values are
   * the raw source strings. Bare imports are resolved via esm.sh at runtime.
   */
  files: Record<string, string>;

  /** npm dependencies seen in the source. Versions are advisory — esm.sh will
   *  resolve to latest by default. */
  dependencies: Record<string, string>;

  /** Provider wrappers automatically applied around the component. Example:
   *  ['ThemeProvider', 'TooltipProvider']. The runtime will no-op any it can't
   *  resolve rather than crashing. */
  providers: string[];

  /** URL of the precompiled Tailwind CSS bundle for this repo. Injected as a
   *  <link rel=stylesheet> inside the iframe. */
  css_url?: string;

  /** Props the component mounts with. User edits in the Preferences panel
   *  stream in via postMessage. */
  initial_props: Record<string, unknown>;

  /** Controls the Preferences panel renders. */
  prop_controls: PropControl[];

  /** Variant presets synthesised from the combination of variant enums +
   *  children patterns. Shown as the top "Configuration" dropdown. */
  presets?: { label: string; props: Record<string, unknown> }[];
}

export interface ParsedComponent {
  name: string;
  slug: string;
  file_path: string;
  source_code: string;
  description?: string;
  props: PropControl[];
  initial_props: Record<string, unknown>;
  presets: { label: string; props: Record<string, unknown> }[];
  dependencies: Record<string, string>;
  /** Any relative imports we managed to resolve within the repo. */
  local_imports: { from: string; resolved_path: string; source: string }[];
}

export type IframeMessage =
  | { type: 'MOUNT'; config: RenderConfig }
  | { type: 'UPDATE_PROPS'; props: Record<string, unknown> }
  | { type: 'RENDER_OK' }
  | { type: 'RENDER_ERROR'; error: { message: string; stack?: string } }
  | { type: 'RUNTIME_READY' };
