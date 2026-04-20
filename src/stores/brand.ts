"use client";

import { create } from "zustand";
import type { BrandProfile } from "@/lib/brand/types";

interface BrandState {
  profile: BrandProfile | null;
  repoSlug: string | null; // "owner/name"
  setProfile: (profile: BrandProfile | null, repoSlug?: string | null) => void;
}

export const useBrandStore = create<BrandState>((set) => ({
  profile: null,
  repoSlug: null,
  setProfile: (profile, repoSlug = null) =>
    set({ profile, repoSlug: repoSlug ?? (profile ? `${profile.repo.owner}/${profile.repo.name}` : null) }),
}));
