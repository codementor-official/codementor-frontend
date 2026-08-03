"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  REVIEW_STATUS_META,
  SUBMISSION_STATUS_META,
  formatDueDate,
  isOverdue,
  summarizeAssignments,
} from "@/lib/study-group/group-detail-meta";
import type { Assignment, GroupExercise, GroupMember } from "@/types/study-group-detail";

function StatStrip({ stats }: { stats: { label: string; value: number; alert?: boolean }[] }) {
  return (
    <Card className="mb-4 flex flex-wrap divide-y divide-border-soft sm:divide-x sm:divide-y-0">
      {stats.map((s) => (
        <div key={s.label} className="flex-1 px-4 py-3">
          <div className={`text-xl font-bold ${s.alert && s.value > 0 ? "text-primary" : "text-navy"}`}>
            {s.value}
          </div>
          <div className="text-xs text-text-muted">{s.label}</div>
        </div>
      ))}
    </Card>
  );
}

export function AssignmentsTab({
  exercises,
  members,
  assignments,
}: {
  exercises: GroupExercise[];
  members: GroupMember[];
  assignments: Assignment[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(exercises[0]?.id ?? null);

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const stats = useMemo(() => summarizeAssignments(assignments), [assignments]);

  const query = search.trim().toLowerCase();
  const groups = useMemo(
    () =>
      exercises
        .map((exercise) => {
          const rows = assignments
            .filter((a) => a.exerciseId === exercise.id)
            .filter((a) => status === "all" || a.status === status)
            .filter((a) => {
              if (!query) return true;
              const member = memberById.get(a.memberId);
              return `${exercise.title} ${member?.name ?? ""}`.toLowerCase().includes(query);
            });
          return { exercise, rows };
        })
        .filter((g) => g.rows.length > 0),
    [exercises, assignments, status, query, memberById],
  );

  return (
    <div>
      <StatStrip
        stats={[
          { label: "Nhiệm vụ đã giao", value: stats.assignedTotal },
          { label: "Nộp trễ hạn", value: stats.lateCount, alert: true },
          { label: "Nộp nhiều lần chưa đạt", value: stats.repeatedFailCount, alert: true },
          { label: "Chưa thực hiện", value: stats.notStartedCount, alert: true },
        ]}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo bài tập hoặc thành viên..."
          className="h-9 min-w-48 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-navy outline-none placeholder:text-text-faint focus:border-navy"
        />
        <Select
          label="Trạng thái"
          shape="box"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "Mọi trạng thái" },
            { value: "notstarted", label: "Chưa bắt đầu" },
            { value: "inprogress", label: "Đang làm" },
            { value: "done", label: "Hoàn thành" },
            { value: "late", label: "Quá hạn" },
          ]}
        />
        <Button size="sm">
          <Send className="h-3.5 w-3.5" /> Phân công bài tập
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <p className="text-sm font-semibold text-navy">Không có nhiệm vụ nào khớp bộ lọc</p>
          <p className="mt-1 text-xs text-text-faint">Thử đổi từ khóa hoặc bỏ bớt bộ lọc trạng thái.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map(({ exercise, rows }) => {
            const isOpen = expanded === exercise.id;
            const doneCount = rows.filter((r) => r.status === "done").length;
            const overdue = isOverdue(exercise.dueAt);
            return (
              <Card key={exercise.id} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : exercise.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-bg"
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-text-faint" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-text-faint" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-navy">{exercise.title}</div>
                    <div className="text-xs text-text-faint">
                      <span className={overdue ? "font-semibold text-primary" : ""}>
                        Hạn {formatDueDate(exercise.dueAt)}
                      </span>{" "}
                      · {doneCount}/{rows.length} đã hoàn thành
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <ul className="divide-y divide-border-soft border-t border-border-soft">
                    {rows.map((assignment) => {
                      const member = memberById.get(assignment.memberId);
                      const statusMeta = SUBMISSION_STATUS_META[assignment.status];
                      const reviewMeta = REVIEW_STATUS_META[assignment.reviewStatus];
                      const last = assignment.submissions.at(-1);
                      return (
                        <li key={assignment.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-2xs font-semibold text-white">
                            {member?.initials ?? "?"}
                          </span>
                          <div className="min-w-40 flex-1">
                            <div className="truncate text-sm font-medium text-navy">
                              {member?.name ?? "Thành viên đã rời nhóm"}
                            </div>
                            <div className="text-xs text-text-faint">
                              {last
                                ? `Nộp lần ${last.version} · ${last.submittedAt} · ${last.detail}`
                                : "Chưa nộp lần nào"}
                            </div>
                          </div>
                          <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                          <Badge tone={reviewMeta.tone}>{reviewMeta.label}</Badge>
                          <Button size="sm" variant="outline">
                            Đánh giá
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
