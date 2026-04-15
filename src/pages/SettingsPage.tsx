import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemePreference } from "@/theme/constants";

const options: { value: ThemePreference; label: string; hint: string }[] = [
  { value: "light", label: "Light", hint: "Always use light appearance" },
  { value: "dark", label: "Dark", hint: "Always use dark appearance" },
  { value: "system", label: "System", hint: "Match device setting" },
];

export function SettingsPage() {
  const { preference, setPreference } = useTheme();

  return (
    <div className="space-y-10">
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs tracking-wide text-content-muted transition-colors hover:text-content-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-content-primary">Settings</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-content-muted">
          Appearance and preferences. More options will appear here as the product grows.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-content-faint">
            Appearance
          </h2>
          <p className="mt-1 text-sm text-content-muted">Choose how AutoDSM looks on this device.</p>
        </div>
        <div className="grid gap-2 sm:max-w-md">
          {options.map((opt) => {
            const selected = preference === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPreference(opt.value)}
                className={`rounded-delicate border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus ${
                  selected
                    ? "border-brand bg-brand-soft"
                    : "border-hairline bg-surface-card/60 hover:border-well-border"
                }`}
              >
                <p className="text-sm font-medium text-content-primary">{opt.label}</p>
                <p className="mt-0.5 text-xs text-content-muted">{opt.hint}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-delicate border border-hairline bg-surface-card/40 px-4 py-4">
        <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-content-faint">
          Coming soon
        </h2>
        <p className="mt-2 text-sm text-content-muted">
          GitHub connection, notifications, and workspace defaults.
        </p>
      </section>
    </div>
  );
}
