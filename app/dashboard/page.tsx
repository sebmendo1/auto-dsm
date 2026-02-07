"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import { Header } from "@/components/layout/header";
import { parseRepoUrl } from "@/lib/parser/github";

export default function DashboardPage() {
  const router = useRouter();
  const [repoInput, setRepoInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = repoInput.trim();
    const parsed = parseRepoUrl(value);
    if (!parsed) {
      setError("Enter a public GitHub repo link or owner/name");
      return;
    }
    setError("");
    const slug = `${parsed.owner}-${parsed.repo}`;
    router.push(
      `/dashboard/brand/colors?state=parsing&repo=${encodeURIComponent(
        `${parsed.owner}/${parsed.repo}`,
      )}`,
    );
  };

  return (
    <div className="space-y-8">
      <Header
        title="Projects"
        subtitle="Paste a public GitHub repo to start extracting design tokens."
      />

      <section className="rounded-2xl border border-border bg-background-elevated p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-background-tertiary">
          <Package className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">No projects yet</h2>
        <p className="mt-2 text-sm text-foreground-secondary">
          Paste a public GitHub repository link to load colors and typography tokens.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col items-center gap-3">
          <input
            className="w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/60"
            placeholder="https://github.com/owner/repo"
            value={repoInput}
            onChange={(event) => setRepoInput(event.target.value)}
          />
          {error ? <p className="text-xs text-accent-red">{error}</p> : null}
          <button className="btn-primary">Load Repo & Parse</button>
        </form>
      </section>
    </div>
  );
}
