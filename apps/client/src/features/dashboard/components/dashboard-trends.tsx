import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, BarChart3, CalendarDays, Target } from 'lucide-react';
import { Select } from '@codementor/ui';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { DashboardData } from '../dashboard-service';
import { DashboardEmpty, DashboardSection, DashboardUnavailable } from './dashboard-section';

const RANGE_OPTIONS = [
  { value: '7', label: '7 ngày gần đây' },
  { value: '28', label: '28 ngày gần đây' },
  { value: '56', label: '8 tuần gần đây' },
] as const;

type ActivityRange = 7 | 28 | 56;
const ACTIVITY_LABEL = {
  roadmap_enrolled: 'Bắt đầu lộ trình',
  course_enrolled: 'Bắt đầu khóa học',
  course_completed: 'Hoàn thành khóa học',
  lesson_completed: 'Hoàn thành bài học',
  exercise_solved: 'Giải đạt bài tập',
} as const;

function activityTone(count: number) {
  if (count <= 0) return 'bg-border-soft';
  if (count === 1) return 'bg-primary/25';
  if (count === 2) return 'bg-primary/50';
  if (count === 3) return 'bg-primary/75';
  return 'bg-primary';
}

function shortDate(date: string) {
  const [, month, day] = date.split('-');
  return `${Number(day)}/${Number(month)}`;
}

export function DashboardTrends({ data, onRetry }: { data: DashboardData; onRetry: () => void }) {
  const [range, setRange] = useState<ActivityRange>(28);
  const calendar = data.learning?.calendar;
  const days = calendar?.days.slice(-range) ?? [];
  const previousDays = calendar?.days.slice(-range * 2, -range) ?? [];
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const previous = previousDays.reduce((sum, day) => sum + day.count, 0);
  const active = days.filter((day) => day.count > 0).length;
  const delta = previousDays.length === range ? total - previous : null;
  const heatmapDays = calendar?.days.slice(-56) ?? [];
  const heatmapWeeks = Array.from({ length: Math.ceil(heatmapDays.length / 7) }, (_, index) => heatmapDays.slice(index * 7, index * 7 + 7));

  const topics = useMemo(() => (data.topics ?? [])
    .filter((topic) => topic.count > 0)
    .sort((a, b) => ((b.solved ?? 0) + (b.attempted ?? 0)) - ((a.solved ?? 0) + (a.attempted ?? 0)) || b.count - a.count)
    .slice(0, 5), [data.topics]);

  const activities = data.learning?.activities?.slice(0, 5) ?? [];

  return <DashboardSection
    title="Phân tích tiến độ"
    description="Tổng hợp hoạt động, chủ đề luyện tập và nội dung đang học từ dữ liệu đã ghi nhận của bạn."
  >
    <div className="grid min-w-0 gap-4 xl:grid-cols-12">
      <Card className="min-w-0 p-5 xl:col-span-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-navy"><BarChart3 className="h-4 w-4 text-primary" /> Hoạt động học tập</h3>
            <p className="mt-1 text-xs text-text-muted">Sự kiện học tập thực tế được hệ thống ghi nhận theo ngày.</p>
          </div>
          <Select
            label="Khoảng thời gian phân tích"
            value={String(range)}
            options={[...RANGE_OPTIONS]}
            onChange={(value) => setRange(Number(value) as ActivityRange)}
            className="w-40"
          />
        </div>
        {!calendar ? <div className="mt-4"><DashboardUnavailable onRetry={onRetry} /></div> : <>
          <div className="my-4 grid divide-y divide-border-soft rounded-lg border border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="p-3"><strong className="text-xl font-bold tabular-nums text-navy">{total}</strong><span className="ml-2 text-xs text-text-muted">hoạt động</span></div>
            <p className="p-3 text-xs text-text-muted">{delta === null ? 'Chưa đủ kỳ trước để so sánh' : `${delta >= 0 ? '+' : ''}${delta} so với kỳ trước`}</p>
            <p className="flex items-center gap-1.5 p-3 text-xs text-text-muted"><CalendarDays className="h-4 w-4" />{active}/{days.length} ngày có hoạt động</p>
          </div>
          <div className="h-48 min-w-0" aria-label={`Biểu đồ ${total} hoạt động trong ${range} ngày`}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={days} margin={{ top: 8, right: 0, bottom: 0, left: -30 }} accessibilityLayer>
              <CartesianGrid vertical={false} stroke="var(--color-border-soft)" strokeDasharray="3 3" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} minTickGap={20} tickFormatter={(value: string) => `${value.slice(8)}/${value.slice(5, 7)}`} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-faint)', fontSize: 11 }} />
              <Tooltip cursor={{ fill: 'var(--color-border-soft)' }} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-navy)' }} labelFormatter={(label) => `Ngày ${String(label).split('-').reverse().join('/')}`} />
              <Bar dataKey="count" name="Hoạt động" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart></ResponsiveContainer>
          </div>
        </>}
      </Card>

      <Card className="p-5 xl:col-span-5">
        <div className="flex items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 text-sm font-bold text-navy"><Target className="h-4 w-4 text-primary" /> Luyện tập theo chủ đề</h3><p className="mt-1 text-xs text-text-muted">Tỷ lệ bài đã giải trên ngân hàng công khai.</p></div><Link href="/practice" className="shrink-0 text-xs font-semibold text-primary hover:underline">Luyện tập →</Link></div>
        {data.topics === null ? <div className="mt-4"><DashboardUnavailable onRetry={onRetry} /></div> : topics.length === 0 ? <div className="mt-4"><DashboardEmpty text="Chưa có chủ đề luyện tập để phân tích." href="/practice" action="Chọn bài tập" /></div> : <ul className="mt-5 space-y-4">{topics.map((topic) => {
          const solved = topic.solved ?? 0;
          const value = topic.count ? (solved / topic.count) * 100 : 0;
          return <li key={topic.id}><div className="mb-1.5 flex items-center justify-between gap-3"><span className="truncate text-xs font-semibold text-navy">{topic.name}</span><span className="shrink-0 text-2xs tabular-nums text-text-muted">{solved}/{topic.count} bài</span></div><ProgressBar value={value} label={`${Math.round(value)}% đã giải`} /></li>;
        })}</ul>}
      </Card>

      <Card className="flex h-full flex-col p-5 xl:col-span-7">
        <div className="flex items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 text-sm font-bold text-navy"><CalendarDays className="h-4 w-4 text-primary" /> Nhịp học trong 8 tuần</h3><p className="mt-1 text-xs text-text-muted">Mỗi ô là một ngày; màu đậm hơn nghĩa là có nhiều hoạt động hơn.</p></div><span className="text-xs font-semibold text-navy">{calendar ? `${calendar.activeDays} ngày hoạt động` : '—'}</span></div>
        {!calendar ? <div className="mt-4"><DashboardUnavailable onRetry={onRetry} /></div> : <>
          <div className="flex flex-1 items-center py-5">
            <div className="grid w-full grid-cols-8 gap-2" role="img" aria-label={`Bản đồ ${heatmapDays.length} ngày hoạt động học tập`}>{heatmapWeeks.map((week, weekIndex) => {
              const firstDay = week[0];
              const weeklyTotal = week.reduce((sum, day) => sum + day.count, 0);
              return <div key={firstDay?.date ?? weekIndex} className="flex min-w-0 flex-col items-center gap-1.5">{week.map((day) => <span key={day.date} title={`${new Date(`${day.date}T00:00:00Z`).toLocaleDateString('vi-VN')}: ${day.count} hoạt động`} className={`h-5 w-5 rounded-sm ${activityTone(day.count)}`} />)}{firstDay && <time dateTime={firstDay.date} className="mt-1 text-2xs font-medium tabular-nums text-text-muted">{shortDate(firstDay.date)}</time>}<span className="text-2xs tabular-nums text-text-faint" title={`${weeklyTotal} hoạt động trong tuần`}>{weeklyTotal} HĐ</span></div>;
            })}</div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-soft pt-3 text-2xs text-text-faint"><span>Mốc dưới cột là ngày bắt đầu tuần · số cuối là tổng hoạt động</span><span className="flex items-center gap-1"><span>Ít</span>{[0, 1, 2, 3, 4].map((count) => <span key={count} className={`h-3 w-3 rounded-sm ${activityTone(count)}`} />)}<span>Nhiều</span></span></div>
        </>}
      </Card>

      <Card className="p-5 xl:col-span-5">
        <div><h3 className="flex items-center gap-2 text-sm font-bold text-navy"><Activity className="h-4 w-4 text-primary" /> Hoạt động gần đây</h3><p className="mt-1 text-xs text-text-muted">Những mốc mới nhất đã được ghi vào tiến độ học tập.</p></div>
        {data.learning?.activities === null ? <div className="mt-4"><DashboardUnavailable onRetry={onRetry} /></div> : activities.length === 0 ? <div className="mt-4"><DashboardEmpty text="Chưa có hoạt động học tập gần đây." href="/courses" action="Bắt đầu học" /></div> : <ul className="mt-4 divide-y divide-border-soft">{activities.map((item, index) => <li key={`${item.kind}:${item.occurredAt}:${index}`} className="flex min-w-0 items-center gap-3 py-3 first:pt-0 last:pb-0"><span className="h-2 w-2 shrink-0 rounded-full bg-primary" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-navy">{item.title}</p><p className="mt-0.5 truncate text-2xs text-text-muted">{ACTIVITY_LABEL[item.kind]}{item.detail ? ` · ${item.detail}` : ''}</p></div><time dateTime={item.occurredAt} className="shrink-0 text-2xs text-text-faint">{new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', timeZone: data.learning?.timezone }).format(new Date(item.occurredAt))}</time></li>)}</ul>}
      </Card>
    </div>
  </DashboardSection>;
}
