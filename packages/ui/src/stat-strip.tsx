export interface Stat {
  label: string;
  value: string | number;
}

/**
 * Page-level numbers, in one row.
 *
 * The wall this replaces cost ~530px above the fold on the dashboard — a banner with
 * highlight tiles, a grid of stat cards, and a callout — before the first piece of content
 * the user opened the app for. A strip costs one row.
 *
 * At most one per page, directly under the PageHeader. A number belongs here only if it is
 * computed from real data *and* actionable; hardcoded figures are decoration, and
 * decoration gets deleted rather than styled. Per-entity metadata belongs on the entity's
 * card instead — this is not a place to park what had nowhere else to go.
 */
export function StatStrip({ stats, className = "" }: { stats: Stat[]; className?: string }) {
  if (stats.length === 0) return null;

  return (
    <dl
      className={`flex flex-wrap items-baseline gap-x-6 gap-y-1.5 border-y border-border py-2.5 ${className}`}
    >
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={`flex items-baseline gap-2 ${index > 0 ? "sm:border-l sm:border-border sm:pl-6" : ""}`}
        >
          <dt className="text-xs text-muted-foreground">{stat.label}</dt>
          <dd className="text-sm font-bold text-foreground">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
