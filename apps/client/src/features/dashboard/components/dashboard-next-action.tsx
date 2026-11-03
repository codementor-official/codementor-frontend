import { ArrowRightIcon as ArrowRight, BookOpenIcon as BookOpen, CheckCircleIcon as CheckCircle2, ClipboardTextIcon as ClipboardText, ClockIcon as Clock3, CodeIcon as Code, MapTrifoldIcon as MapTrifold, SparkleIcon as Sparkle } from '@phosphor-icons/react/ssr';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { DashboardData } from '../dashboard-service';
import type { DashboardInsight } from '../types';
import { selectPrimaryAction, type DashboardAction } from '../dashboard-priority';

const KIND_ICON = {
  assignment: ClipboardText,
  course: BookOpen,
  roadmap: MapTrifold,
  coach: Sparkle,
  practice: Code,
} satisfies Record<DashboardAction['kind'], PhosphorIcon>;

export function DashboardNextAction({ data, coach }: { data: DashboardData; coach: DashboardInsight | null }) {
  const action = selectPrimaryAction(data, coach);
  const fromCoach = action.kind === 'coach';
  const KindIcon = KIND_ICON[action.kind];
  return <Card className="overflow-hidden">
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-border-soft text-navy"><KindIcon className="size-5" aria-hidden /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-sm bg-border-soft px-2 py-0.5 text-2xs font-bold text-navy">{action.label}</span>
          {action.status && <span className="rounded-sm bg-border-soft px-2 py-0.5 text-2xs font-semibold text-text-muted">{action.status}</span>}
        </div>
        <h2 className="mt-1.5 line-clamp-2 text-base font-bold text-navy">{action.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">{action.reason}</p>
        {action.progress !== undefined && <div className="mt-3 max-w-md"><ProgressBar value={action.progress} label={`${Math.round(action.progress)}% hoàn thành`} /></div>}
        {fromCoach && <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-success"><CheckCircle2 className="h-3.5 w-3.5" />Đã thêm vào kế hoạch từ AI Coach</p>}
      </div>
      <Button href={action.href}>{action.cta} <ArrowRight className="h-4 w-4" /></Button>
    </div>
    <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border-soft px-5 py-3 text-xs text-text-muted">
      <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-text-muted" />Ưu tiên từ tiến độ thật và hạn nộp</span>
      {data.preferences?.weeklyStudyHours && <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Mục tiêu {data.preferences.weeklyStudyHours} giờ mỗi tuần</span>}
    </div>
  </Card>;
}
