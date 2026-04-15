import { useState } from "react";
import { RepoList } from "@/components/projects/repo-list";

export function ConnectRepoPanel() {
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  return (
    <div className="rounded-2xl border border-border bg-background-elevated p-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">Connect your first repository</h3>
        <p className="text-sm text-foreground-secondary">
          We’ll scan for globals.css and Tailwind config files to build your design
          token system.
        </p>
      </div>
      <div className="mt-6">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/60"
          placeholder="Search repositories"
        />
      </div>
      <div className="mt-4">
        <RepoList selectedRepo={selectedRepo} onSelect={setSelectedRepo} />
      </div>
    </div>
  );
}
