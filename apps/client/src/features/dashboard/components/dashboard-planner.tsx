import { ClockIcon as Clock3, FireIcon as Flame, TargetIcon as Target } from '@phosphor-icons/react/ssr';
import { Card } from '@/components/ui/card';
import type { DashboardData } from '../dashboard-service';
import { DashboardCardHeader, DashboardUnavailable } from './dashboard-section';

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
    <DashboardCardHeader title="Mục tiêu tuần" href="/profile?tab=personalization" action="Điều chỉnh" />
    {!preferences ? <div className="p-4"><DashboardUnavailable onRetry={onRetry} /></div> : <div className="flex flex-col p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs text-text-muted"><Target className="h-3.5 w-3.5" /> Mục tiêu hiện tại</p>
          <p className="mt-1 truncate text-sm font-semibold text-navy">{preferences.learningGoal || 'Chưa đặt mục tiêu học tập'}</p>
          {preferences.careerGoal && <p className="mt-0.5 truncate text-xs text-text-muted">{preferences.careerGoal}</p>}
        </div>
      </div>

      <div className="mt-3 border-t border-border-soft pt-3">
        <div className="flex items-baseline justify-between gap-2"><p className="text-xs font-semibold text-navy">Nhịp tuần này</p><span className="text-xs font-bold text-primary">{calendar ? `${activeDays}/${enabledSchedule.length || '—'} ngày` : '—'}</span></div>
        <div className="mt-2 grid grid-cols-7 gap-1">{DAYS.map((day, index) => <div key={day.id} className="text-center"><div role="img" aria-label={`${day.label}: ${week[index]?.count ? 'có hoạt động' : 'chưa có hoạt động'}`} className={`h-7 rounded-md ${week[index]?.count ? 'bg-primary' : 'bg-border-soft'}`} /><span className="mt-1 block text-2xs text-text-muted">{day.label}</span></div>)}</div>
        <p className="mt-2 truncate text-2xs text-text-muted">{preferences.weeklyStudyHours ? `Mục tiêu ${preferences.weeklyStudyHours} giờ/tuần` : 'Chưa đặt số giờ mục tiêu'} · thời gian dự kiến</p>
      </div>

      <div className="mt-3 grid gap-3 border-t border-border-soft pt-3 sm:grid-cols-2 xl:grid-cols-1">
        <div className="flex min-w-0 items-center gap-3"><Clock3 className="h-4 w-4 shrink-0 text-text-muted" /><div className="min-w-0"><p className="text-xs font-semibold text-navy">Buổi tiếp theo</p>{nextSlot?.slot ? <p className="mt-0.5 truncate text-xs text-text-muted">{nextSlot.offset === 0 ? 'Hôm nay' : nextSlot.offset === 1 ? 'Ngày mai' : nextSlot.day.label}, {nextSlot.slot.startTime} · {nextSlot.slot.durationMinutes} phút</p> : <p className="mt-0.5 truncate text-xs text-text-muted">Chưa có lịch trong tuần</p>}</div></div>
        <div className="flex min-w-0 items-center gap-3"><Flame className="h-4 w-4 shrink-0 text-text-muted" /><div className="min-w-0"><p className="text-xs font-semibold text-navy">Chuỗi giải bài</p><p className="mt-0.5 truncate text-xs text-text-muted">{data.stats ? `${data.stats.currentStreakDays} ngày · kỷ lục ${data.stats.longestStreakDays}` : 'Chưa tải được dữ liệu'}</p></div></div>
      </div>
    </div>}
  </Card>;
}
