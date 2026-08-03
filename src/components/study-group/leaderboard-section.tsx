"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MemberAchievementsModal } from "@/components/study-group/member-achievements-modal";
import { XpRankingCard } from "@/components/study-group/xp-ranking-card";
import { rankMembers } from "@/lib/study-group/group-detail-meta";
import type { GroupMember } from "@/types/study-group-detail";

/** Order is 2nd, 1st, 3rd so the winner stands in the middle, on the tallest step. */
const PODIUM_LAYOUT = [
  { rank: 2, height: "h-12", step: "border-border bg-bg" },
  { rank: 1, height: "h-20", step: "border-primary bg-primary-tint" },
  { rank: 3, height: "h-8", step: "border-border bg-bg" },
] as const;

function Podium({ ranked, onOpen }: { ranked: GroupMember[]; onOpen: (m: GroupMember) => void }) {
  const top = PODIUM_LAYOUT.map((step) => ({ ...step, member: ranked[step.rank - 1] })).filter(
    (s) => s.member,
  );
  if (top.length === 0) return null;

  return (
    <Card className="px-5 pt-4">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-navy">Bảng xếp hạng</h3>
        <span className="text-xs text-text-faint">Theo XP tích lũy trong nhóm</span>
      </div>

      <div className="flex items-end justify-center gap-2 sm:gap-4">
        {top.map(({ rank, height, step, member }) => (
          <div key={rank} className="flex w-full max-w-40 flex-col items-center">
            <span
              className={`mb-1.5 flex items-center justify-center rounded-full bg-navy font-semibold text-white ${
                rank === 1 ? "h-12 w-12 text-sm" : "h-10 w-10 text-xs"
              }`}
            >
              {member.initials}
            </span>
            <span className="line-clamp-2 text-center text-xs font-semibold text-navy">{member.name}</span>
            <span className="mt-0.5 text-center text-2xs text-text-faint">
              {member.xp.toLocaleString("vi-VN")} XP · {member.solvedCount} bài
            </span>
            <button
              type="button"
              onClick={() => onOpen(member)}
              className="mt-1 mb-2 text-2xs font-semibold text-primary hover:underline"
            >
              Thành tích
            </button>
            {/* The step itself carries the rank, so the podium reads as a podium. */}
            <div
              className={`flex w-full items-start justify-center rounded-t-md border border-b-0 pt-1.5 ${height} ${step}`}
            >
              <span className={`text-sm font-bold ${rank === 1 ? "text-primary" : "text-text-faint"}`}>
                {rank}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Podium + full standings, side by side. Owns the achievements modal both open. */
export function LeaderboardSection({ members }: { members: GroupMember[] }) {
  const [detailMember, setDetailMember] = useState<GroupMember | null>(null);
  const ranked = useMemo(() => rankMembers(members), [members]);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Podium ranked={ranked} onOpen={setDetailMember} />
        <XpRankingCard ranked={ranked} />
      </div>
      <MemberAchievementsModal member={detailMember} onClose={() => setDetailMember(null)} />
    </>
  );
}
