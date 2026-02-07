import Link from "next/link";
import { Github, Sparkles } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background-elevated p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-tertiary">
            <Sparkles className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Welcome to AutoDSM</h1>
            <p className="text-sm text-foreground-tertiary">
              Connect your GitHub repo and surface your design tokens.
            </p>
          </div>
        </div>
        <Link href="/dashboard" className="btn-primary mt-6 w-full justify-center">
          <Github className="h-4 w-4" />
          Sign in with GitHub
        </Link>
        <p className="mt-6 text-xs text-foreground-tertiary">
          By continuing, you agree to our terms and privacy policy.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex text-xs text-foreground-secondary hover:text-foreground"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
