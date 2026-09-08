import Link from 'next/link';
import { ArrowUpRight, CheckCircle2, ListChecks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { DashboardAction } from '../dashboard-priority';

export function DashboardTodayPlan({ items }: { items: DashboardAction[] }) {
  return <section className="flex min-w-0 flex-col">
    <div className="mb-3">
      <h2 className="flex items-center gap-2 text-base font-bold text-navy">
        <ListChecks className="h-4 w-4 text-primary" /> Kế hoạch hôm nay
      </h2>
      <p className="mt-1 text-xs text-text-muted">Tối đa ba việc thiết thực, không tự hoàn thành khi bạn chỉ mở nội dung.</p>
    </div>
    <Card className="flex-1 overflow-hidden">
      {items.length === 0 ? <div className="flex items-center gap-3 p-5">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-success" />
        <div>
          <p className="text-sm font-semibold text-navy">Hôm nay chưa có việc bổ sung</p>
          <p className="mt-1 text-xs text-text-muted">Hoàn thành ưu tiên chính hoặc khám phá một nội dung mới khi bạn sẵn sàng.</p>
        </div>
      </div> : <ol className="divide-y divide-border-soft">
        {items.map((item, index) => <li key={item.id}>
          <Link href={item.href} className="grid min-w-0 items-center gap-3 p-4 transition-colors duration-150 hover:bg-bg sm:grid-cols-[32px_minmax(0,1fr)_auto]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-bg text-xs font-bold text-primary">{index + 1}</span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 break-words text-sm font-semibold text-navy sm:truncate">{item.title}</span>
                {item.status && <Badge tone={item.status === 'Quá hạn' ? 'danger' : 'neutral'}>{item.status}</Badge>}
              </span>
              <span className="mt-1 block line-clamp-2 break-words text-xs text-text-muted">{item.reason}</span>
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-primary">{item.cta}<ArrowUpRight className="h-3.5 w-3.5" /></span>
          </Link>
        </li>)}
      </ol>}
    </Card>
  </section>;
}
