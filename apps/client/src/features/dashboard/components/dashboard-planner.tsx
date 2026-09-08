import Link from 'next/link';
import { CalendarDays, Clock3, Target } from 'lucide-react';
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

  return <Card className="overflow-hidden">
    <div className="border-b border-border-soft p-4">
      <h2 className="flex items-center gap-2 text-base font-bold text-navy"><CalendarDays className="h-4 w-4 text-primary" /> Mục tiêu tuần</h2>
      <p className="mt-1 text-xs text-text-muted">Lịch dự kiến và hoạt động đã ghi nhận được hiển thị riêng.</p>
    </div>
    {!preferences ? <div className="p-4"><DashboardUnavailable onRetry={onRetry} /></div> : <div className="space-y-4 p-4">
      <div>
        <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-text-faint"><Target className="h-3.5 w-3.5" /> Mục tiêu hiện tại</p>
        <p className="mt-1 text-sm font-semibold text-navy">{preferences.learningGoal || 'Chưa đặt mục tiêu học tập'}</p>
        {preferences.careerGoal && <p className="mt-1 line-clamp-2 text-xs text-text-muted">{preferences.careerGoal}</p>}
      </div>
      <div className="rounded-lg border border-border bg-bg p-3">
        <div className="flex items-baseline justify-between gap-2"><p className="text-xs font-semibold text-navy">Nhịp tuần này</p><span className="text-xs font-bold text-primary">{calendar ? `${activeDays} ngày` : '—'}</span></div>
        <div className="mt-3 grid grid-cols-7 gap-1">{DAYS.map((day, index) => <div key={day.id} className="text-center"><div className={`mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold ${week[index]?.count ? 'bg-primary text-on-ink' : 'bg-border-soft text-text-faint'}`}>{week[index]?.count ? '✓' : '·'}</div><span className="text-2xs text-text-muted">{day.label}</span></div>)}</div>
        <p className="mt-3 text-2xs leading-relaxed text-text-muted">{preferences.weeklyStudyHours ? `Mục tiêu đã đặt: ${preferences.weeklyStudyHours} giờ/tuần.` : 'Chưa đặt số giờ mục tiêu.'} Đây không phải tổng thời gian đã học.</p>
      </div>
      <div className="flex items-start gap-3 rounded-lg border border-border p-3">
        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0"><p className="text-xs font-semibold text-navy">Buổi học tiếp theo</p>{nextSlot?.slot ? <p className="mt-1 text-xs text-text-muted">{nextSlot.offset === 0 ? 'Hôm nay' : nextSlot.offset === 1 ? 'Ngày mai' : nextSlot.day.label}, {nextSlot.slot.startTime} · {nextSlot.slot.durationMinutes} phút dự kiến</p> : <p className="mt-1 text-xs text-text-muted">Bạn chưa chọn lịch học trong tuần.</p>}</div>
      </div>
      <Link href="/profile?tab=personalization" className="block text-xs font-semibold text-primary hover:underline">Chỉnh mục tiêu và lịch học →</Link>
    </div>}
  </Card>;
}
