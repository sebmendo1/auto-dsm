"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { Header } from "@/components/layout/header";
import { ConnectRepoDialog } from "@/components/projects/connect-repo-dialog";

export default function DashboardPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-8">
      <Header
        title="Projects"
        subtitle="Connect a repository to start extracting design tokens."
        actionLabel="Connect Repo"
        onAction={() => setDialogOpen(true)}
      />

      <section className="rounded-2xl border border-border bg-background-elevated p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-background-tertiary">
          <Package className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">No projects yet</h2>
        <p className="mt-2 text-sm text-foreground-secondary">
          Connect your first repository to see your design tokens.
        </p>
        <button className="btn-primary mt-6" onClick={() => setDialogOpen(true)}>
          Connect Repository
        </button>
      </section>

      <ConnectRepoDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
