import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Clock3, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { DashboardData } from '../dashboard-service';
import { DashboardUnavailable } from './dashboard-section';

const DAYS = [
  { id: 'mon', label: 'T2' }, { id: 'tue', label: 'T3' }, { id: 'wed', label: 'T4' },
  { id: 'thu', label: 'T5' }, { id: 'fri', label: 'T6' }, { id: 'sat', label: 'T7' }, { id: 'sun', label: 'CN' },
] as const;

export function DashboardPlanner({ data, onRetry }: { data: DashboardData; onRetry: () => void }) {
  const preferences = data.preferences;
  const calendar = data.learning?.calendar;
  const today = calendar?.days.at(-1)?.date;
  const weekday = today ? (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7 : 0;
  const week = calendar?.days.slice(-(weekday + 1)) ?? [];
  const activeDays = week.filter((day) => day.count > 0).length;
  const enabledSchedule = preferences?.schedule.filter((slot) => slot.enabled) ?? [];
  const nextSlot = DAYS.map((day, offset) => ({
    offset: (offset - weekday + 7) % 7,
    day,
    slot: enabledSchedule.find((slot) => slot.weekday === day.id),
  })).filter((entry) => entry.slot).sort((a, b) => a.offset - b.offset)[0];

  return <section className="flex min-w-0 flex-col">
    <div className="mb-3">
      <h2 className="flex items-center gap-2 text-base font-bold text-navy"><CalendarDays className="h-4 w-4 text-primary" /> Mục tiêu tuần</h2>
      <p className="mt-1 text-xs text-text-muted">Lịch dự kiến và hoạt động đã ghi nhận được hiển thị riêng.</p>
    </div>
    <Card className="flex-1 overflow-hidden">
    {!preferences ? <div className="p-4"><DashboardUnavailable onRetry={onRetry} /></div> : <div className="flex h-full flex-col p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-text-faint"><Target className="h-3.5 w-3.5" /> Mục tiêu hiện tại</p>
          <p className="mt-1 truncate text-sm font-semibold text-navy">{preferences.learningGoal || 'Chưa đặt mục tiêu học tập'}</p>
          {preferences.careerGoal && <p className="mt-0.5 truncate text-xs text-text-muted">{preferences.careerGoal}</p>}
        </div>
        <Link href="/profile?tab=personalization" aria-label="Điều chỉnh mục tiêu và lịch học" className="shrink-0 rounded-lg border border-border p-2 text-primary transition-colors hover:bg-bg"><ArrowUpRight className="h-4 w-4" /></Link>
      </div>

      <div className="mt-3 border-t border-border-soft pt-3">
        <div className="flex items-baseline justify-between gap-2"><p className="text-xs font-semibold text-navy">Nhịp tuần này</p><span className="text-xs font-bold text-primary">{calendar ? `${activeDays} ngày` : '—'}</span></div>
        <div className="mt-2 grid grid-cols-7 gap-1">{DAYS.map((day, index) => <div key={day.id} className="text-center"><div className={`mx-auto flex h-6 w-6 items-center justify-center rounded-md text-2xs font-semibold ${week[index]?.count ? 'bg-primary text-on-ink' : 'bg-border-soft text-text-faint'}`}>{week[index]?.count ? '✓' : '·'}</div><span className="mt-1 block text-2xs text-text-muted">{day.label}</span></div>)}</div>
        <p className="mt-2 truncate text-2xs text-text-muted">{preferences.weeklyStudyHours ? `Mục tiêu ${preferences.weeklyStudyHours} giờ/tuần` : 'Chưa đặt số giờ mục tiêu'} · thời gian dự kiến</p>
      </div>

      <div className="mt-auto flex min-w-0 items-center gap-3 border-t border-border-soft pt-3">
        <Clock3 className="h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0"><p className="text-xs font-semibold text-navy">Buổi học tiếp theo</p>{nextSlot?.slot ? <p className="mt-0.5 truncate text-xs text-text-muted">{nextSlot.offset === 0 ? 'Hôm nay' : nextSlot.offset === 1 ? 'Ngày mai' : nextSlot.day.label}, {nextSlot.slot.startTime} · {nextSlot.slot.durationMinutes} phút</p> : <p className="mt-0.5 truncate text-xs text-text-muted">Chưa có lịch học trong tuần</p>}</div>
      </div>
    </div>}
    </Card>
  </section>;
}
