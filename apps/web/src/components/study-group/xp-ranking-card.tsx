import { ListOrdered } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ROLE_LABEL } from "@/lib/study-group/study-group-stats";
import type { GroupMember } from "@/types/study-group-detail";

/**
 * The full standings, next to the podium. The podium shows the top three as a shape;
 * this answers "where am I" for everyone else.
 */
export function XpRankingCard({ ranked }: { ranked: GroupMember[] }) {
  return (
    <Card className="flex flex-col p-5">
      <div className="mb-3 flex items-center gap-2">
        <ListOrdered className="h-4 w-4 text-navy" />
        <h3 className="text-sm font-bold text-navy">Xếp hạng theo XP</h3>
        <span className="text-xs text-text-faint">{ranked.length} thành viên</span>
      </div>
      <ol className="flex max-h-64 flex-col gap-1 overflow-y-auto">
        {ranked.map((member, index) => (
          <li
            key={member.id}
            className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-bg"
          >
            <span
              className={`w-5 shrink-0 text-right font-mono text-xs font-bold ${
                index < 3 ? "text-primary" : "text-text-faint"
              }`}
            >
              {index + 1}
            </span>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-2xs font-semibold text-on-ink">
              {member.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-navy">{member.name}</span>
              <span className="block text-2xs text-text-faint">
                {ROLE_LABEL[member.role]} · {member.solvedCount} bài
              </span>
            </span>
            <span className="shrink-0 text-sm font-semibold text-navy">
              {member.xp.toLocaleString("vi-VN")}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
