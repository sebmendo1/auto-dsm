/**
 * assets.ts — Asset scanner and classifier (server-side).
 * PDF §10 — source 7: Asset scanning + §15 Asset post-processing.
 *
 * Uses `sharp` for raster metadata + dominant colors.
 * SVGs: parse viewBox from string.
 */

import path from "path";
import type { BrandAsset } from "@/lib/brand/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AssetFile {
  path: string;
  buffer: Buffer;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const RASTER_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".ico", ".gif"]);
const ALL_EXTS = new Set([...RASTER_EXTS, ".svg"]);

const SVG_MAX_INLINE = 8 * 1024; // 8 KB

// ─── Classification ───────────────────────────────────────────────────────────

type AssetCategory = BrandAsset["category"];

function classifyAsset(
  filePath: string,
  dims?: { width: number; height: number }
): AssetCategory {
  const lower = filePath.toLowerCase();
  const base = path.basename(lower, path.extname(lower));
  const ext = path.extname(lower);

  // favicon
  if (base.includes("favicon") || ext === ".ico") return "favicon";

  // logo
  if (
    base.includes("logo") ||
    /\/logos?\//.test(lower) ||
    /\/brand\//.test(lower)
  )
    return "logo";

  // icon
  if (
    /\/icons?\//.test(lower) ||
    base.startsWith("ic-") ||
    base.includes("icon") ||
    (ext === ".svg" &&
      dims &&
      dims.width <= 64 &&
      dims.height <= 64)
  )
    return "icon";

  // illustration — SVG > 200×200 or in /illustrations/
  if (
    /\/illustrations?\//.test(lower) ||
    (ext === ".svg" && dims && dims.width > 200 && dims.height > 200)
  )
    return "illustration";

  // image
  return "image";
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── SVG parser ───────────────────────────────────────────────────────────────

function parseSvgDimensions(
  content: string
): { width: number; height: number } | undefined {
  // Try viewBox first: viewBox="0 0 24 24"
  const vb = content.match(/viewBox=["']\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/i);
  if (vb) {
    const w = parseFloat(vb[1]);
    const h = parseFloat(vb[2]);
    if (!isNaN(w) && !isNaN(h)) return { width: w, height: h };
  }
  // Fall back to width/height attributes
  const wm = content.match(/\bwidth=["']?([\d.]+)(?:px)?["']?/i);
  const hm = content.match(/\bheight=["']?([\d.]+)(?:px)?["']?/i);
  if (wm && hm) {
    const w = parseFloat(wm[1]);
    const h = parseFloat(hm[1]);
    if (!isNaN(w) && !isNaN(h)) return { width: w, height: h };
  }
  return undefined;
}

// ─── Dominant colors from raster ─────────────────────────────────────────────

async function getDominantColors(
  buffer: Buffer,
  ext: string
): Promise<string[]> {
  try {
    // Dynamic import to avoid issues in non-Node environments
    const sharp = (await import("sharp")).default;
    // Resize to 50×50 for fast stats
    const { dominant } = await sharp(buffer)
      .resize(50, 50, { fit: "cover" })
      .toFormat("raw")
      .stats();

    // dominant gives us the single most dominant channel values
    // For top-3, we sample the image at a lower resolution and collect unique colors
    const { data } = await sharp(buffer)
      .resize(20, 20, { fit: "cover" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Count rgb occurrences
    const counts = new Map<string, number>();
    const channels = ext === ".png" || ext === ".webp" ? 4 : 3;
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Skip near-transparent pixels for PNGs
      if (channels === 4 && data[i + 3] < 10) continue;
      const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
      counts.set(hex, (counts.get(hex) ?? 0) + 1);
    }

    const sorted = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hex]) => hex);

    if (sorted.length > 0) return sorted;

    // Fallback to sharp dominant
    const dr = Math.round(dominant.r).toString(16).padStart(2, "0");
    const dg = Math.round(dominant.g).toString(16).padStart(2, "0");
    const db = Math.round(dominant.b).toString(16).padStart(2, "0");
    return [`#${dr}${dg}${db}`];
  } catch {
    return [];
  }
}

async function hasAlpha(buffer: Buffer): Promise<boolean> {
  try {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(buffer).metadata();
    return meta.hasAlpha ?? false;
  } catch {
    return false;
  }
}

async function getRasterDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number } | undefined> {
  try {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(buffer).metadata();
    if (meta.width && meta.height) {
      return { width: meta.width, height: meta.height };
    }
    return undefined;
  } catch {
    return undefined;
  }
}

// ─── Main API ─────────────────────────────────────────────────────────────────

/**
 * Scan a set of asset files and return BrandAsset[].
 * Permissive — skips unprocessable files silently.
 */
export async function scanAssets(
  files: AssetFile[]
): Promise<BrandAsset[]> {
  const results: BrandAsset[] = [];

  for (const file of files) {
    try {
      const ext = path.extname(file.path).toLowerCase();
      if (!ALL_EXTS.has(ext)) continue;

      const fileSize = file.buffer.byteLength;
      const fileSizeFormatted = formatFileSize(fileSize);
      const name = path.basename(file.path);

      // Determine type
      const typemap: Record<string, BrandAsset["type"]> = {
        ".svg": "svg",
        ".png": "png",
        ".jpg": "jpg",
        ".jpeg": "jpg",
        ".webp": "webp",
        ".ico": "ico",
        ".gif": "gif",
      };
      const type = typemap[ext];
      if (!type) continue;

      let dims: { width: number; height: number } | undefined;
      let content: string | undefined;
      let dominantColors: string[] | undefined;
      let hasTransparency: boolean | undefined;

      if (ext === ".svg") {
        const svgText = file.buffer.toString("utf-8");
        dims = parseSvgDimensions(svgText);
        if (fileSize <= SVG_MAX_INLINE) {
          content = svgText;
        }
        dominantColors = [];
      } else {
        dims = await getRasterDimensions(file.buffer);
        const colors = await getDominantColors(file.buffer, ext);
        dominantColors = colors.length > 0 ? colors : undefined;
        hasTransparency = await hasAlpha(file.buffer);
      }

      const category = classifyAsset(file.path, dims);

      results.push({
        name,
        path: file.path,
        type,
        category,
        dimensions: dims,
        fileSize,
        fileSizeFormatted,
        content,
        dominantColors,
        hasTransparency,
      });
    } catch {
      // Permissive — skip this file
    }
  }

  return results;
}
