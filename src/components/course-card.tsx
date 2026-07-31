import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge, DifficultyBadge, type Difficulty } from "@/components/ui/badge";

const tileVariantClasses = {
  navy: "bg-navy",
  accent: "bg-accent",
  primary: "bg-primary",
} as const;

export interface CourseCardProps {
  tile: string;
  tileVariant?: keyof typeof tileVariantClasses;
  title: string;
  desc: string;
  difficulty: Difficulty;
  tags?: string[];
  participants?: string;
  updated?: string;
  progress?: number;
  href?: string;
}

export function CourseCard({
  tile,
  tileVariant = "navy",
  title,
  desc,
  difficulty,
  tags = [],
  participants,
  updated,
  progress,
  href,
}: CourseCardProps) {
  const content = (
    <Card className="flex h-full flex-col overflow-hidden">
      <div
        className={`flex h-20 shrink-0 items-center justify-center font-mono text-lg font-bold text-white ${tileVariantClasses[tileVariant]}`}
      >
        {tile}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-sm font-semibold text-navy">{title}</h3>
        <p className="text-xs leading-relaxed text-text-muted">{desc}</p>
        <div className="flex flex-wrap gap-1.5">
          <DifficultyBadge difficulty={difficulty} />
          {tags.map((t) => (
            <Badge key={t} tone="neutral">
              {t}
            </Badge>
          ))}
        </div>
        {typeof progress === "number" && (
          <div className="flex flex-col gap-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-border-soft">
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-semibold text-primary">Hoàn thành {progress}%</span>
          </div>
        )}
        {(participants || updated) && (
          <div className="mt-auto flex justify-between border-t border-border-soft pt-2.5 text-xs text-text-faint">
            <span>{participants ? `${participants} học viên` : ""}</span>
            <span>{updated}</span>
          </div>
        )}
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }
  return content;
}
