"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, BookOpen, CalendarClock, LayoutDashboard, Loader2, Map, Trophy } from "lucide-react";
import { StatStrip } from "@codementor/ui";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { AccountProfile, UserActivityEntry, UserLearningStats } from "@/features/account/types";
import type { EnrolledCourse, EnrolledRoadmap } from "@/types/catalogue";
import type { WorkspaceAssignment, WorkspaceListItem } from "@/features/workspace/types";

interface DashboardAssignment extends WorkspaceAssignment {
  workspaceName: string;
  workspaceSlug: string;
}

interface DashboardData {
  profile: AccountProfile;
  stats: UserLearningStats;
  courses: EnrolledCourse[];
  roadmaps: EnrolledRoadmap[];
  activities: UserActivityEntry[];
  assignments: DashboardAssignment[];
  submissionCount: number;
}

function formatDate(value: string | null) {
  if (!value) return "Không hạn";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

export function LearningDashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profile, stats, courses, roadmaps, activities, submissions, workspacePage] = await Promise.all([
        api.me(),
        api.account.stats(),
        api.courses.mine(),
        api.roadmaps.mine(),
        api.account.recentActivity(10),
        api.submissions.mine({ page: 1, limit: 10 }),
        api.workspaces.list({ scope: "mine", page: 1, limit: 20 }),
      ]);
      const assignmentPages = await Promise.allSettled(
        workspacePage.items.map((workspace) => api.workspaces.assignments(workspace.slug, { page: 1, limit: 10 })),
      );
      const assignments = assignmentPages.flatMap((result, index) => {
        if (result.status !== "fulfilled") return [];
        const workspace = workspacePage.items[index] as WorkspaceListItem;
        return result.value.items
          .filter((assignment) => assignment.status !== "done")
          .map((assignment) => ({ ...assignment, workspaceName: workspace.name, workspaceSlug: workspace.slug }));
      });
      setData({ profile, stats, courses, roadmaps, activities, assignments, submissionCount: submissions.total });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải được dashboard học tập.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const continueItems = useMemo(() => {
    if (!data) return [];
    return [
      ...data.courses.filter((course) => course.status === "active").map((course) => ({
        id: course.id,
        kind: "Khóa học",
        title: course.title,
        progress: course.progressPercent,
        href: `/courses/${course.courseId}`,
        icon: BookOpen,
      })),
      ...data.roadmaps.filter((roadmap) => roadmap.status === "active").map((roadmap) => ({
        id: roadmap.id,
        kind: "Lộ trình",
        title: roadmap.title,
        progress: roadmap.progressPercent,
        href: `/roadmaps/${roadmap.roadmapId}`,
        icon: Map,
      })),
    ].sort((left, right) => right.progress - left.progress);
  }, [data]);

  if (loading) return <div className="flex items-center gap-2 p-10 text-sm text-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Đang tổng hợp việc học của bạn...</div>;
  if (error || !data) return <Card className="p-10 text-center"><p className="text-sm font-semibold text-navy">Không tải được dashboard</p><p className="mt-1 text-xs text-text-muted">{error}</p><Button className="mt-4" variant="outline" onClick={() => void load()}>Thử lại</Button></Card>;

  return (
    <div>
      <PageHeader icon={LayoutDashboard} title={`Chào mừng trở lại, ${data.profile.displayName}`} subtitle="Các nội dung đang học và việc cần làm tiếp theo, lấy trực tiếp từ tiến độ của bạn." />
      <StatStrip className="mb-5" stats={[
        { label: "Tổng XP", value: data.stats.xp.toLocaleString("vi-VN") },
        { label: "Bài đã giải", value: data.stats.solvedCount },
        { label: "Chuỗi hiện tại", value: `${data.stats.currentStreakDays} ngày` },
        { label: "Bài nộp", value: data.submissionCount },
      ]} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-base font-bold text-navy">Tiếp tục học</h2><Link href="/courses" className="text-xs font-semibold text-primary">Xem danh mục →</Link></div>
            {continueItems.length === 0 ? <EmptyCard text="Bạn chưa bắt đầu khóa học hoặc lộ trình nào." href="/explore" action="Khám phá nội dung" /> : (
              <div className="space-y-3">{continueItems.slice(0, 6).map((item) => <Link key={`${item.kind}-${item.id}`} href={item.href}><Card className="flex items-center gap-4 p-4 hover:border-primary/50"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary"><item.icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="mb-1 flex items-center justify-between gap-3"><span className="truncate text-sm font-semibold text-navy">{item.title}</span><span className="text-xs font-semibold text-primary">{Math.round(item.progress)}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-border-soft"><div className="h-full rounded-full bg-primary" style={{ width: `${item.progress}%` }} /></div><p className="mt-1 text-2xs text-text-faint">{item.kind}</p></div></Card></Link>)}</div>
            )}
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-navy"><CalendarClock className="h-4 w-4 text-primary" /> Bài Workspace cần làm</h2>
            {data.assignments.length === 0 ? <EmptyCard text="Không có bài tập Workspace đang chờ." /> : <Card className="divide-y divide-border-soft overflow-hidden">{data.assignments.slice(0, 8).map((assignment) => <Link key={assignment.id} href={`/workspace/${assignment.workspaceSlug}?tab=exercises`} className="flex items-center gap-4 p-4 hover:bg-bg"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-navy">{assignment.exerciseTitle}</p><p className="mt-1 text-xs text-text-faint">{assignment.workspaceName} · Hạn {formatDate(assignment.dueAt)}</p></div><Badge tone={assignment.status === "inprogress" ? "accent" : "neutral"}>{assignment.status === "inprogress" ? "Đang làm" : "Chưa làm"}</Badge></Link>)}</Card>}
          </section>
        </div>

        <aside className="space-y-4">
          <Card className="p-4"><h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy"><Trophy className="h-4 w-4 text-primary" /> Thành tích</h2><dl className="space-y-3 text-xs"><div className="flex justify-between"><dt className="text-text-muted">Chuỗi dài nhất</dt><dd className="font-semibold text-navy">{data.stats.longestStreakDays} ngày</dd></div><div className="flex justify-between"><dt className="text-text-muted">Khóa đang học</dt><dd className="font-semibold text-navy">{data.courses.filter((course) => course.status === "active").length}</dd></div><div className="flex justify-between"><dt className="text-text-muted">Lộ trình đang học</dt><dd className="font-semibold text-navy">{data.roadmaps.filter((roadmap) => roadmap.status === "active").length}</dd></div></dl></Card>
          <Card className="overflow-hidden"><div className="border-b border-border-soft p-4"><h2 className="flex items-center gap-2 text-sm font-bold text-navy"><Activity className="h-4 w-4 text-primary" /> Hoạt động gần đây</h2></div>{data.activities.length === 0 ? <p className="p-5 text-xs text-text-faint">Chưa có hoạt động học tập.</p> : <div className="divide-y divide-border-soft">{data.activities.slice(0, 7).map((activity, index) => <div key={`${activity.kind}-${activity.occurredAt}-${index}`} className="p-4"><p className="text-xs font-semibold text-navy">{activity.title}</p>{activity.detail && <p className="mt-1 text-2xs text-text-muted">{activity.detail}</p>}<p className="mt-1 text-2xs text-text-faint">{new Date(activity.occurredAt).toLocaleString("vi-VN")}</p></div>)}</div>}</Card>
        </aside>
      </div>
    </div>
  );
}

function EmptyCard({ text, href, action }: { text: string; href?: string; action?: string }) {
  return <Card className="border-dashed p-8 text-center"><p className="text-sm text-text-muted">{text}</p>{href && action && <Link href={href} className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">{action} →</Link>}</Card>;
}
