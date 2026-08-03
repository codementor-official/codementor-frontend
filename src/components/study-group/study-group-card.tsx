import { Crown, UsersRound } from "lucide-react";
import { EntityCard } from "@/components/entity-card";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL, formatRelativeTime, isOwned } from "@/lib/study-group/study-group-stats";
import type { StudyGroup } from "@/types/study-group";

/** Group type at a glance — a crown for groups you run, a people icon for ones you joined.
 * Reinforces the section split so a card still reads correctly out of context (search results). */
const GROUP_TYPE = {
  owned: { icon: Crown, label: "Nhóm bạn quản lý" },
  joined: { icon: UsersRound, label: "Nhóm đã tham gia" },
} as const;

/**
 * Thin wrapper around `EntityCard` — same card anatomy as roadmaps/courses so the
 * whole app has one "browse this thing" grid.
 */
export function StudyGroupCard({ group }: { group: StudyGroup }) {
  const owned = isOwned(group);
  return (
    <EntityCard
      tile={group.tile}
      // Ink for every group: principle #11 keeps orange for meaning, so a grid of
      // tiles must not become a block of brand colour. Role is carried by the badge.
      tileVariant="ink"
      tileHeight="sm"
      kind={GROUP_TYPE[owned ? "owned" : "joined"]}
      title={group.name}
      description={group.description}
      badge={<Badge tone={owned ? "brown" : "neutral"}>{ROLE_LABEL[group.role]}</Badge>}
      tags={[group.topic]}
      stats={[
        { label: "thành viên", value: group.memberCount },
        { label: "bài tập đang mở", value: group.openTaskCount },
      ]}
      progress={group.progressPercent}
      footer={
        <>
          <span className="truncate">
            {owned ? `Mã: ${group.code}` : `Chủ nhóm: ${group.ownerName}`}
          </span>
          <span className="shrink-0">{formatRelativeTime(group.lastActiveMinutesAgo)}</span>
        </>
      }
      href={`/workspace/${group.id}`}
    />
  );
}
