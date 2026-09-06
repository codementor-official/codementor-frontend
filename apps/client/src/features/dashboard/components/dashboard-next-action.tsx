import { ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { DashboardData } from '../dashboard-service';

export function DashboardNextAction({ data }: { data: DashboardData }) {
  const pending = data.assignments?.[0];
  const course = data.learning?.courses?.find((item) => item.status === 'active');
  const overdue = pending?.dueAt && Date.parse(pending.dueAt) < data.fetchedAt;
  const title = pending ? pending.exerciseTitle : course ? course.title : 'Bắt đầu một phiên luyện tập';
  const href = pending ? `/workspace/${pending.workspaceSlug}?tab=exercises` : course ? `/courses/${course.courseId}` : '/practice';
  const subtitle = pending ? `${pending.workspaceName} · ${overdue ? 'Bài đã quá hạn, hãy kiểm tra quy định nộp muộn.' : 'Bài được giao cho bạn, ưu tiên theo hạn nộp.'}` : course ? `Bạn đã hoàn thành ${Math.round(course.progressPercent)}%. Tiếp tục từ tiến độ đã lưu.` : 'Chọn một chủ đề phù hợp để bắt đầu tích lũy tiến độ.';
  return <Card className="overflow-hidden border-l-4 border-l-primary">
    <div className="flex flex-wrap items-center gap-4 p-5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-surface text-primary"><Play className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="mb-1 text-2xs font-bold uppercase tracking-wide text-primary">Ưu tiên tiếp theo</p><h2 className="line-clamp-2 text-lg font-bold text-navy">{title}</h2><p className="mt-1 text-xs text-text-muted">{subtitle}</p></div><Button href={href} size="sm">Bắt đầu <ArrowRight className="h-4 w-4" /></Button></div>
    <div className="flex flex-wrap gap-x-5 gap-y-2 px-5 py-3 text-xs text-text-muted"><span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" />Đề xuất dựa trên việc đang học và hạn nộp</span>{data.preferences?.weeklyStudyHours && <span>Mục tiêu của bạn: {data.preferences.weeklyStudyHours} giờ mỗi tuần</span>}</div>
  </Card>;
}
