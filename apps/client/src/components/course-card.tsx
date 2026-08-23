import { Check } from "lucide-react";
import { EntityCard, type EntityCardStat } from "@/components/entity-card";
import type { Difficulty } from "@/components/ui/badge";
import { placeholderCoverUrl } from "@/lib/placeholder-image";

const tileVariantMap = {
  navy: "ink",
  accent: "accent",
  primary: "primary",
} as const;

/** Auto-derives a "Mới" eyebrow badge from the `updated` copy unless one is explicitly passed. */
function recentEyebrow(updated?: string) {
  return updated && /hôm qua|hôm nay|\b[12] ngày/.test(updated) ? "Mới" : undefined;
}

export interface CourseCardProps {
  tile: string;
  tileVariant?: keyof typeof tileVariantMap;
  /** Small pill overlaid top-left on the tile, e.g. "MỚI" — see `EntityCard`. */
  eyebrow?: string;
  title: string;
  desc: string;
  difficulty: Difficulty;
  tags?: string[];
  /** e.g. { label: "chương", value: 3 }, { label: "bài học", value: 12 } */
  stats?: EntityCardStat[];
  /** Shows a small "Hoàn thành" check badge — the only learning-status signal this card carries. */
  completed?: boolean;
  updated?: string;
  href?: string;
  /** Optional mock/CMS artwork; falls back to the stable generated cover. */
  coverImage?: string;
}

/**
 * Thumbnail-forward course tile: big cover image, title is the loudest thing on it, no
 * progress bar or in-card CTA — resuming/enrolling lives on the course detail page, which
 * `href` already points at.
 */
export function CourseCard({
  tile,
  tileVariant = "navy",
  eyebrow,
  title,
  desc,
  difficulty,
  tags = [],
  stats = [],
  completed = false,
  updated,
  href,
  coverImage,
}: CourseCardProps) {
  return (
    <EntityCard
      tile={tile}
      tileVariant={tileVariantMap[tileVariant]}
      tileHeight="lg"
      eyebrow={eyebrow ?? recentEyebrow(updated)}
      coverImage={coverImage ?? placeholderCoverUrl(title)}
      title={title}
      description={desc}
      difficulty={difficulty}
      tags={tags}
      stats={stats}
      badge={
        completed ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary-tint px-2 py-0.5 text-2xs font-bold text-primary">
            <Check className="h-3 w-3" /> Hoàn thành
          </span>
        ) : undefined
      }
      href={href}
    />
  );
}
