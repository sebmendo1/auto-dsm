import { Link } from "react-router-dom";
import { ArrowRight, Github, Layers, Scan, CheckCircle2 } from "lucide-react";

const steps = [
  {
    title: "Connect GitHub",
    description: "Authorize AutoDSM to access your repositories.",
    icon: Github,
  },
  {
    title: "Select a repo",
    description: "Choose the project with the design tokens you want to surface.",
    icon: Layers,
  },
  {
    title: "Parse tokens",
    description: "We scan globals.css and Tailwind config to build your system view.",
    icon: Scan,
  },
];

export function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-8 py-6">
        <Link to="/" className="text-sm font-semibold">
          AutoDSM
        </Link>
        <Link
          to="/"
          className="text-sm text-foreground-secondary hover:text-foreground"
        >
          Back to home
        </Link>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-8 pb-24">
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background-elevated px-3 py-1 text-xs text-foreground-secondary">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Onboarding
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Let’s connect your first repo.
          </h1>
          <p className="max-w-2xl text-lg text-foreground-secondary">
            We’ll walk you through GitHub auth, repo selection, and token parsing so
            you can see your design system instantly.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl border border-border bg-background-elevated p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-tertiary">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="text-xs text-foreground-tertiary">Step {index + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-foreground-secondary">
                {step.description}
              </p>
            </div>
          ))}
        </section>

        <section className="flex flex-wrap items-center gap-4">
          <Link to="/login" className="btn-primary inline-flex items-center gap-2">
            <Github className="h-4 w-4" />
            Connect GitHub
          </Link>
          <Link to="/dashboard" className="btn-secondary inline-flex items-center gap-2">
            Continue to dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
