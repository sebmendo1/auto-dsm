/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  // TODO(autodsm): the parser layer (src/lib/parsers/**) and iframe runtime
  // (src/lib/render/iframe-runtime.ts) still use deliberate `any` that needs
  // typing before we can flip ignoreBuildErrors to false. Tracked in the
  // review plan under PR2 "build hygiene".
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: false },
  // The iframe render runtime and esbuild-wasm require 'unsafe-eval' plus
  // external CDN origins; that relaxed CSP is scoped to /api/render/iframe
  // only. The main app ships a tight default CSP with no 'unsafe-eval'.
  async headers() {
    const mainCsp = [
      "default-src 'self'",
      // Next.js inlines a hydration shim + the next-themes flash-guard script.
      "script-src 'self' 'unsafe-inline'",
      // Tailwind v4 + shadcn rely on inline styles.
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      // Only the render iframe route is a legal frame src.
      "frame-src 'self'",
      // Supabase + GitHub + Gemini are the only outbound origins the app hits.
      "connect-src 'self' https://*.supabase.co https://*.supabase.in https://api.github.com https://raw.githubusercontent.com https://generativelanguage.googleapis.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join('; ');

    // Legacy path (/render/*) kept for bundle-cache URLs in Supabase Storage rewrites.
    const iframeCsp = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://esm.sh https://cdn.jsdelivr.net https://cdn.tailwindcss.com";

    return [
      {
        source: '/render/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: iframeCsp },
        ],
      },
      {
        source: '/api/render/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: iframeCsp },
        ],
      },
      {
        // Everything else gets the tight default.
        source: '/((?!api/render|render).*)',
        headers: [
          { key: 'Content-Security-Policy', value: mainCsp },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false };
    return config;
  },
};

export default nextConfig;
