import Link from 'next/link';
import { CalendarDays, Trophy, Clock3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { DashboardData } from '../dashboard-service';
import { DashboardUnavailable } from './dashboard-section';

const DAYS: Record<string, string> = { mon: 'T2', tue: 'T3', wed: 'T4', thu: 'T5', fri: 'T6', sat: 'T7', sun: 'CN' };
export function DashboardPlanner({ data, onRetry }: { data: DashboardData; onRetry: () => void }) {
  const preferences = data.preferences;
  const calendar = data.learning?.calendar;
  const today = calendar?.days.at(-1)?.date;
  const weekday = today ? (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7 : 0;
  const week = calendar?.days.slice(-(weekday + 1)) ?? [];
  const active = week.filter((day) => day.count > 0).length;
  const schedule = preferences?.schedule.filter((slot) => slot.enabled) ?? [];
  const completed = data.learning?.courses?.filter((item) => item.status === 'completed').length;
  return <Card className="overflow-hidden">
    <div className="border-b border-border-soft p-5"><h2 className="flex items-center gap-2 text-base font-bold text-navy"><CalendarDays className="h-4 w-4 text-primary" /> Kế hoạch cá nhân</h2><p className="mt-1 text-xs text-text-muted">Giữ nhịp học phù hợp với mục tiêu của bạn</p></div>
    {!preferences ? <div className="p-4"><DashboardUnavailable onRetry={onRetry} /></div> : <div className="space-y-5 p-5">
      <div><p className="text-2xs font-semibold uppercase tracking-wide text-text-faint">Mục tiêu hiện tại</p><p className="mt-1 text-sm font-semibold text-navy">{preferences.learningGoal || 'Chưa đặt mục tiêu học tập'}</p>{preferences.careerGoal && <p className="mt-1 text-xs text-text-muted">{preferences.careerGoal}</p>}<div className="mt-3 flex flex-wrap gap-1">{preferences.interestedTechnologies.slice(0, 5).map((topic) => <span key={topic} className="rounded border border-border bg-bg px-2 py-1 text-2xs font-medium text-text-muted">{topic}</span>)}</div></div>
      <div className="rounded-lg bg-bg p-3"><div className="flex items-baseline justify-between gap-2"><p className="text-xs font-semibold text-navy">Nhịp học tuần này</p><span className="text-xs font-bold text-primary">{calendar ? active : '—'} ngày</span></div><div className="mt-3 grid grid-cols-7 gap-1">{Object.entries(DAYS).map(([id, label], i) => <div key={id} className="text-center"><div className={`mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold ${week[i]?.count ? 'bg-primary text-on-ink' : 'bg-border-soft text-text-faint'}`}>{week[i]?.count ? '✓' : '·'}</div><span className="text-2xs text-text-muted">{label}</span></div>)}</div><p className="mt-3 text-2xs text-text-muted">{preferences.weeklyStudyHours ? `${preferences.weeklyStudyHours} giờ/tuần đã đặt` : 'Chưa đặt số giờ mục tiêu'} · {schedule.length} ngày có lịch</p></div>
      <div><h3 className="mb-2 text-xs font-bold text-navy">Khung giờ bạn đã chọn</h3>{schedule.length ? <ul className="space-y-2">{schedule.map((slot) => <li key={slot.weekday} className="flex items-center gap-2 text-xs"><span className="w-6 text-text-muted">{DAYS[slot.weekday]}</span><span className="font-semibold text-navy">{slot.startTime}</span><span className="ml-auto text-text-muted">{slot.durationMinutes} phút</span></li>)}</ul> : <p className="text-xs text-text-muted">Thêm khung giờ để việc học trở thành thói quen.</p>}</div>
      <Link href="/profile?tab=personalization" className="block text-xs font-semibold text-primary hover:underline">Chỉnh mục tiêu và lịch học →</Link>
    </div>}
    <div className="border-t border-border-soft p-5"><h3 className="mb-3 flex items-center gap-2 text-xs font-bold text-navy"><Trophy className="h-4 w-4 text-primary" /> Dấu mốc của bạn</h3><dl className="space-y-2 text-xs"><div className="flex justify-between"><dt className="text-text-muted">Khóa học hoàn thành</dt><dd className="font-semibold text-navy">{completed ?? '—'}</dd></div><div className="flex justify-between"><dt className="text-text-muted">Chuỗi giải bài dài nhất</dt><dd className="font-semibold text-navy">{data.stats ? `${data.stats.longestStreakDays} ngày` : '—'}</dd></div></dl></div>
    <div className="border-t border-border-soft p-5"><h3 className="mb-3 flex items-center gap-2 text-xs font-bold text-navy"><Clock3 className="h-4 w-4 text-primary" /> Gần đây</h3>{data.learning?.activities?.length ? <ul className="space-y-3">{data.learning.activities.slice(0, 3).map((item, i) => <li key={`${item.occurredAt}-${i}`} className="border-l-2 border-primary/25 pl-3"><p className="line-clamp-2 text-xs font-medium text-navy">{item.title}</p><p className="mt-1 text-2xs text-text-faint">{new Date(item.occurredAt).toLocaleDateString('vi-VN')}</p></li>)}</ul> : <p className="text-xs text-text-muted">Chưa có hoạt động gần đây.</p>}<Link href="/profile" className="mt-3 block text-xs font-semibold text-primary hover:underline">Xem hồ sơ và hoạt động →</Link></div>
  </Card>;
}
