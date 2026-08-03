import Link from "next/link";
import { DifficultyBadge, type Difficulty } from "@/components/ui/badge";

const tileVariantClasses = {
  navy: "bg-navy",
  accent: "bg-accent",
  primary: "bg-primary",
} as const;

export interface ProblemRowStat {
  label: string;
  value: string | number;
}

export function ProblemRow({
  tile,
  tileVariant = "navy",
  title,
  meta,
  difficulty,
  stats,
  href,
}: {
  tile: string;
  tileVariant?: keyof typeof tileVariantClasses;
  title: string;
  meta: string;
  difficulty?: Difficulty;
  /** Right-aligned stat cluster, e.g. submission count / pass rate — rendered before the difficulty badge. */
  stats?: ProblemRowStat[];
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3.5 border-t border-border-soft px-4 py-3 first:border-t-0 hover:bg-bg focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-inset"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold text-on-ink ${tileVariantClasses[tileVariant]}`}
      >
        {tile}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-navy">{title}</div>
        <div className="text-xs text-text-faint">{meta}</div>
      </div>
      {stats && stats.length > 0 && (
        <div className="hidden shrink-0 items-center gap-4 text-xs text-text-faint sm:flex">
          {stats.map((s) => (
            <span key={s.label} className="text-right">
              {s.value}
              {s.label ? ` ${s.label}` : ""}
            </span>
          ))}
        </div>
      )}
      {difficulty && <DifficultyBadge difficulty={difficulty} />}
    </Link>
  );
}
