"use client";

import * as React from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { Eyebrow } from "@/components/dashboard/page-header";
import { cn } from "@/lib/utils";

/**
 * Token card for visual tokens (shadows, gradients, animations, opacity,
 * assets). Always laid out in a 2-col max grid at the page level.
 *
 *   <TokenCard
 *     preview={<div style={{ boxShadow: s.value }} />}
 *     title="shadow-sm"
 *     subtitle="Tailwind · globals.css"
 *     specs={[{ label: "VALUE", value: "0 1px 2px rgba(0,0,0,0.05)" }]}
 *     copyables={[{ label: "css", value: s.value }]}
 *   />
 */
export interface CardSpec {
  label: string;
  value: React.ReactNode;
  /** Override the value's font (defaults to mono). */
  mono?: boolean;
}

export interface CardCopyable {
  label: string;
  value: string;
  /** Optional eyebrow (e.g. "CSS", "CLASS"). */
  eyebrow?: string;
}

export interface TokenCardProps {
  /** The visual preview area. Renders inside a canvas slot with its own background. */
  preview: React.ReactNode;
  /** Height of the preview area in px. Defaults to 144. */
  previewHeight?: number;
  /** Alternate preview background style. Defaults to var(--bg-primary). */
  previewBackground?: string;
  /** Padding applied around the preview. Defaults to "p-0" (full-bleed). */
  previewPadding?: string;
  title: string;
  subtitle?: React.ReactNode;
  specs?: CardSpec[];
  copyables?: CardCopyable[];
  /** Extra content slotted between preview and specs (e.g. stop chips, layer table). */
  children?: React.ReactNode;
  /** Header adornment (e.g. Replay button on animations). */
  headerRight?: React.ReactNode;
  className?: string;
}

export function TokenCard({
  preview,
  previewHeight = 144,
  previewBackground = "var(--bg-primary)",
  previewPadding = "p-0",
  title,
  subtitle,
  specs,
  copyables,
  children,
  headerRight,
  className,
}: TokenCardProps) {
  return (
    <div
      className={cn(
        "group rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden",
        "transition-shadow duration-150 [transition-timing-function:var(--ease-standard)]",
        "hover:border-[var(--border-strong)]",
        className,
      )}
    >
      {/* Preview slot */}
      <div
        className={cn(
          "relative w-full flex items-center justify-center overflow-hidden",
          previewPadding,
        )}
        style={{ height: previewHeight, background: previewBackground }}
      >
        {preview}
      </div>

      {/* Body */}
      <div className="p-5 border-t border-[var(--border-subtle)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              className="text-[var(--text-primary)] font-medium truncate"
              style={{ fontFamily: "var(--font-geist-sans)", fontSize: 14 }}
              title={title}
            >
              {title}
            </div>
            {subtitle ? (
              <div
                className="text-[var(--text-tertiary)] mt-0.5 truncate"
                style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>
          {headerRight}
        </div>

        {/* Extra slot (stop chips, layer tables, etc.) */}
        {children}

        {/* Specs grid */}
        {specs && specs.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {specs.map((spec) => (
              <div key={spec.label} className="min-w-0">
                <Eyebrow>{spec.label}</Eyebrow>
                <div
                  className={cn(
                    "text-[var(--text-primary)] truncate mt-0.5",
                    spec.mono === false ? "" : "",
                  )}
                  style={{
                    fontFamily:
                      spec.mono === false
                        ? "var(--font-geist-sans)"
                        : "var(--font-geist-mono)",
                    fontSize: 13,
                  }}
                >
                  {spec.value}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Copyables — Mintlify-style code chips */}
        {copyables && copyables.length > 0 ? (
          <div className="mt-4 space-y-1.5">
            {copyables.map((c) => (
              <div
                key={c.label}
                className="group/chip flex items-center gap-2 rounded-md bg-[var(--bg-code)] border border-[var(--border-subtle)] pl-2.5 pr-1 py-1 hover:border-[var(--border-default)] transition-colors duration-150 [transition-timing-function:var(--ease-standard)]"
              >
                {c.eyebrow ? (
                  <span
                    className="shrink-0 text-[var(--text-placeholder)] uppercase tracking-[0.04em]"
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 10,
                    }}
                  >
                    {c.eyebrow}
                  </span>
                ) : null}
                <span
                  className="flex-1 min-w-0 text-[var(--text-code)] break-all"
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: 12,
                  }}
                >
                  {c.value}
                </span>
                <CopyButton
                  value={c.value}
                  label={c.label}
                  iconSize={12}
                  className="shrink-0"
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
