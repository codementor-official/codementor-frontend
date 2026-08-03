"use client";

import { useMemo, useState } from "react";
import { Download, Eye, FileDown, MoreHorizontal, RotateCcw, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RowActionMenu } from "@/components/ui/row-action-menu";
import { SideDrawer } from "@/components/ui/side-drawer";
import { EXERCISE_STATUS_META, formatDueDate } from "@/lib/study-group/group-detail-meta";
import { downloadCsv } from "@/lib/download-csv";
import type { Assignment, GroupExercise, GroupMember } from "@/types/study-group-detail";

type ExerciseWithAssignments = { exercise: GroupExercise; assignments: Assignment[] };

function summary(rows: Assignment[]) {
  const submitted = rows.filter((row) => row.submissions.length > 0);
  const passed = rows.filter((row) => row.submissions.at(-1)?.result === "Đạt");
  const failed = submitted.filter((row) => row.submissions.at(-1)?.result === "Không đạt");
  return { assigned: rows.length, submitted: submitted.length, passed: passed.length, failed: failed.length, untouched: rows.length - submitted.length, attempts: rows.reduce((total, row) => total + row.submissions.length, 0) };
}

export function AssignmentManagerTable({ exercises, assignments, members }: { exercises: GroupExercise[]; assignments: Assignment[]; members: GroupMember[] }) {
  const [selected, setSelected] = useState<ExerciseWithAssignments | null>(null);
  const [closing, setClosing] = useState<GroupExercise | null>(null);
  const groups = useMemo(() => exercises.map((exercise) => ({ exercise, assignments: assignments.filter((assignment) => assignment.exerciseId === exercise.id) })), [exercises, assignments]);
  const exportAssignments = () => downloadCsv("bao-cao-bai-nop.csv", ["Bài tập", "Người tạo", "Hạn nộp", "Được giao", "Đã nộp", "Đã đạt", "Chưa đạt", "Tổng lượt nộp"], groups.map((group) => { const stats = summary(group.assignments); return [group.exercise.title, group.exercise.authorName ?? "Nhóm học tập", formatDueDate(group.exercise.dueAt), stats.assigned, stats.submitted, stats.passed, stats.failed, stats.attempts]; }));
  return <>
    <div className="mb-3 flex justify-end"><Button size="sm" variant="outline" onClick={exportAssignments}><Download className="h-3.5 w-3.5" /> Xuất CSV</Button></div>
    <Card className="overflow-x-auto">
      <table className="w-full min-w-4xl text-left text-sm">
        <thead className="border-b border-border bg-bg text-2xs font-bold tracking-wide text-text-faint uppercase"><tr><th className="px-4 py-3">Bài tập</th><th className="px-4 py-3">Người tạo</th><th className="px-4 py-3">Hạn nộp</th><th className="px-4 py-3">Tiến độ</th><th className="px-4 py-3">Lượt nộp</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3" /></tr></thead>
        <tbody className="divide-y divide-border-soft">{groups.map((group) => {
          const stats = summary(group.assignments);
          const statusMeta = EXERCISE_STATUS_META[group.exercise.status];
          return <tr key={group.exercise.id} className="hover:bg-bg"><td className="px-4 py-3"><button type="button" onClick={() => setSelected(group)} className="text-left"><div className="font-semibold text-navy hover:text-primary">{group.exercise.title}</div><div className="mt-0.5 text-xs text-text-faint">{group.exercise.topic} · {group.exercise.difficulty}</div></button></td><td className="px-4 py-3 text-xs text-text-muted">{group.exercise.authorName ?? "Nhóm học tập"}<div className="mt-0.5 text-text-faint">{group.exercise.createdAt ?? "Chưa cập nhật"}</div></td><td className="px-4 py-3 text-xs text-text-muted">{formatDueDate(group.exercise.dueAt)}</td><td className="px-4 py-3"><div className="text-xs font-semibold text-navy">{stats.submitted}/{stats.assigned} đã nộp · {stats.passed} đạt</div><div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-border-soft"><div className="h-full bg-primary" style={{ width: `${stats.assigned ? Math.round((stats.submitted / stats.assigned) * 100) : 0}%` }} /></div></td><td className="px-4 py-3 text-xs text-text-muted">{stats.attempts} tổng<br /><span className="text-text-faint">{stats.failed} chưa đạt</span></td><td className="px-4 py-3"><Badge tone={statusMeta.tone}>{statusMeta.label}</Badge></td><td className="px-4 py-3"><RowActionMenu label={`Tùy chọn ${group.exercise.title}`} items={[{ key: "detail", label: "Xem tiến độ", icon: <Eye className="h-3.5 w-3.5" />, onSelect: () => setSelected(group) }, { key: "extend", label: "Gia hạn", icon: <RotateCcw className="h-3.5 w-3.5" />, onSelect: () => setSelected(group) }, { key: "export", label: "Xuất kết quả", icon: <Download className="h-3.5 w-3.5" />, onSelect: () => undefined }, { key: "close", label: "Đóng bài tập", icon: <MoreHorizontal className="h-3.5 w-3.5" />, danger: true, separatorBefore: true, onSelect: () => setClosing(group.exercise) }]} /></td></tr>;
        })}</tbody>
      </table>
    </Card>
    <AssignmentManagerDrawer selected={selected} members={members} onClose={() => setSelected(null)} />
    <ConfirmDialog open={closing !== null} onClose={() => setClosing(null)} onConfirm={() => setClosing(null)} title="Đóng bài tập?" confirmLabel="Đóng bài tập" message={<>Thành viên sẽ không thể nộp thêm bài cho <span className="font-semibold text-navy">{closing?.title}</span> trừ khi bạn mở lại.</>} />
  </>;
}

function AssignmentManagerDrawer({ selected, members, onClose }: { selected: ExerciseWithAssignments | null; members: GroupMember[]; onClose: () => void }) {
  if (!selected) return null;
  const stats = summary(selected.assignments);
  const membersById = new Map(members.map((member) => [member.id, member]));
  return <SideDrawer open width="wide" onClose={onClose} title={selected.exercise.title} description="Theo dõi tiến độ, kết quả và các lần nộp của từng thành viên." footer={<><Button size="sm" variant="outline" onClick={onClose}>Đóng</Button><Button size="sm" variant="outline"><FileDown className="h-3.5 w-3.5" /> Xuất kết quả</Button></>}>
    <div className="space-y-5"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[{ label: "Được giao", value: stats.assigned }, { label: "Đã nộp", value: stats.submitted }, { label: "Đã đạt", value: stats.passed }, { label: "Chưa làm", value: stats.untouched }, { label: "Chưa đạt", value: stats.failed }, { label: "Tỷ lệ hoàn thành", value: `${stats.assigned ? Math.round((stats.submitted / stats.assigned) * 100) : 0}%` }, { label: "Tỷ lệ đạt", value: `${stats.assigned ? Math.round((stats.passed / stats.assigned) * 100) : 0}%` }, { label: "Lượt nộp TB", value: stats.assigned ? (stats.attempts / stats.assigned).toFixed(1) : "0" }].map((item) => <Card key={item.label} className="p-3"><div className="text-lg font-bold text-navy">{item.value}</div><div className="text-2xs text-text-faint">{item.label}</div></Card>)}</div>
      <section><div className="mb-3 flex items-center gap-2"><UsersRound className="h-4 w-4 text-primary" /><h3 className="text-sm font-bold text-navy">Danh sách thành viên</h3></div><div className="overflow-x-auto rounded-lg border border-border-soft"><table className="w-full min-w-3xl text-left text-xs"><thead className="bg-bg text-text-faint"><tr><th className="p-3">Thành viên</th><th className="p-3">Trạng thái</th><th className="p-3">Lượt nộp</th><th className="p-3">Điểm</th><th className="p-3">Kết quả gần nhất</th></tr></thead><tbody className="divide-y divide-border-soft">{selected.assignments.map((assignment) => { const member = membersById.get(assignment.memberId); const latest = assignment.submissions.at(-1); const best = Math.max(...assignment.submissions.map((submission) => submission.score ?? (submission.result === "Đạt" ? 100 : 0)), 0); return <tr key={assignment.id}><td className="p-3"><div className="font-semibold text-navy">{member?.name ?? "Thành viên"}</div><div className="text-text-faint">@{member?.id ?? "unknown"}</div></td><td className="p-3">{latest?.result ?? "Chưa nộp"}</td><td className="p-3">{assignment.submissions.length}/{assignment.attemptLimit ?? 3}</td><td className="p-3">{best}/100</td><td className="p-3">{latest ? <><div>{latest.passedTests ?? "–"}/{latest.totalTests ?? "–"} test</div><div className="text-text-faint">{latest.submittedAt}</div></> : "–"}</td></tr>; })}</tbody></table></div></section>
    </div>
  </SideDrawer>;
}
