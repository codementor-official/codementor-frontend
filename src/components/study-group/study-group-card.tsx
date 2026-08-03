import { Crown, UsersRound } from "lucide-react";
import { EntityCard } from "@/components/entity-card";
import { AvatarGroup } from "@/components/ui/avatar-group";
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
 *
 * The invite code and the progress bar are deliberately absent: a code is an action
 * you go looking for (it lives in Cài đặt), and a single group-progress number said
 * little while costing a whole row. Who's in the group says more at a glance.
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
      stats={[{ label: "bài tập đang mở", value: group.openTaskCount }]}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <AvatarGroup items={group.memberPreview} total={group.memberCount} size="sm" />
          <span className="shrink-0">{formatRelativeTime(group.lastActiveMinutesAgo)}</span>
        </div>
      }
      href={`/workspace/${group.id}`}
    />
  );
}
