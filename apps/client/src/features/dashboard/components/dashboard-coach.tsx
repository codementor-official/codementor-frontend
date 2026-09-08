import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CheckCircle2, Eye, Loader2, Pin, PinOff, Sparkles, Target } from 'lucide-react';
import { SideDrawer, useToast } from '@codementor/ui';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import type { DashboardInsight } from '../types';
import { DashboardCoachVisual } from './dashboard-coach-visual';

interface DashboardCoachProps {
  data: DashboardInsight | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  onDataChange: (data: DashboardInsight) => void;
}

export function DashboardCoach({ data, isLoading, error, reload, onDataChange }: DashboardCoachProps) {
  const { user } = useAuth();
  const toast = useToast();
  const identity = useRef(user?.id);
  const [action, setAction] = useState<'generate' | 'apply' | 'unapply' | 'visibility' | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { identity.current = user?.id; }, [user?.id]);

  const runInsightAction = async (kind: 'generate' | 'apply' | 'unapply', run: () => Promise<DashboardInsight>, success: string) => {
    const userId = user?.id;
    if (!userId) return;
    setAction(kind);
    try {
      const next = await run();
      if (identity.current !== userId) return;
      onDataChange(next);
      if (kind === 'apply') setDrawerOpen(false);
      toast.success(success);
    } catch (cause) {
      if (identity.current === userId) toast.error(cause instanceof Error ? cause.message : 'Chưa thực hiện được. Vui lòng thử lại.');
    } finally {
      if (identity.current === userId) setAction(null);
    }
  };

  const setVisibility = async (hidden: boolean) => {
    const userId = user?.id;
    if (!userId) return;
    setAction('visibility');
    try {
      await api.dashboard.setInsightHidden(hidden);
      if (identity.current !== userId) return;
      setDrawerOpen(false);
      toast.success(hidden ? 'Đã ẩn AI Coach khỏi Dashboard.' : 'Đã hiện lại AI Coach.');
      reload();
    } catch (cause) {
      if (identity.current === userId) toast.error(cause instanceof Error ? cause.message : 'Không thể thay đổi hiển thị AI Coach.');
    } finally {
      if (identity.current === userId) setAction(null);
    }
  };

  const insight = data?.insight;
  const applied = Boolean(insight && data?.appliedAt);
  const firstStep = insight?.steps[0];

  if (!isLoading && data?.status === 'hidden') return <Card className="p-4"><div className="flex flex-wrap items-center gap-3">
    <span className="rounded-lg border border-border bg-bg p-2 text-primary"><Sparkles className="h-4 w-4" /></span>
    <div className="min-w-0 flex-1"><h2 className="text-sm font-bold text-navy">AI Coach đang được ẩn</h2><p className="mt-0.5 text-xs text-text-muted">Gợi ý đã lưu vẫn thuộc riêng tài khoản của bạn.</p></div>
    <Button size="sm" variant="outline" disabled={action !== null} onClick={() => void setVisibility(false)}><Eye className="h-4 w-4" /> Hiện lại</Button>
  </div></Card>;

  return <>
    <Card className={`overflow-hidden ${applied ? 'border-success/40' : 'border-primary/25'}`}>
      <div className="grid min-w-0 md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="flex min-w-0 flex-col justify-center p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-lg border p-2 ${applied ? 'border-success/30 bg-success/5 text-success' : 'border-border bg-bg text-primary'}`}>{applied ? <Pin className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}</span>
            <p className="text-2xs font-bold uppercase tracking-[0.18em] text-primary">AI Coach cá nhân</p>
            {applied && <span className="rounded-full border border-success/25 bg-success/5 px-2 py-0.5 text-2xs font-bold text-success">Đang áp dụng</span>}
          </div>
          <h2 className="mt-3 text-lg font-bold text-navy">Biến dữ liệu học tập thành một kế hoạch dễ hành động</h2>
          <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-relaxed text-text-muted">{applied && firstStep ? `Ưu tiên hiện tại: “${firstStep.title}”. Các bước đã được đưa vào Kế hoạch hôm nay.` : insight?.summary ?? 'Phân tích mục tiêu, tiến độ và hoạt động gần đây khi bạn yêu cầu; không tự tạo số liệu hay tự hoàn thành nội dung.'}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button size="sm" variant={insight ? 'outline' : 'primary'} onClick={() => setDrawerOpen(true)}>{insight ? 'Xem kế hoạch AI' : 'Tạo kế hoạch với AI'} <ArrowUpRight className="h-4 w-4" /></Button>
            <span className="text-2xs text-text-faint">Riêng tư · Chỉ chạy khi bạn yêu cầu</span>
          </div>
        </div>
        <div className="hidden min-h-40 border-l border-border-soft bg-bg md:block">
          <DashboardCoachVisual />
        </div>
      </div>
    </Card>

    <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="AI Coach của bạn" description="Xem đề xuất trước khi quyết định thêm vào kế hoạch hôm nay." footer={insight ? <>
      {applied ? <Button size="sm" variant="outline" disabled={action !== null} onClick={() => void runInsightAction('unapply', api.dashboard.removeAppliedInsight, 'Đã bỏ đề xuất khỏi kế hoạch hôm nay.')}>
        {action === 'unapply' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PinOff className="h-4 w-4" />} Bỏ khỏi kế hoạch
      </Button> : <Button size="sm" disabled={action !== null || insight.steps.length === 0} onClick={() => void runInsightAction('apply', api.dashboard.applyInsight, 'Đã thêm đề xuất vào kế hoạch hôm nay và cập nhật ưu tiên chính.')}>
        {action === 'apply' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pin className="h-4 w-4" />} Thêm vào kế hoạch hôm nay
      </Button>}
    </> : undefined}>
      <div className="space-y-5">
        {isLoading ? <div className="h-28 animate-pulse rounded-lg bg-border-soft" aria-label="Đang tải phân tích" /> : data?.status === 'disabled' ? <div><p className="text-sm text-text-muted">Bạn đang tắt sử dụng dữ liệu cho cá nhân hóa.</p><Link href="/profile?tab=personalization" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Điều chỉnh cá nhân hóa →</Link></div> : <>
          {error && !insight && <div className="rounded-lg border border-danger/25 p-3"><p className="text-sm text-text-muted">AI Coach tạm thời chưa kết nối được.</p><Button className="mt-3" variant="outline" size="sm" onClick={reload}>Thử lại</Button></div>}
          {insight ? <>
            {applied && <div className="rounded-lg border border-success/30 bg-success/5 p-3"><p className="flex items-center gap-2 text-sm font-semibold text-success"><CheckCircle2 className="h-4 w-4" /> Đề xuất đang được áp dụng</p><p className="mt-1 text-xs leading-relaxed text-text-muted">Bước đầu tiên đã trở thành ưu tiên chính; các bước còn lại xuất hiện trong kế hoạch hôm nay. Hệ thống không tự đăng ký hoặc đánh dấu hoàn thành nội dung.</p></div>}
            <div><p className="text-sm leading-relaxed text-text">{insight.summary}</p><div className="mt-3 rounded-lg border border-border bg-bg p-3"><p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-primary"><Target className="h-3.5 w-3.5" /> Trọng tâm đề xuất</p><p className="text-xs leading-relaxed text-text">{insight.focus}</p></div></div>
            <ol className="divide-y divide-border-soft rounded-lg border border-border">{insight.steps.map((step, index) => <li key={`${step.href}-${index}`} className="flex gap-3 p-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-ink">{index + 1}</span><div className="min-w-0 flex-1"><Link href={step.href} className="text-sm font-semibold text-navy hover:text-primary">{step.title} <ArrowUpRight className="inline h-3.5 w-3.5" /></Link><p className="mt-1 text-xs leading-relaxed text-text">{step.task}</p><p className="mt-1 text-2xs leading-relaxed text-text-muted">Lý do: {step.reason}</p></div></li>)}</ol>
            {!applied && <div className="rounded-lg border border-primary/25 bg-bg p-3"><p className="text-xs font-semibold text-navy">Khi thêm vào kế hoạch</p><p className="mt-1 text-xs leading-relaxed text-text-muted">“{firstStep?.title ?? 'Bước đầu tiên'}” sẽ trở thành ưu tiên chính và tối đa ba bước được đưa vào kế hoạch hôm nay. Bạn có thể bỏ áp dụng bất cứ lúc nào.</p></div>}
            {data?.generatedAt && <p className="text-2xs text-text-faint">Phân tích lúc {new Date(data.generatedAt).toLocaleString('vi-VN')}{data.stale ? ' · Có dữ liệu mới, bạn nên phân tích lại' : ''}</p>}
          </> : <div><p className="text-sm font-semibold text-navy">Nhận một kế hoạch ngắn dựa trên dữ liệu thật</p><p className="mt-2 text-xs leading-relaxed text-text-muted">AI dùng mục tiêu, nội dung đang học và hoạt động gần đây. Khi dữ liệu chưa đủ, kết quả chỉ là gợi ý khởi đầu.</p></div>}
          <Button className="w-full" size="sm" variant={insight ? 'outline' : 'primary'} disabled={action !== null || isLoading || data?.configured === false} onClick={() => void runInsightAction('generate', api.dashboard.generateInsight, insight ? 'Đã cập nhật phân tích bằng dữ liệu mới.' : 'Đã tạo đề xuất AI Coach.')}>
            {action === 'generate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{action === 'generate' ? 'Đang phân tích…' : insight ? 'Phân tích lại' : 'Tạo đề xuất'}
          </Button>
          {insight && <button type="button" disabled={action !== null} onClick={() => void setVisibility(true)} className="w-full text-center text-xs font-semibold text-text-faint hover:text-navy disabled:opacity-50">Ẩn AI Coach khỏi Dashboard</button>}
          <p className="text-2xs leading-relaxed text-text-faint">Lưu riêng theo tài khoản · Chỉ chạy khi bạn yêu cầu · Không dùng AI để tạo số liệu tiến độ.</p>
        </>}
      </div>
    </SideDrawer>
  </>;
}
