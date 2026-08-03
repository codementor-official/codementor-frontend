import { BookOpen } from "lucide-react";
import { EntityCard } from "@/components/entity-card";
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
  participants?: string;
  updated?: string;
  progress?: number;
  href?: string;
  /** Optional mock/CMS artwork; falls back to the stable generated cover. */
  coverImage?: string;
}

/**
 * Thin wrapper around `EntityCard` — kept for call-site compatibility (dashboard, practice,
 * explore all import `CourseCard` directly). See `entity-card.tsx` for the shared implementation.
 */
export function CourseCard({
  tile,
  tileVariant = "navy",
  eyebrow,
  title,
  desc,
  difficulty,
  tags = [],
  participants,
  updated,
  progress,
  href,
  coverImage,
}: CourseCardProps) {
  return (
    <EntityCard
      tile={tile}
      tileVariant={tileVariantMap[tileVariant]}
      eyebrow={eyebrow ?? recentEyebrow(updated)}
      coverImage={coverImage ?? placeholderCoverUrl(title)}
      kind={{ icon: BookOpen, label: "Khóa học" }}
      title={title}
      description={desc}
      difficulty={difficulty}
      tags={tags}
      progress={progress}
      href={href}
      footer={
        (participants || updated) && (
          <>
            <span>{participants ? `${participants} học viên` : ""}</span>
            <span>{updated}</span>
          </>
        )
      }
    />
  );
}
