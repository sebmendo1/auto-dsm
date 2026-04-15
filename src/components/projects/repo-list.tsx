import { RepoItem } from "@/components/projects/repo-item";
import { Skeleton } from "@/components/ui/skeleton";

const repos = [
  {
    name: "portfolio-site",
    visibility: "Public" as const,
    updated: "Updated 1 week ago",
  },
  {
    name: "design-system",
    visibility: "Public" as const,
    updated: "Updated 3 weeks ago",
  },
];

type RepoListProps = {
  selectedRepo: string | null;
  onSelect: (repoName: string) => void;
  state?: "ready" | "loading" | "empty" | "error";
};

export function RepoList({ selectedRepo, onSelect, state = "ready" }: RepoListProps) {
  if (state === "loading") {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="rounded-lg border border-border bg-background px-4 py-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div className="rounded-lg border border-border bg-background px-4 py-6 text-center">
        <p className="text-sm font-medium">No repositories found</p>
        <p className="mt-1 text-xs text-foreground-tertiary">
          We couldn&apos;t find any public repositories in your GitHub account.
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-lg border border-border bg-background px-4 py-6 text-center">
        <p className="text-sm font-medium">Couldn&apos;t load repositories</p>
        <p className="mt-1 text-xs text-foreground-tertiary">
          There was a problem accessing GitHub. Please try again.
        </p>
        <button className="btn-secondary mt-4">Try Again</button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {repos.map((repo) => (
        <RepoItem
          key={repo.name}
          name={repo.name}
          visibility={repo.visibility}
          updated={repo.updated}
          selected={selectedRepo === repo.name}
          onSelect={() => onSelect(repo.name)}
        />
      ))}
    </div>
  );
}
