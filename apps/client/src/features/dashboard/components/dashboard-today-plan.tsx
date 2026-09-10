import Link from 'next/link';
import { ArrowUpRight, CheckCircle2, ListChecks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { DashboardAction } from '../dashboard-priority';

const KIND_LABEL: Record<DashboardAction['kind'], string> = {
  assignment: 'Bài nhóm',
  course: 'Khóa học',
  roadmap: 'Lộ trình',
  coach: 'AI Coach',
  practice: 'Luyện tập',
};

export function DashboardTodayPlan({ items }: { items: DashboardAction[] }) {
  return <section className="flex min-w-0 flex-col">
    <div className="mb-3">
      <h2 className="flex items-center gap-2 text-base font-bold text-navy"><ListChecks className="h-4 w-4 text-primary" /> Công việc cần ưu tiên</h2>
      <p className="mt-1 text-xs text-text-muted">Tối đa ba việc tiếp theo, xếp sau ưu tiên chính theo hạn nộp và tiến độ thực tế.</p>
    </div>
    <Card className="flex-1 overflow-hidden">
      {items.length === 0 ? <div className="flex items-center gap-3 p-5">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-success" />
        <div><p className="text-sm font-semibold text-navy">Chưa có việc bổ sung cần xử lý</p><p className="mt-1 text-xs text-text-muted">Hoàn thành ưu tiên chính hoặc khám phá nội dung mới khi bạn sẵn sàng.</p></div>
      </div> : <>
        <div className="hidden grid-cols-[minmax(0,1fr)_100px_100px_72px] items-center gap-3 border-b border-border-soft bg-bg px-4 py-2.5 text-2xs font-semibold text-text-muted sm:grid">
          <span>Công việc</span><span>Loại</span><span>Ưu tiên</span><span className="text-right">Thao tác</span>
        </div>
        <ol className="divide-y divide-border-soft">{items.map((item) => {
          const priority = item.status === 'Quá hạn' ? 'Khẩn cấp' : item.kind === 'coach' ? 'Đề xuất AI' : 'Theo tiến độ';
          return <li key={item.id}><Link href={item.href} className="grid min-w-0 items-center gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-bg sm:grid-cols-[minmax(0,1fr)_100px_100px_72px]">
            <span className="min-w-0"><span className="block truncate text-sm font-semibold text-navy">{item.title}</span><span className="mt-1 block truncate text-xs text-text-muted">{item.reason}</span></span>
            <span className="text-xs font-medium text-text-muted">{KIND_LABEL[item.kind]}</span>
            <Badge tone={item.status === 'Quá hạn' ? 'danger' : item.kind === 'coach' ? 'ai' : 'neutral'} className="w-fit">{priority}</Badge>
            <span className="flex items-center justify-end gap-1 text-xs font-semibold text-primary">{item.cta}<ArrowUpRight className="h-3.5 w-3.5" /></span>
          </Link></li>;
        })}</ol>
      </>}
    </Card>
  </section>;
}
