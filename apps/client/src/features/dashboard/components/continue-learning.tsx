import Link from 'next/link';
import { BookOpen, Map } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { LearningDashboard } from '../types';
import { DashboardCardHeader, DashboardEmpty, DashboardUnavailable } from './dashboard-section';

export function ContinueLearning({ data, onRetry, excludeHref }: { data: LearningDashboard | null; onRetry: () => void; excludeHref?: string }) {
  const formatActivity = (date: string) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', timeZone: data?.timezone }).format(new Date(date));
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
  ].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).filter((item) => item.href !== excludeHref).slice(0, 3);
  const unavailable = !data || data.courses === null || data.roadmaps === null;
  return <Card className="flex h-full flex-col overflow-hidden">
    <DashboardCardHeader title="Tiếp tục học" description="Nội dung bạn học gần đây nhất, cùng tiến độ đã lưu." href="/courses" />
    {unavailable && <div className="p-4"><DashboardUnavailable onRetry={onRetry} /></div>}
    {!items.length && !unavailable && <div className="p-4"><DashboardEmpty text="Bắt đầu một khóa học hoặc lộ trình để lưu tiến độ của bạn tại đây." href="/courses" action="Tìm khóa học đầu tiên" /></div>}
    {items.length > 0 && <ul className="divide-y divide-border-soft">{items.map((item) => <li key={item.id}><Link href={item.href} className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-bg">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-border-soft text-navy"><item.icon className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-navy">{item.title}</span><span className="mt-0.5 block truncate text-xs text-text-muted">{item.meta}{item.paused ? ' · Tạm dừng' : ''} · {formatActivity(item.date)}</span></span>
      <span className="w-28 shrink-0 max-sm:hidden"><ProgressBar value={item.progress} label={`${Math.round(item.progress)}%`} /></span>
    </Link></li>)}</ul>}
  </Card>;
}
