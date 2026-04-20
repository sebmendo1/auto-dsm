import { createBrowserClient } from "@supabase/ssr";
import { requireSupabasePublicConfig } from "./env";

export function createClient() {
  const { url, key } = requireSupabasePublicConfig();
  return createBrowserClient(url, key);
}
