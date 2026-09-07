import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowUpRight, Loader2, Target, EyeOff, Eye, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { useRecommendations } from '@/features/recommendations/use-recommendations';
import type { DashboardViewMode } from './dashboard-section';

export function DashboardCoach({ viewMode }: { viewMode: DashboardViewMode }) {
  const { user } = useAuth();
  const identity = useRef(user?.id);
  useEffect(() => { identity.current = user?.id; }, [user?.id]);
  const { data, isLoading, error, reload } = useRecommendations(api.dashboard.insight);
  const [action, setAction] = useState<'generate' | 'apply' | 'visibility' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const perform = async (kind: NonNullable<typeof action>, run: () => Promise<unknown>, success?: string) => {
    const userId = user?.id;
    if (!userId) return;
    setAction(kind); setNotice(null);
    try {
      await run();
      if (identity.current === userId) {
        setNotice(success ?? null);
        if (kind === 'apply') setExpanded(false);
        reload();
      }
    } catch {
      if (identity.current === userId) setNotice('Chưa thực hiện được. Dịch vụ có thể đang bận, vui lòng thử lại.');
    } finally { if (identity.current === userId) setAction(null); }
  };

  const insight = data?.insight;
  if (!isLoading && data?.status === 'hidden') return <Card className="p-4">
    <div className="flex items-center gap-3"><span className="rounded-lg border border-border bg-bg p-2 text-primary"><Sparkles className="h-4 w-4" /></span><div className="min-w-0 flex-1"><h2 className="text-sm font-bold text-navy">Phân tích AI đang được ẩn</h2><p className="mt-0.5 text-xs text-text-muted">Kết quả vẫn được lưu riêng trong tài khoản của bạn.</p></div><Button size="sm" variant="outline" disabled={action !== null} onClick={() => void perform('visibility', () => api.dashboard.setInsightHidden(false))}><Eye className="h-4 w-4" /> Hiện lại</Button></div>
  </Card>;

  return <Card className="overflow-hidden border-primary/25">
    <div className={`flex items-start gap-3 bg-bg p-5 ${expanded ? "border-b border-border-soft" : ""}`}><span className="rounded-lg border border-border bg-surface p-2 text-primary"><Sparkles className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h2 className="text-base font-bold text-navy">AI Coach của bạn</h2><p className="mt-1 text-xs leading-relaxed text-text-muted">{insight ? (data?.appliedAt ? "Kế hoạch đang được ghim trên Dashboard." : "Đã có phân tích mới và kế hoạch tối đa 3 bước.") : "Phân tích nhịp học và đề xuất bước tiếp theo."}</p></div>{insight && <button type="button" aria-label="Ẩn phân tích AI" title="Ẩn phân tích" disabled={action !== null} onClick={() => void perform('visibility', () => api.dashboard.setInsightHidden(true))} className="rounded-md p-2 text-text-muted hover:bg-surface hover:text-navy disabled:opacity-50"><EyeOff className="h-4 w-4" /></button>}<button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)} className="rounded-md border border-border bg-surface p-2 text-text-muted hover:text-navy" aria-label={expanded ? "Thu gọn AI Coach" : "Mở AI Coach"}>{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button></div>
    {!expanded && insight && data?.appliedAt && <div className="border-t border-border-soft p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="flex items-center gap-2 text-xs font-bold text-success"><CheckCircle2 className="h-4 w-4" /> Kế hoạch đang áp dụng</p><p className="mt-1 text-2xs text-text-muted">Các đề xuất đã được ghim thành danh sách hành động ngay trên Dashboard.</p></div><button type="button" onClick={() => setExpanded(true)} className="text-xs font-semibold text-primary hover:underline">Xem phân tích</button></div>
      <ol className={viewMode === 'table' ? 'divide-y divide-border-soft rounded-lg border border-border' : 'grid gap-2 sm:grid-cols-3'}>{insight.steps.map((step, index) => <li key={step.href} className={viewMode === 'table' ? '' : 'rounded-lg border border-border bg-bg p-3'}><Link href={step.href} className={`group flex min-w-0 items-center gap-3 ${viewMode === 'table' ? 'px-3 py-2.5' : 'items-start'}`}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-2xs font-bold text-on-ink">{index + 1}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-navy group-hover:text-primary">{step.title}</span>{viewMode === 'cards' && <span className="mt-1 line-clamp-2 block text-2xs leading-relaxed text-text-muted">{step.task}</span>}</span><ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-text-faint group-hover:text-primary" /></Link></li>)}</ol>
    </div>}
    {expanded && <div className="space-y-4 p-5">
      {isLoading ? <div className="h-24 animate-pulse rounded bg-border-soft" /> : data?.status === 'disabled' ? <><p className="text-sm text-text-muted">Bạn đang tắt sử dụng dữ liệu để cá nhân hóa.</p><Link href="/profile?tab=personalization" className="text-xs font-semibold text-primary">Điều chỉnh lựa chọn cá nhân hóa →</Link></> : <>
        {error && !insight && <><p className="text-xs text-text-muted">AI Coach tạm thời chưa kết nối được.</p><Button variant="outline" size="sm" onClick={reload}>Kết nối lại</Button></>}
        {insight ? <>
          {data?.appliedAt && <div className="rounded-lg border border-success/30 bg-surface px-3 py-2"><p className="flex items-center gap-2 text-xs font-semibold text-success"><CheckCircle2 className="h-4 w-4" /> Kế hoạch này đang được ghim trên Dashboard</p><p className="mt-1 text-2xs leading-relaxed text-text-muted">Các bước bên dưới là danh sách ưu tiên của bạn; thao tác này không tự thay đổi lịch học hoặc đăng ký nội dung.</p></div>}
          <p className="text-sm leading-relaxed text-text">{insight.summary}</p>
          <div className="rounded-lg border border-border bg-bg p-3"><p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-primary"><Target className="h-3.5 w-3.5" /> Trọng tâm đề xuất</p><p className="text-xs leading-relaxed text-text">{insight.focus}</p></div>
          <ol className="space-y-4">{insight.steps.map((step, index) => <li key={step.href} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-bg text-xs font-bold text-primary">{index + 1}</span><div className="min-w-0"><Link href={step.href} className="text-sm font-semibold text-navy hover:text-primary">{step.title} <ArrowUpRight className="inline h-3 w-3" /></Link><p className="mt-1 text-xs leading-relaxed text-text">{step.task}</p><p className="mt-1 text-2xs text-text-muted">{step.reason}</p></div></li>)}</ol>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1"><Button size="sm" disabled={action !== null || Boolean(data?.appliedAt)} onClick={() => void perform('apply', api.dashboard.applyInsight, 'Đã ghim các bước hành động lên Dashboard.')}><CheckCircle2 className="h-4 w-4" />{data?.appliedAt ? 'Kế hoạch đang áp dụng' : 'Ghim kế hoạch lên Dashboard'}</Button>{insight.steps[0] && <Button href={insight.steps[0].href} size="sm" variant="outline">Mở nội dung đề xuất <ArrowUpRight className="h-4 w-4" /></Button>}</div>
          {data?.generatedAt && <p className="text-2xs text-text-faint">Phân tích lúc {new Date(data.generatedAt).toLocaleString('vi-VN')}{data.stale ? ' · Nên cập nhật với tiến độ mới' : ''}</p>}
        </> : <><p className="text-sm font-semibold text-navy">Bạn nên tập trung vào đâu tiếp theo?</p><p className="text-xs leading-relaxed text-text-muted">AI sử dụng mục tiêu, hoạt động gần đây và nội dung đang học để giải thích ưu tiên và gợi ý việc có thể bắt đầu ngay.</p></>}
        {notice && <p role="status" className="text-xs text-primary">{notice}</p>}
        <Button className="w-full" size="sm" variant={insight ? 'outline' : 'primary'} disabled={action !== null || isLoading || data?.configured === false} onClick={() => void perform('generate', api.dashboard.generateInsight)}>{action === 'generate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{action === 'generate' ? 'Đang phân tích tiến độ…' : insight ? 'Phân tích lại với dữ liệu mới' : 'Phân tích và lập kế hoạch'}</Button>
        <p className="text-2xs leading-relaxed text-text-faint">{data?.configured === false ? 'Tính năng AI chưa sẵn sàng.' : 'Lưu riêng theo tài khoản trong hệ thống · Chỉ chạy khi bạn yêu cầu · Có thể ẩn hoặc áp dụng bất cứ lúc nào.'}</p>
      </>}
    </div>}
  </Card>;
}
