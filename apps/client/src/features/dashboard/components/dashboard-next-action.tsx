import { ArrowRight, CheckCircle2, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { DashboardData } from '../dashboard-service';
import type { DashboardInsight } from '../types';
import { selectPrimaryAction } from '../dashboard-priority';
import { DashboardNextStepVisual } from './dashboard-learning-visuals';

export function DashboardNextAction({ data, coach }: { data: DashboardData; coach: DashboardInsight | null }) {
  const action = selectPrimaryAction(data, coach);
  const fromCoach = action.kind === 'coach';
  // Viền mảnh cả bốn cạnh, không phải vạch dày một bên: thẻ đã đứng đầu trang và mang nút
  // chính, chỉ cần tách nhẹ khỏi các thẻ còn lại.
  return <Card className="overflow-hidden border-primary/40">
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-surface text-primary"><DashboardNextStepVisual /></span>
      <div className="min-w-0 flex-1">
        <h2 className="line-clamp-2 text-lg font-bold text-navy">{action.title}</h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="rounded-sm bg-primary-tint px-2 py-0.5 text-2xs font-semibold text-primary">{action.label}</span>
          {action.status && <span className="rounded-sm bg-border-soft px-2 py-0.5 text-2xs font-semibold text-text-muted">{action.status}</span>}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">{action.reason}</p>
        {action.progress !== undefined && <div className="mt-3 max-w-md"><ProgressBar value={action.progress} label={`${Math.round(action.progress)}% hoàn thành`} /></div>}
        {fromCoach && <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-success"><CheckCircle2 className="h-3.5 w-3.5" />Đã thêm vào kế hoạch từ AI Coach</p>}
      </div>
      <Button href={action.href}>{action.cta} <ArrowRight className="h-4 w-4" /></Button>
    </div>
    <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border-soft px-5 py-3 text-xs text-text-muted">
      <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" />Ưu tiên từ tiến độ thật và hạn nộp</span>
      {data.preferences?.weeklyStudyHours && <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Mục tiêu {data.preferences.weeklyStudyHours} giờ mỗi tuần</span>}
    </div>
  </Card>;
}
