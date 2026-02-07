import Link from "next/link";

type HeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
};

export function Header({ title, subtitle, actionLabel, actionHref, onAction }: HeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border px-8 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-foreground-tertiary">{subtitle}</p>
        ) : null}
      </div>
      {actionLabel ? (
        actionHref ? (
          <Link href={actionHref} className="btn-primary inline-flex items-center">
            {actionLabel}
          </Link>
        ) : (
          <button className="btn-primary" onClick={onAction}>
            {actionLabel}
          </button>
        )
      ) : null}
    </div>
  );
}
