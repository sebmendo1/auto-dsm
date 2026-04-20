// Public view for /radii. Re-exports the authenticated dashboard page.
// The layout wraps it in a doc-style shell without the sidebar. Both read
// from the shared Zustand brand store hydrated by BrandProvider.
export { default } from "@/app/dashboard/radii/page";
