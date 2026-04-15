/** Fired after same-tab updates to autodsm:* persisted data (tokens, repo, components). */
export function notifyAppDataUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("autodsm:updated"));
}
