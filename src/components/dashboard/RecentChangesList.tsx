export type RecentChangeItem = {
  id: string;
  title: string;
  timeLabel: string;
};

type RecentChangesListProps = {
  items: RecentChangeItem[];
};

/** Recent activity list with dividers. */
export function RecentChangesList({ items }: RecentChangesListProps) {
  return (
    <div className="rounded-delicate border border-border bg-background-elevated px-4 py-4 shadow-sm sm:px-5 sm:py-5 dark:shadow-none">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-content-faint">
        Recent changes
      </p>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-foreground-secondary">No recent activity yet.</p>
      ) : (
        <ul className="mt-3 list-none divide-y divide-border p-0">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <span className="min-w-0 truncate text-sm text-foreground">{item.title}</span>
              <span className="shrink-0 text-xs tabular-nums text-foreground-secondary">
                {item.timeLabel}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
