import { Crown, UsersRound } from "lucide-react";
import { EntityCard } from "@/components/entity-card";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { Badge } from "@/components/ui/badge";
import {
  ROLE_LABEL,
  formatRelativeTime,
  isOwned,
} from "@/lib/study-group/study-group-stats";
import type { StudyGroup } from "@/types/study-group";

/** Group type at a glance — a crown for groups you run, a people icon for ones you joined.
 * Reinforces the section split so a card still reads correctly out of context (search results). */
const GROUP_TYPE = {
  owned: { icon: Crown, label: "Nhóm bạn quản lý" },
  joined: { icon: UsersRound, label: "Nhóm đã tham gia" },
  guest: { icon: UsersRound, label: "Nhóm công khai" },
} as const;

/**
 * Thin wrapper around `EntityCard` — same card anatomy as roadmaps/courses so the
 * whole app has one "browse this thing" grid.
 *
 * Invite code remains in Settings; operational counts come from the Workspace read
 * model so the card never falls back to placeholder progress.
 */
export function StudyGroupCard({
  group,
  onRequestJoin,
}: {
  group: StudyGroup;
  onRequestJoin?: (group: StudyGroup) => void;
}) {
  const owned = isOwned(group);
  const guest = group.role === "guest";
  return (
    <EntityCard
      tile={group.tile}
      // Ink for every group: principle #11 keeps orange for meaning, so a grid of
      // tiles must not become a block of brand colour. Role is carried by the badge.
      tileVariant="ink"
      tileHeight={
        group.coverHeight === "compact"
          ? "sm"
          : group.coverHeight === "tall"
            ? "lg"
            : "md"
      }
      coverImage={group.coverUrl ?? undefined}
      coverFit={group.coverFit}
      coverPosition={group.coverPosition}
      kind={GROUP_TYPE[guest ? "guest" : owned ? "owned" : "joined"]}
      title={group.name}
      description={group.description}
      badge={
        <span className="flex items-center gap-1.5">
          <Badge tone={owned ? "brown" : "neutral"}>
            {ROLE_LABEL[group.role]}
          </Badge>
          {group.unreadCount > 0 && (
            <span className="notification-badge flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-2xs font-bold">
              {group.unreadCount > 99 ? "99+" : group.unreadCount}
            </span>
          )}
        </span>
      }
      tags={[group.topic]}
      stats={[
        { label: "thành viên", value: group.memberCount },
        { label: "bài đang mở", value: group.openTaskCount },
        { label: "hoàn thành", value: `${group.progressPercent}%` },
      ]}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <AvatarGroup
            items={group.memberPreview}
            total={group.memberCount}
            size="sm"
          />
          <span className="shrink-0">
            {formatRelativeTime(group.lastActiveMinutesAgo)}
          </span>
        </div>
      }
      action={
        guest ? (
          <button
            type="button"
            className="w-full rounded-md bg-navy px-3 py-2 text-xs font-semibold text-on-ink hover:bg-navy/90"
            onClick={() => onRequestJoin?.(group)}
          >
            Gửi yêu cầu tham gia
          </button>
        ) : undefined
      }
      href={`/workspace/${group.id}`}
    />
  );
}
