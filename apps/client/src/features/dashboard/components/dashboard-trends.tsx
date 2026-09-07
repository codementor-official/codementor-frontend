import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingUp, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { LearningDashboard } from '../types';
import { DashboardUnavailable } from './dashboard-section';
import type { DashboardViewMode } from './dashboard-section';

export function DashboardTrends({ data, onRetry, viewMode }: { data: LearningDashboard | null; onRetry: () => void; viewMode: DashboardViewMode }) {
  const [range, setRange] = useState(28);
  if (!data?.calendar) return <DashboardUnavailable onRetry={onRetry} />;
  const days = data.calendar.days.slice(-range);
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const previous = data.calendar.days.slice(-range * 2, -range).reduce((sum, day) => sum + day.count, 0);
  const active = days.filter((day) => day.count > 0).length;
  return <Card className="p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-base font-bold text-navy"><TrendingUp className="h-4 w-4 text-primary" /> Nhịp học của bạn</h2><p className="mt-1 text-xs text-text-muted">Ghi danh và hoàn thành nội dung học tập</p></div><div className="flex gap-1">{[7, 28].map((value) => <Button key={value} size="sm" variant={range === value ? 'primary' : 'outline'} aria-pressed={range === value} onClick={() => setRange(value)}>{value} ngày</Button>)}</div></div>
    <div className={`${viewMode === 'table' ? 'my-4 grid divide-y divide-border-soft rounded-lg border border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0' : 'my-5 flex flex-wrap items-end gap-x-6 gap-y-2'}`}><div className={viewMode === 'table' ? 'p-3' : ''}><strong className={`${viewMode === 'table' ? 'text-xl' : 'text-3xl'} font-bold tabular-nums text-navy`}>{total}</strong><span className="ml-2 text-sm text-text-muted">hoạt động</span></div><p className={`text-xs text-text-muted ${viewMode === 'table' ? 'p-3' : ''}`}>{previous ? `${total >= previous ? '+' : ''}${total - previous} so với ${range} ngày trước` : 'Giai đoạn trước chưa có hoạt động'}</p><p className={`flex items-center gap-1.5 text-xs text-text-muted ${viewMode === 'table' ? 'p-3' : 'ml-auto'}`}><CalendarDays className="h-4 w-4" />{active}/{range} ngày tích cực</p></div>
    <div className={`${viewMode === 'table' ? 'h-36' : 'h-48'} min-w-0`} aria-label={`Biểu đồ ${total} hoạt động trong ${range} ngày`}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={days} margin={{ top: 8, right: 0, bottom: 0, left: -30 }} accessibilityLayer>
        <CartesianGrid vertical={false} stroke="var(--color-border-soft)" strokeDasharray="3 3" />
        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} minTickGap={20} tickFormatter={(value: string) => `${value.slice(8)}/${value.slice(5, 7)}`} />
        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-faint)', fontSize: 11 }} />
        <Tooltip cursor={{ fill: 'var(--color-border-soft)' }} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-navy)' }} labelFormatter={(label) => `Ngày ${String(label).split('-').reverse().join('/')}`} />
        <Bar dataKey="count" name="Hoạt động" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart></ResponsiveContainer>
    </div>
    {!total && <p className="mt-2 text-xs text-text-muted">Bắt đầu một bài học hôm nay để nối lại nhịp học của bạn.</p>}
  </Card>;
}
