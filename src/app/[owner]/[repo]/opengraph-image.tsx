import { ImageResponse } from "next/og";
import { loadPublicBrand } from "@/lib/brand/load";

export const runtime = "nodejs";
export const alt = "autoDSM Brand Book";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const { owner, repo } = await params;
  const brand = await loadPublicBrand(owner, repo);
  const profile = brand?.profile ?? null;

  const palette =
    profile?.colors.slice(0, 8).map((c) => c.value) ??
    ["#8F23FA", "#AA56FF", "#7A1DD6", "#141416", "#232327", "#F5F5F7"];

  const fontCount = profile?.fonts.length ?? 0;
  const tokenCount = profile
    ? profile.colors.length +
      profile.typography.length +
      profile.spacing.length +
      profile.shadows.length +
      profile.radii.length
    : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0A0A0B",
          color: "#F5F5F7",
          padding: 80,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Top: wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#F5F5F7",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background:
                "linear-gradient(135deg, #8F23FA 0%, #AA56FF 100%)",
            }}
          />
          autoDSM
        </div>

        {/* Middle: repo name */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: "#8F8F94",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            Brand Book
          </div>
          <div
            style={{
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            <span>{owner}</span>
            <span style={{ color: "#8F8F94", margin: "0 18px" }}>/</span>
            <span>{repo}</span>
          </div>
          <div
            style={{
              marginTop: 32,
              display: "flex",
              gap: 40,
              fontSize: 20,
              color: "#B0B0B6",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
              <span style={{ color: "#F5F5F7", fontSize: 28, fontWeight: 600 }}>
                {tokenCount}
              </span>
              tokens
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
              <span style={{ color: "#F5F5F7", fontSize: 28, fontWeight: 600 }}>
                {fontCount}
              </span>
              fonts
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
              <span style={{ color: "#F5F5F7", fontSize: 28, fontWeight: 600 }}>
                {palette.length}
              </span>
              palette colors
            </div>
          </div>
        </div>

        {/* Bottom: palette strip */}
        <div
          style={{
            display: "flex",
            height: 80,
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid #232327",
          }}
        >
          {palette.map((c, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                backgroundColor: c,
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
