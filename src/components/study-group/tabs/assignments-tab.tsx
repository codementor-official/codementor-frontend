"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { ReviewModal, type ReviewComment } from "@/components/study-group/review-modal";
import { SubmissionsTable } from "@/components/study-group/submissions-table";
import {
  formatDueDate,
  isOverdue,
  summarizeAssignments,
} from "@/lib/study-group/group-detail-meta";
import type {
  Assignment,
  GroupExercise,
  GroupMember,
  ReviewStatus,
} from "@/types/study-group-detail";

function StatStrip({ stats }: { stats: { label: string; value: number; alert?: boolean }[] }) {
  return (
    <Card className="mb-4 flex flex-wrap divide-y divide-border-soft sm:divide-x sm:divide-y-0">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-1 items-baseline gap-2 px-4 py-2.5">
          <span className={`text-lg font-bold ${s.alert && s.value > 0 ? "text-primary" : "text-navy"}`}>
            {s.value}
          </span>
          <span className="text-xs text-text-muted">{s.label}</span>
        </div>
      ))}
    </Card>
  );
}

export function AssignmentsTab({
  groupId,
  exercises,
  members,
  assignments: initialAssignments,
}: {
  groupId: string;
  exercises: GroupExercise[];
  members: GroupMember[];
  assignments: Assignment[];
}) {
  const [assignments, setAssignments] = useState(initialAssignments);
  // Seeded from each assignment's existing feedback so the modal opens with history.
  const [comments, setComments] = useState<Record<string, ReviewComment[]>>(() => {
    const map: Record<string, ReviewComment[]> = {};
    for (const a of initialAssignments) {
      if (a.feedback) {
        map[a.id] = [
          { id: `${a.id}-seed`, author: "Bạn", body: a.feedback, at: "Trước đó", outcome: a.reviewStatus },
        ];
      }
    }
    return map;
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(exercises[0]?.id ?? null);
  const [reviewing, setReviewing] = useState<Assignment | null>(null);

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const stats = useMemo(() => summarizeAssignments(assignments), [assignments]);
  const commentCounts = useMemo(
    () => Object.fromEntries(Object.entries(comments).map(([id, list]) => [id, list.length])),
    [comments],
  );

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

  const submitReview = (assignmentId: string, body: string, outcome: ReviewStatus) => {
    setComments((prev) => ({
      ...prev,
      [assignmentId]: [
        ...(prev[assignmentId] ?? []),
        { id: `${assignmentId}-${Date.now()}`, author: "Bạn", body, at: "Vừa xong", outcome },
      ],
    }));
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? { ...a, feedback: body, reviewStatus: outcome, status: outcome === "approved" ? "done" : a.status }
          : a,
      ),
    );
    setReviewing(null);
  };

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
        {/* Assigning happens in the Bài tập tab, per exercise — this only points there
         * instead of being a second, competing entry point. */}
        <Button size="sm" variant="outline" href={`/workspace/${groupId}?tab=exercises`}>
          <Send className="h-3.5 w-3.5" /> Phân công ở tab Bài tập
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
                  <div className="border-t border-border-soft">
                    <SubmissionsTable
                      rows={rows}
                      memberById={memberById}
                      commentCounts={commentCounts}
                      onReview={setReviewing}
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ReviewModal
        assignment={reviewing}
        member={reviewing ? memberById.get(reviewing.memberId) : undefined}
        exercise={reviewing ? exerciseById.get(reviewing.exerciseId) : undefined}
        comments={reviewing ? (comments[reviewing.id] ?? []) : []}
        onClose={() => setReviewing(null)}
        onSubmit={submitReview}
      />
    </div>
  );
}
