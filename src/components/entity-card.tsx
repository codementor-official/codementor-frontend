import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, DifficultyBadge, type Difficulty } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";

const tileVariantClasses = {
  ink: "bg-navy",
  accent: "bg-accent",
  primary: "bg-primary",
} as const;

export interface EntityCardStat {
  label: string;
  value: string | number;
}

export interface EntityCardProps {
  tile: string;
  tileVariant?: keyof typeof tileVariantClasses;
  /** Taller tile for browse-grid contexts (roadmaps/courses); shorter for compact tiles. */
  tileHeight?: "sm" | "md";
  eyebrow?: string;
  coverImage?: string;
  kind?: { icon: LucideIcon; label: string };
  title: string;
  description: string;
  difficulty?: Difficulty;
  badge?: ReactNode;
  tags?: string[];
  /** Right-of-title or footer metadata, e.g. { label: "học viên", value: "1.2k" }. */
  stats?: EntityCardStat[];
  progress?: number;
  /** Free-form note block (e.g. roadmap "matched reason"), rendered above the footer. */
  note?: string;
  /** Bordered footer row (e.g. participants/updated meta), pinned to the bottom of the card. */
  footer?: ReactNode;
  /** Standalone CTA link pinned to the bottom, independent of whole-card `href` (e.g. roadmap "Xem chi tiết"). */
  cta?: { label: string; href: string };
  /** When set, the entire card becomes a link (e.g. course tiles). Don't combine with `cta`. */
  href?: string;
}

export function EntityCard({
  tile,
  tileVariant = "ink",
  tileHeight = "md",
  eyebrow,
  coverImage,
  kind,
  title,
  description,
  difficulty,
  badge,
  tags = [],
  stats = [],
  progress,
  note,
  footer,
  cta,
  href,
}: EntityCardProps) {
  const content = (
    <Card interactive={Boolean(href)} className="flex h-full flex-col overflow-hidden">
      <div
        className={`relative flex shrink-0 items-center justify-center font-mono font-bold text-white ${
          coverImage ? "bg-border-soft" : tileVariantClasses[tileVariant]
        } ${tileHeight === "sm" ? "h-16 text-base" : "h-20 text-lg"}`}
      >
        {coverImage && (
          <Image
            src={coverImage}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 320px"
            className="object-cover"
          />
        )}
        {eyebrow && (
          <span className="absolute top-2 left-2 z-10 rounded-sm bg-white/90 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-navy uppercase">
            {eyebrow}
          </span>
        )}
        {coverImage ? (
          <span
            className={`absolute bottom-2 left-2 flex h-7 w-7 items-center justify-center rounded-full text-[10px] ring-2 ring-white ${tileVariantClasses[tileVariant]}`}
          >
            {tile}
          </span>
        ) : (
          tile
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {kind && (
          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-text-faint uppercase">
            <kind.icon className="h-3 w-3" /> {kind.label}
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-navy">{title}</h3>
          {badge}
        </div>
        <p className="line-clamp-2 text-xs leading-relaxed text-text-muted">{description}</p>
        {(difficulty || tags.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {difficulty && <DifficultyBadge difficulty={difficulty} />}
            {tags.map((t) => (
              <Badge key={t} tone="neutral">
                {t}
              </Badge>
            ))}
          </div>
        )}
        {stats.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-text-faint">
            {stats.map((s) => (
              <span key={s.label || String(s.value)}>
                {s.value}
                {s.label ? ` ${s.label}` : ""}
              </span>
            ))}
          </div>
        )}
        {note && (
          <p className="rounded-md bg-border-soft px-2.5 py-2 text-[11px] leading-relaxed text-text">{note}</p>
        )}
        {typeof progress === "number" && <ProgressBar value={progress} />}
        {footer && (
          <div className="mt-auto flex justify-between border-t border-border-soft pt-2.5 text-xs text-text-faint">
            {footer}
          </div>
        )}
        {cta && (
          <Link
            href={cta.href}
            className="mt-auto rounded-md bg-navy px-3.5 py-2 text-center text-xs font-semibold text-white hover:bg-navy/90"
          >
            {cta.label}
          </Link>
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
