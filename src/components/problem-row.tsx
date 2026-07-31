import Link from "next/link";
import { DifficultyBadge, type Difficulty } from "@/components/ui/badge";

const tileVariantClasses = {
  navy: "bg-navy",
  accent: "bg-accent",
  primary: "bg-primary",
} as const;

export function ProblemRow({
  tile,
  tileVariant = "navy",
  title,
  meta,
  difficulty,
  href,
}: {
  tile: string;
  tileVariant?: keyof typeof tileVariantClasses;
  title: string;
  meta: string;
  difficulty?: Difficulty;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3.5 border-t border-border-soft px-4 py-3 first:border-t-0 hover:bg-bg"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold text-white ${tileVariantClasses[tileVariant]}`}
      >
        {tile}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-navy">{title}</div>
        <div className="text-xs text-text-faint">{meta}</div>
      </div>
      {difficulty && <DifficultyBadge difficulty={difficulty} />}
    </Link>
  );
}
