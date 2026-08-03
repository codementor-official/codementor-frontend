"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, RotateCcw, Search, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { SideDrawer } from "@/components/ui/side-drawer";
import { formatDueDate, isOverdue } from "@/lib/study-group/group-detail-meta";
import type { Assignment, GroupExercise } from "@/types/study-group-detail";

type MemberAssignmentState = "todo" | "inprogress" | "passed" | "failed" | "late" | "retry" | "locked";

function assignmentState(assignment: Assignment, exercise: GroupExercise): MemberAssignmentState {
  const latest = assignment.submissions.at(-1);
  const attempts = assignment.submissions.length;
  const limit = assignment.attemptLimit ?? 3;
  const overdue = isOverdue(exercise.dueAt);
  if (!latest) return overdue ? "late" : assignment.status === "inprogress" ? "inprogress" : "todo";
  if (latest.result === "Đạt") return "passed";
  if (overdue && !assignment.allowLateSubmission) return "late";
  return assignment.allowRetry !== false && attempts < limit ? "retry" : "locked";
}

const STATE_META: Record<MemberAssignmentState, { label: string; tone: "navy" | "primary" | "neutral" }> = {
  todo: { label: "Cần làm", tone: "neutral" },
  inprogress: { label: "Đang làm", tone: "navy" },
  passed: { label: "Đã đạt", tone: "navy" },
  failed: { label: "Chưa đạt", tone: "primary" },
  late: { label: "Quá hạn", tone: "primary" },
  retry: { label: "Có thể làm lại", tone: "primary" },
  locked: { label: "Hết lượt làm lại", tone: "primary" },
};

function scoreOf(assignment: Assignment) {
  const latest = assignment.submissions.at(-1);
  const best = Math.max(...assignment.submissions.map((submission) => submission.score ?? (submission.result === "Đạt" ? 100 : 0)), 0);
  return { best, latest: latest?.score ?? (latest?.result === "Đạt" ? 100 : latest ? 0 : null), latestSubmission: latest };
}

export function AssignmentMemberList({ assignments, exercises }: { assignments: Assignment[]; exercises: GroupExercise[] }) {
  const [quickFilter, setQuickFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [sort, setSort] = useState("due");
  const [selected, setSelected] = useState<{ assignment: Assignment; exercise: GroupExercise } | null>(null);
  const exerciseById = useMemo(() => new Map(exercises.map((exercise) => [exercise.id, exercise])), [exercises]);
  const rows = useMemo(() => assignments.flatMap((assignment) => {
    const exercise = exerciseById.get(assignment.exerciseId);
    return exercise ? [{ assignment, exercise, state: assignmentState(assignment, exercise) }] : [];
  }), [assignments, exerciseById]);
  const filtered = useMemo(() => rows
    .filter(({ exercise }) => `${exercise.title} ${exercise.topic}`.toLowerCase().includes(search.trim().toLowerCase()))
    .filter(({ exercise }) => difficulty === "all" || exercise.difficulty === difficulty)
    .filter(({ state }) => quickFilter === "all" || (quickFilter === "need" && ["todo", "inprogress"].includes(state)) || (quickFilter === "done" && state === "passed") || (quickFilter === "retry" && state === "retry") || (quickFilter === "late" && state === "late") || (quickFilter === "failed" && ["retry", "locked"].includes(state)))
    .sort((left, right) => {
      if (sort === "score") return scoreOf(right.assignment).best - scoreOf(left.assignment).best;
      if (sort === "recent") return (right.assignment.submissions.at(-1)?.submittedAt ?? "").localeCompare(left.assignment.submissions.at(-1)?.submittedAt ?? "");
      if (sort === "created") return (right.exercise.createdAt ?? "").localeCompare(left.exercise.createdAt ?? "");
      return (left.exercise.dueAt ?? "9999-12-31").localeCompare(right.exercise.dueAt ?? "9999-12-31");
    }), [rows, search, difficulty, quickFilter, sort]);

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {[
          ["all", "Tất cả"], ["need", "Cần làm"], ["done", "Đã hoàn thành"],
          ["failed", "Chưa đạt"], ["retry", "Làm lại"], ["late", "Quá hạn"],
        ].map(([value, label]) => <button key={value} type="button" onClick={() => setQuickFilter(value)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${quickFilter === value ? "border-navy bg-navy text-on-ink" : "border-border bg-surface text-text-muted hover:bg-bg"}`}>{label}</button>)}
      </div>
      <Card className="mb-4 flex flex-col gap-2 p-3 sm:flex-row">
        <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-border px-3"><Search className="h-4 w-4 text-text-faint" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm bài tập..." className="min-w-0 flex-1 bg-transparent text-sm text-navy outline-none placeholder:text-text-faint" /></label>
        <Select label="Độ khó" shape="box" value={difficulty} onChange={setDifficulty} options={[{ value: "all", label: "Mọi độ khó" }, { value: "Cơ bản", label: "Cơ bản" }, { value: "Trung bình", label: "Trung bình" }, { value: "Nâng cao", label: "Nâng cao" }]} />
        <Select label="Sắp xếp" shape="box" value={sort} onChange={setSort} options={[{ value: "due", label: "Hạn gần nhất" }, { value: "created", label: "Ngày tạo mới" }, { value: "score", label: "Điểm cao nhất" }, { value: "recent", label: "Lần làm gần nhất" }]} />
      </Card>

      {filtered.length === 0 ? <Card className="border-dashed p-10 text-center"><p className="font-semibold text-navy">Không có bài tập phù hợp</p><p className="mt-1 text-xs text-text-faint">Đổi bộ lọc hoặc từ khóa để xem các bài khác.</p></Card> : <div className="grid gap-3 lg:grid-cols-2">
        {filtered.map(({ assignment, exercise, state }) => {
          const score = scoreOf(assignment);
          const meta = STATE_META[state];
          const attempts = assignment.submissions.length;
          const limit = assignment.attemptLimit ?? 3;
          const latest = score.latestSubmission;
          const action = state === "todo" ? "Bắt đầu làm" : state === "inprogress" ? "Tiếp tục làm" : state === "retry" ? "Làm lại" : state === "passed" ? "Xem kết quả" : "Xem chi tiết";
          const disabled = state === "late" || state === "locked";
          return <Card key={assignment.id} className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="truncate font-bold text-navy">{exercise.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-muted">{exercise.objective}</p></div><Badge tone={meta.tone}>{meta.label}</Badge></div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-faint"><span>{exercise.difficulty}</span><span>Hạn {formatDueDate(exercise.dueAt)}</span><span>Tạo bởi {exercise.authorName ?? "Nhóm học tập"}</span></div>
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-bg p-2.5 text-center"><div><div className="font-bold text-navy">{score.best}/100</div><div className="text-2xs text-text-faint">Điểm cao nhất</div></div><div><div className="font-bold text-navy">{attempts}/{limit}</div><div className="text-2xs text-text-faint">Lượt đã làm</div></div><div><div className="font-bold text-navy">{latest?.passedTests ?? (latest?.result === "Đạt" ? "✓" : "–")}</div><div className="text-2xs text-text-faint">Kết quả gần nhất</div></div></div>
            {latest && <p className={`text-xs ${latest.result === "Đạt" ? "text-text-muted" : "text-primary"}`}>{latest.result === "Đạt" ? "Đã đạt yêu cầu" : latest.detail}</p>}
            <div className="mt-auto flex gap-2"><Button size="sm" variant="outline" className="flex-1" onClick={() => setSelected({ assignment, exercise })}>Chi tiết</Button>{disabled ? <Button size="sm" disabled className="flex-1">{state === "late" ? "Đã quá hạn" : "Hết lượt làm"}</Button> : <Button size="sm" href={`/solve/${exercise.id}`} className="flex-1">{action} <ArrowRight className="h-3.5 w-3.5" /></Button>}</div>
          </Card>;
        })}
      </div>}

      <AssignmentMemberDrawer selected={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function AssignmentMemberDrawer({ selected, onClose }: { selected: { assignment: Assignment; exercise: GroupExercise } | null; onClose: () => void }) {
  if (!selected) return null;
  const { assignment, exercise } = selected;
  const state = assignmentState(assignment, exercise);
  const latest = assignment.submissions.at(-1);
  const canRetry = state === "retry";
  return <SideDrawer open onClose={onClose} title={exercise.title} description="Theo dõi toàn bộ kết quả làm bài và nhận xét của người duyệt." footer={<><Button size="sm" variant="outline" onClick={onClose}>Đóng</Button>{canRetry && <Button size="sm" href={`/solve/${exercise.id}`}><RotateCcw className="h-3.5 w-3.5" /> Làm lại</Button>}</>}>
    <div className="space-y-5"><div className="flex flex-wrap gap-2"><Badge tone={STATE_META[state].tone}>{STATE_META[state].label}</Badge><span className="text-xs text-text-faint">{exercise.difficulty} · {exercise.xp} XP · Hạn {formatDueDate(exercise.dueAt)}</span></div><p className="text-sm leading-relaxed text-text">{exercise.objective}</p>
      <section><h3 className="mb-2 text-sm font-bold text-navy">Kết quả mới nhất</h3>{latest ? <Card className="p-4"><div className="flex items-center gap-2 font-semibold text-navy">{latest.result === "Đạt" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4 text-primary" />}{latest.result} · {latest.score ?? (latest.result === "Đạt" ? 100 : 0)}/100</div><p className="mt-2 text-sm text-text-muted">{latest.detail}</p><div className="mt-3 flex flex-wrap gap-3 text-xs text-text-faint"><span>{latest.submittedAt}</span><span>{latest.passedTests ?? "–"}/{latest.totalTests ?? "–"} test</span><span>{latest.runtime ?? "–"}</span></div></Card> : <Card className="border-dashed p-4 text-sm text-text-faint">Bạn chưa có lần nộp nào cho bài này.</Card>}</section>
      <section><h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-navy"><Clock3 className="h-4 w-4 text-primary" /> Lịch sử nộp bài</h3><div className="divide-y divide-border-soft rounded-lg border border-border-soft">{assignment.submissions.length ? assignment.submissions.map((submission) => <div key={submission.version} className="flex items-center justify-between gap-3 p-3"><div><div className="text-sm font-semibold text-navy">Lần {submission.version} · {submission.result}</div><div className="mt-0.5 text-xs text-text-faint">{submission.submittedAt} · {submission.detail}</div></div><span className="shrink-0 text-xs font-bold text-navy">{submission.score ?? (submission.result === "Đạt" ? 100 : 0)}/100</span></div>) : <p className="p-4 text-sm text-text-faint">Chưa có lịch sử nộp bài.</p>}</div></section>
      {assignment.feedback && <section className="rounded-lg border border-primary/20 bg-primary-tint p-4"><h3 className="text-sm font-bold text-navy">Nhận xét từ nhóm</h3><p className="mt-1 text-sm leading-relaxed text-text">{assignment.feedback}</p></section>}
    </div>
  </SideDrawer>;
}
