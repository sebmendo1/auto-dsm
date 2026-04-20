"use client";

import * as React from "react";
import { useBrandStore } from "@/stores/brand";
import type { BrandProfile } from "@/lib/brand/types";

/**
 * Hydrates the client-side brand store with a server-fetched BrandProfile.
 * Place this near the top of a server layout and pass the profile in.
 */
export function BrandProvider({
  profile,
  repoSlug,
  children,
}: {
  profile: BrandProfile | null;
  repoSlug: string | null;
  children: React.ReactNode;
}) {
  const setProfile = useBrandStore((s) => s.setProfile);
  React.useEffect(() => {
    setProfile(profile, repoSlug);
  }, [profile, repoSlug, setProfile]);
  return <>{children}</>;
}
