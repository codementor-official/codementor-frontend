import Link from "next/link";
import { CalendarDays, KeyRound, Sparkles, Target, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ROLE_LABEL, formatRelativeTime } from "@/lib/study-group/study-group-stats";
import { rankMembers } from "@/lib/study-group/group-detail-meta";
import { SubmissionChart } from "@/components/study-group/submission-chart";
import type { StudyGroup } from "@/types/study-group";
import type { GroupDetail } from "@/types/study-group-detail";

function MetaItem({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-faint" />
      <div className="min-w-0">
        <div className="text-2xs font-bold tracking-wide text-text-faint uppercase">{label}</div>
        <div className="truncate text-sm font-medium text-navy">{value}</div>
      </div>
    </div>
  );
}

export function OverviewTab({
  group,
  detail,
}: {
  group: StudyGroup;
  detail: GroupDetail;
}) {
  const ranked = rankMembers(detail.members);
  const publishedExercises = detail.exercises.filter((e) => e.status === "published").length;
  const pendingDocs = detail.documents.filter((d) => d.status === "pending").length;

  return (
    <div className="flex flex-col gap-5">
      {/* Identity first: who this group is, what it's working on, who's in it. */}
      <Card className="overflow-hidden">
        <div className="flex h-28 items-center justify-center bg-navy sm:h-32">
          <span className="font-mono text-3xl font-bold text-white">{group.tile}</span>
        </div>
        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-navy">{group.name}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-muted">{group.description}</p>
            </div>
            <Badge tone={group.role === "owner" ? "brown" : "neutral"}>{ROLE_LABEL[group.role]}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border-soft pt-4 lg:grid-cols-4">
            <MetaItem icon={Target} label="Đang học" value={detail.currentTopic} />
            <MetaItem icon={Users} label="Thành viên" value={`${detail.members.length} người`} />
            <MetaItem icon={CalendarDays} label="Ngày tạo" value={detail.createdAt} />
            <MetaItem icon={KeyRound} label="Mã mời" value={group.code} />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-navy">Thành viên</h3>
          <Link
            href={`/workspace/${group.id}?tab=members`}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Xem tất cả →
          </Link>
        </div>
        <ul className="flex flex-col gap-3">
          {ranked.slice(0, 5).map((member) => (
            <li key={member.id} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-2xs font-semibold text-white">
                {member.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-navy">{member.name}</span>
                  {member.role !== "member" && (
                    <span className="shrink-0 text-2xs font-semibold text-text-faint">
                      {ROLE_LABEL[member.role]}
                    </span>
                  )}
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-border-soft">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${member.progressPercent}%` }} />
                </div>
              </div>
              <span className="shrink-0 text-xs text-text-faint">
                {formatRelativeTime(member.lastActiveMinutesAgo)}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Numbers come after identity. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-bold text-navy">Tiến độ nhóm</h3>
            <ProgressBar value={group.progressPercent} />
            <dl className="mt-4 flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-text-muted">Bài tập đã công bố</dt>
                <dd className="font-semibold text-navy">{publishedExercises}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Bài tập đang mở</dt>
                <dd className="font-semibold text-navy">{group.openTaskCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Tài liệu chờ duyệt</dt>
                <dd className="font-semibold text-navy">{pendingDocs}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-bold text-navy">Hoạt động gần đây</h3>
            <ul className="flex flex-col gap-2.5">
              {detail.activities.map((a) => (
                <li key={a.id} className="flex gap-2 text-xs leading-relaxed">
                  <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-text-faint" />
                  <span className="text-text">
                    <span className="font-semibold text-navy">{a.actor}</span> {a.action}{" "}
                    <span className="text-text-faint">· {formatRelativeTime(a.minutesAgo)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* The chart gets its own full-width row at the bottom: 7 bars squeezed into a
       * third of the width were cramped, and it's the least at-a-glance thing here. */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-navy">Lượt nộp bài 7 ngày qua</h3>
        <p className="mt-0.5 mb-4 text-xs text-text-faint">Tổng số lượt nộp của cả nhóm mỗi ngày.</p>
        <SubmissionChart data={detail.submissionTrend} />
      </Card>
    </div>
  );
}
