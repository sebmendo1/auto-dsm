import { Lock, Globe } from "lucide-react";

type RepoItemProps = {
  name: string;
  visibility: "Private" | "Public";
  updated: string;
  selected: boolean;
  onSelect: () => void;
};

export function RepoItem({ name, visibility, updated, selected, onSelect }: RepoItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
        selected
          ? "border-accent-blue bg-background-tertiary"
          : "border-border bg-background"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`h-3.5 w-3.5 rounded-full border ${selected ? "border-accent-blue" : "border-border"}`}>
          <span
            className={`block h-full w-full rounded-full ${
              selected ? "bg-accent-blue" : "bg-transparent"
            }`}
          />
        </span>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-foreground-tertiary">{updated}</p>
        </div>
      </div>
      <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-foreground-tertiary">
        {visibility === "Private" ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
        {visibility}
      </span>
    </button>
  );
}
