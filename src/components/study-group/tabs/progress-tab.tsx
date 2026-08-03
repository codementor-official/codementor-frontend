"use client";

import { useMemo, useState } from "react";
import { BarChart3, CalendarDays, CheckCircle2, CircleAlert, Flame, Target, TrendingUp, UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SubmissionChart } from "@/components/study-group/submission-chart";
import { rankMembers } from "@/lib/study-group/group-detail-meta";
import type { GroupDetail } from "@/types/study-group-detail";

export function ProgressTab({ detail }: { detail: GroupDetail }) {
  const [range, setRange] = useState<"week" | "month">("week");
  const metrics = useMemo(() => {
    const assignments = detail.assignments;
    const completed = assignments.filter((assignment) => assignment.status === "done").length;
    const passed = assignments.filter((assignment) => assignment.submissions.at(-1)?.result === "Đạt").length;
    const activeMembers = detail.members.filter((member) => member.lastActiveMinutesAgo < 7 * 24 * 60).length;
    const totalXp = detail.members.reduce((total, member) => total + member.xp, 0);
    return { total: assignments.length, completed, passed, activeMembers, totalXp, completion: assignments.length ? Math.round((completed / assignments.length) * 100) : 0, passRate: assignments.length ? Math.round((passed / assignments.length) * 100) : 0 };
  }, [detail]);
  const ranked = useMemo(() => rankMembers(detail.members), [detail.members]);
  const milestones = [
    { label: "Hoàn thành nền tảng", detail: "75% thành viên đã làm bài mảng", complete: true },
    { label: "Chinh phục vòng lặp", detail: "Cần thêm 3 bài đạt để mở chủ đề mới", complete: false },
    { label: "Sẵn sàng cấu trúc dữ liệu", detail: "Mục tiêu tuần tới: 12 lượt nộp", complete: false },
  ];
  const trend = range === "week" ? detail.submissionTrend : detail.submissionTrend.map((point, index) => ({ label: `T${index + 1}`, value: point.value + (index % 3) * 3 }));

  return <div className="flex flex-col gap-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-base font-bold text-navy"><TrendingUp className="h-4 w-4 text-primary" /> Tiến độ học tập</h2><p className="mt-1 text-xs text-text-faint">Theo dõi nhịp học, mức hoàn thành và điểm cần hỗ trợ của cả nhóm.</p></div><div className="flex rounded-md border border-border p-0.5 text-xs font-semibold"><button type="button" onClick={() => setRange("week")} className={`rounded px-3 py-1.5 ${range === "week" ? "bg-navy text-white" : "text-text-muted hover:bg-bg"}`}>7 ngày</button><button type="button" onClick={() => setRange("month")} className={`rounded px-3 py-1.5 ${range === "month" ? "bg-navy text-white" : "text-text-muted hover:bg-bg"}`}>4 tuần</button></div></div>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
      { label: "Hoàn thành nhiệm vụ", value: `${metrics.completion}%`, detail: `${metrics.completed}/${metrics.total} bài được giao`, icon: CheckCircle2 },
      { label: "Tỷ lệ đạt", value: `${metrics.passRate}%`, detail: `${metrics.passed} bài đạt yêu cầu`, icon: Target },
      { label: "Thành viên hoạt động", value: `${metrics.activeMembers}/${detail.members.length}`, detail: "Có hoạt động 7 ngày qua", icon: UsersRound },
      { label: "XP tích lũy", value: metrics.totalXp.toLocaleString("vi-VN"), detail: "Tổng điểm trong nhóm", icon: Flame },
    ].map((metric) => <Card key={metric.label} className="p-4"><metric.icon className="mb-3 h-4 w-4 text-primary" /><div className="text-xl font-bold text-navy">{metric.value}</div><div className="mt-0.5 text-xs font-semibold text-text">{metric.label}</div><div className="mt-1 text-2xs text-text-faint">{metric.detail}</div></Card>)}</div>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]"><Card className="p-5"><div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 text-sm font-bold text-navy"><BarChart3 className="h-4 w-4 text-primary" /> Nhịp nộp bài</h3><p className="mt-1 text-xs text-text-faint">Số lượt nộp theo {range === "week" ? "ngày" : "tuần"}; dùng để nhận biết khi nhóm đang chững lại.</p></div><span className="rounded-full bg-primary-tint px-2 py-1 text-2xs font-bold text-primary">{trend.reduce((sum, point) => sum + point.value, 0)} lượt</span></div><SubmissionChart data={trend} /></Card>
      <Card className="p-5"><h3 className="flex items-center gap-2 text-sm font-bold text-navy"><CalendarDays className="h-4 w-4 text-primary" /> Mốc học tập</h3><div className="mt-4 space-y-4">{milestones.map((milestone, index) => <div key={milestone.label} className="flex gap-3"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-2xs font-bold ${milestone.complete ? "bg-navy text-white" : "border border-border text-text-faint"}`}>{milestone.complete ? "✓" : index + 1}</span><div><div className="text-sm font-semibold text-navy">{milestone.label}</div><p className="mt-0.5 text-xs leading-relaxed text-text-faint">{milestone.detail}</p></div></div>)}</div></Card></div>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.85fr)]"><Card className="overflow-hidden"><div className="border-b border-border-soft px-5 py-4"><h3 className="text-sm font-bold text-navy">Tiến độ theo thành viên</h3><p className="mt-1 text-xs text-text-faint">Ưu tiên hỗ trợ người có tiến độ thấp hoặc chuỗi học bị ngắt.</p></div><div className="divide-y divide-border-soft">{ranked.map((member) => <div key={member.id} className="flex flex-wrap items-center gap-3 px-5 py-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-2xs font-bold text-white">{member.initials}</span><div className="min-w-32 flex-1"><div className="text-sm font-semibold text-navy">{member.name}</div><div className="text-xs text-text-faint">{member.solvedCount} bài · chuỗi {member.streakDays} ngày</div></div><div className="w-full sm:w-44"><div className="mb-1 flex justify-between text-xs"><span className="text-text-muted">Tiến độ</span><span className="font-bold text-navy">{member.progressPercent}%</span></div><ProgressBar value={member.progressPercent} /></div><span className="ml-auto text-xs font-bold text-primary">{member.xp.toLocaleString("vi-VN")} XP</span></div>)}</div></Card>
      <Card className="p-5"><h3 className="flex items-center gap-2 text-sm font-bold text-navy"><CircleAlert className="h-4 w-4 text-primary" /> Cần chú ý</h3><div className="mt-4 space-y-3"><div className="rounded-lg bg-primary-tint p-3"><div className="text-sm font-semibold text-navy">2 thành viên có bài quá hạn</div><p className="mt-1 text-xs text-text-muted">Gửi nhắc nhở hoặc gia hạn riêng nếu có lý do chính đáng.</p></div><div className="rounded-lg bg-bg p-3"><div className="text-sm font-semibold text-navy">Chủ đề cần ôn: Đệ quy</div><p className="mt-1 text-xs text-text-muted">Tỷ lệ hoàn thành thấp nhất trong các bài đã giao.</p></div></div></Card></div>
  </div>;
}
