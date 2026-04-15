import { Link } from "react-router-dom";
import { Palette, Type, Ruler, Github } from "lucide-react";

const features = [
  {
    title: "Colors",
    description: "Auto-detect your color palettes from CSS and Tailwind.",
    icon: Palette,
  },
  {
    title: "Typography",
    description: "Extract font sizes, weights, and families automatically.",
    icon: Type,
  },
  {
    title: "Spacing",
    description: "Visualize your spacing scale from tokens.",
    icon: Ruler,
  },
];

const steps = [
  {
    title: "Connect",
    body: "Connect your GitHub repository.",
  },
  {
    title: "Parse",
    body: "We extract tokens from your code.",
  },
  {
    title: "View",
    body: "See your design system instantly.",
  },
];

export function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex max-w-4xl flex-col items-center gap-12 px-6 py-24 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background-elevated">
          <span className="text-sm font-semibold">A</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Connect your repo. See your design tokens.
          </h1>
          <p className="text-lg text-foreground-secondary">
            Auto-extract colors, typography, and spacing from your codebase. No setup.
            No maintenance.
          </p>
        </div>
        <Link to="/login" className="btn-primary inline-flex items-center gap-2">
          <Github className="h-4 w-4" />
          Sign in with GitHub
        </Link>

        <div className="w-full border-t border-border" />

        <section className="grid w-full gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-background-elevated p-6 text-left"
            >
              <feature.icon className="h-5 w-5" />
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-foreground-secondary">
                {feature.description}
              </p>
            </div>
          ))}
        </section>

        <div className="w-full border-t border-border" />

        <section className="w-full space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-tertiary">
            How it works
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-border bg-background-elevated p-6">
                <p className="text-xs text-foreground-tertiary">Step {index + 1}</p>
                <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-foreground-secondary">{step.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
