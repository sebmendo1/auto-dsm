import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog } from "@/components/ui/dialog";
import { RepoList } from "@/components/projects/repo-list";

export function ConnectRepoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const navigate = useNavigate();
  const handleConnect = () => {
    if (!selectedRepo) return;
    onClose();
    navigate(`/dashboard/projects/${selectedRepo}?state=parsing`);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Connect Repository"
      description="Select a public repository to analyze for design tokens."
    >
      <div className="space-y-4">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/60"
          placeholder="Search repositories..."
        />
        <RepoList selectedRepo={selectedRepo} onSelect={setSelectedRepo} />
        <div className="flex justify-end">
          <button className="btn-primary" disabled={!selectedRepo} onClick={handleConnect}>
            Connect
          </button>
        </div>
      </div>
    </Dialog>
  );
}
