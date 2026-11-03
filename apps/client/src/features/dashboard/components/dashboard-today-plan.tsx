import Link from 'next/link';
import { CheckCircleIcon as CheckCircle2 } from '@phosphor-icons/react/ssr';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { DashboardAction } from '../dashboard-priority';
import { DashboardCardHeader } from './dashboard-section';

const KIND_LABEL: Record<DashboardAction['kind'], string> = {
  assignment: 'Bài nhóm',
  course: 'Khóa học',
  roadmap: 'Lộ trình',
  coach: 'AI Coach',
  practice: 'Luyện tập',
};

export function DashboardTodayPlan({ items }: { items: DashboardAction[] }) {
  return <Card className="overflow-hidden">
    <DashboardCardHeader title="Công việc cần ưu tiên" description="Tối đa ba việc tiếp theo, xếp theo hạn nộp và tiến độ thực tế." />
    {items.length === 0 ? <div className="flex items-center gap-3 p-4">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
      <div><p className="text-sm font-semibold text-navy">Chưa có việc bổ sung cần xử lý</p><p className="mt-0.5 text-xs text-text-muted">Hoàn thành ưu tiên chính hoặc khám phá nội dung mới khi bạn sẵn sàng.</p></div>
    </div> : <ol className="divide-y divide-border-soft">{items.map((item) => {
      const overdue = item.status === 'Quá hạn';
      return <li key={item.id}><Link href={item.href} className="flex min-w-0 items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-bg">
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-navy">{item.title}</span><span className="mt-0.5 block truncate text-xs text-text-muted">{KIND_LABEL[item.kind]} · {item.reason}</span></span>
        {(overdue || item.kind === 'coach') && <Badge tone={overdue ? 'danger' : 'ai'} className="shrink-0">{overdue ? 'Quá hạn' : 'Đề xuất AI'}</Badge>}
        <span className="shrink-0 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-navy">{item.cta}</span>
      </Link></li>;
    })}</ol>}
  </Card>;
}
