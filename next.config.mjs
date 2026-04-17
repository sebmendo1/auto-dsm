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
  // The iframe render runtime and esbuild-wasm require special headers for
  // SharedArrayBuffer-backed threads, but we intentionally run esbuild-wasm
  // single-threaded so we can avoid COOP/COEP isolation (which would break
  // Supabase auth popups). See docs/RENDERING.md for rationale.
  async headers() {
    return [
      {
        source: '/render/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://esm.sh https://cdn.jsdelivr.net https://cdn.tailwindcss.com" },
        ],
      },
      {
        source: '/api/render/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
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
