import Link from 'next/link';
import { BookOpen, Map } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { LearningDashboard } from '../types';
import { DashboardEmpty, DashboardSection, DashboardUnavailable } from './dashboard-section';

export function ContinueLearning({ data, onRetry }: { data: LearningDashboard | null; onRetry: () => void }) {
  const items = [
    ...(data?.courses ?? []).filter((item) => item.status === 'active' || item.status === 'paused').map((item) => ({
      id: item.id, title: item.title, href: `/courses/${item.courseId}`, progress: item.progressPercent,
      meta: `${item.completedLessons} bài học hoàn thành`, icon: BookOpen,
      date: item.lastActivityAt ?? item.startedAt, paused: item.status === 'paused',
    })),
    ...(data?.roadmaps ?? []).filter((item) => item.status === 'active' || item.status === 'paused').map((item) => ({
      id: item.id, title: item.title, href: `/roadmaps/${item.roadmapId}`, progress: item.progressPercent,
      meta: `${item.completedCourses}/${item.totalCourses} khóa học`, icon: Map,
      date: item.lastActivityAt ?? item.startedAt, paused: item.status === 'paused',
    })),
  ].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 4);
  const unavailable = !data || data.courses === null || data.roadmaps === null;
  return <DashboardSection title="Tiếp tục học" href="/courses" description="Nội dung bạn học gần đây nhất, cùng tiến độ đã lưu.">
    {unavailable && <DashboardUnavailable onRetry={onRetry} />}
    {!items.length && !unavailable && <DashboardEmpty text="Bắt đầu một khóa học hoặc lộ trình để lưu tiến độ của bạn tại đây." href="/courses" action="Tìm khóa học đầu tiên" />}
    <ul className="grid gap-3 sm:grid-cols-2">{items.map((item) => <li key={item.id}>
      <Link href={item.href} className="block h-full"><Card className="h-full p-4 transition-colors duration-150 hover:border-primary/50">
        <div className="mb-3 flex items-start gap-3"><span className="rounded-lg border border-border bg-bg p-2 text-primary"><item.icon className="h-5 w-5" /></span><div className="min-w-0"><p className="line-clamp-2 text-sm font-semibold text-navy">{item.title}</p><p className="mt-1 text-xs text-text-muted">{item.meta}{item.paused ? ' · Tạm dừng' : ''}</p></div></div>
        <ProgressBar value={item.progress} label={`${Math.round(item.progress)}% hoàn thành`} />
        <p className="mt-3 text-xs font-semibold text-primary">Tiếp tục học →</p>
      </Card></Link>
    </li>)}</ul>
  </DashboardSection>;
}
