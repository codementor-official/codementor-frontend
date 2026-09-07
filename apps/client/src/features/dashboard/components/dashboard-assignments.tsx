import Link from 'next/link';
import { CheckCircle2, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DashboardData } from '../dashboard-service';
import { DashboardSection, DashboardUnavailable, type DashboardViewMode } from './dashboard-section';

export function DashboardAssignments({ data, onRetry, viewMode }: { data: DashboardData; onRetry: () => void; viewMode: DashboardViewMode }) {
  return <DashboardSection title="Bài tập nhóm cần xử lý" href="/workspace" action="Mở nhóm học tập" description="Các bài đang được giao cho bạn trong Workspace, ưu tiên bài sắp đến hạn hoặc đã quá hạn.">
    {data.assignments === null ? <DashboardUnavailable onRetry={onRetry} /> : <Card className="overflow-hidden">
      {!data.assignments.length ? <div className="flex items-center gap-3 p-5"><CheckCircle2 className="h-6 w-6 shrink-0 text-success" /><div><p className="text-sm font-semibold text-navy">Bạn đã xử lý hết bài được giao</p><p className="mt-1 text-xs text-text-muted">Không còn bài Workspace nào đang chờ. Bạn có thể tiếp tục khóa học hoặc luyện một bài công khai.</p></div></div> : viewMode === 'table' ? <>
        <div className="hidden grid-cols-[minmax(0,1fr)_110px_90px] gap-3 border-b border-border-soft bg-bg px-4 py-3 text-2xs font-semibold text-text-muted sm:grid"><span>Bài tập / Nhóm</span><span>Hạn nộp</span><span>Trạng thái</span></div>
        <ul className="divide-y divide-border-soft">{data.assignments.map((item) => {
          const overdue = item.dueAt && Date.parse(item.dueAt) < data.fetchedAt;
          return <li key={item.id}><Link href={`/workspace/${item.workspaceSlug}?tab=exercises`} className="grid items-center gap-2 p-4 transition-colors duration-150 hover:bg-bg sm:grid-cols-[minmax(0,1fr)_110px_90px] sm:gap-3"><div className="min-w-0"><p className="flex items-center gap-2 text-sm font-semibold text-navy"><span className="truncate">{item.exerciseTitle}</span><ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-text-faint" /></p><p className="mt-1 truncate text-xs text-text-muted">{item.workspaceName}</p></div><span className="text-xs text-text-muted">{item.dueAt ? new Date(item.dueAt).toLocaleDateString('vi-VN', { timeZone: data.learning?.timezone }) : 'Không hạn'}</span><Badge tone={overdue ? 'danger' : 'neutral'}>{overdue ? 'Quá hạn' : item.status === 'inprogress' ? 'Đang làm' : 'Chưa xong'}</Badge></Link></li>;
        })}</ul>
      </> : <ul className="grid gap-3 p-3 sm:grid-cols-2">{data.assignments.map((item) => { const overdue = item.dueAt && Date.parse(item.dueAt) < data.fetchedAt; return <li key={item.id}><Link href={`/workspace/${item.workspaceSlug}?tab=exercises`} className="block h-full rounded-lg border border-border p-4 transition-colors hover:border-primary/50 hover:bg-bg"><div className="flex items-start justify-between gap-3"><p className="line-clamp-2 text-sm font-semibold text-navy">{item.exerciseTitle}</p><Badge tone={overdue ? 'danger' : 'neutral'}>{overdue ? 'Quá hạn' : item.status === 'inprogress' ? 'Đang làm' : 'Chưa xong'}</Badge></div><p className="mt-2 truncate text-xs text-text-muted">{item.workspaceName}</p><p className="mt-4 text-xs text-text-muted">Hạn: {item.dueAt ? new Date(item.dueAt).toLocaleDateString('vi-VN', { timeZone: data.learning?.timezone }) : 'Không hạn'}</p></Link></li>; })}</ul>}
    </Card>}
  </DashboardSection>;
}
