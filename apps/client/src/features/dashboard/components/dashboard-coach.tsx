import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  Pin,
  PinOff,
  Sparkles,
  Target,
} from 'lucide-react';
import { useToast } from '@codementor/ui';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import type { DashboardInsight } from '../types';
import type { DashboardViewMode } from './dashboard-section';

interface DashboardCoachProps {
  viewMode: DashboardViewMode;
  data: DashboardInsight | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  onDataChange: (data: DashboardInsight) => void;
}

export function DashboardCoach({
  viewMode,
  data,
  isLoading,
  error,
  reload,
  onDataChange,
}: DashboardCoachProps) {
  const { user } = useAuth();
  const toast = useToast();
  const identity = useRef(user?.id);
  const [action, setAction] = useState<'generate' | 'apply' | 'unapply' | 'visibility' | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    identity.current = user?.id;
  }, [user?.id]);

  const runInsightAction = async (
    kind: 'generate' | 'apply' | 'unapply',
    run: () => Promise<DashboardInsight>,
    success: string,
  ) => {
    const userId = user?.id;
    if (!userId) return;
    setAction(kind);
    try {
      const next = await run();
      if (identity.current !== userId) return;
      onDataChange(next);
      setExpanded(kind === 'generate');
      toast.success(success);
    } catch (cause) {
      if (identity.current === userId) {
        toast.error(cause instanceof Error ? cause.message : 'Chưa thực hiện được. Vui lòng thử lại.');
      }
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
      toast.success(hidden ? 'Đã ẩn phân tích AI Coach.' : 'Đã hiện lại phân tích AI Coach.');
      reload();
    } catch (cause) {
      if (identity.current === userId) {
        toast.error(cause instanceof Error ? cause.message : 'Không thể thay đổi hiển thị AI Coach.');
      }
    } finally {
      if (identity.current === userId) setAction(null);
    }
  };

  const insight = data?.insight;
  const applied = Boolean(insight && data?.appliedAt);
  const appliedTime = data?.appliedAt
    ? new Date(data.appliedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
    : null;

  if (!isLoading && data?.status === 'hidden') {
    return <Card className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-lg border border-border bg-bg p-2 text-primary"><Sparkles className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-navy">Phân tích AI Coach đang được ẩn</h2>
          <p className="mt-0.5 text-xs text-text-muted">Kế hoạch vẫn được lưu riêng trong tài khoản của bạn.</p>
        </div>
        <Button size="sm" variant="outline" disabled={action !== null} onClick={() => void setVisibility(false)}>
          <Eye className="h-4 w-4" /> Hiện lại
        </Button>
      </div>
    </Card>;
  }

  return <Card className={`overflow-hidden ${applied ? 'border-success/40' : 'border-primary/25'}`}>
    <div className={`flex items-start gap-3 p-5 ${expanded ? 'border-b border-border-soft' : ''}`}>
      <span className={`rounded-lg border p-2 ${applied ? 'border-success/30 bg-success/5 text-success' : 'border-border bg-bg text-primary'}`}>
        {applied ? <Pin className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-bold text-navy">AI Coach của bạn</h2>
          {applied && <span className="rounded-full border border-success/25 bg-success/5 px-2 py-0.5 text-2xs font-bold text-success">Đang áp dụng</span>}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-text-muted">
          {applied
            ? `Dashboard đang ưu tiên bước đầu tiên trong kế hoạch${appliedTime ? ` · Áp dụng ${appliedTime}` : ''}.`
            : insight
              ? 'Phân tích đã sẵn sàng. Xem rõ Dashboard sẽ thay đổi gì trước khi áp dụng.'
              : 'Phân tích nhịp học và đề xuất tối đa 3 bước có thể thực hiện ngay.'}
        </p>
      </div>
      {insight && <button
        type="button"
        aria-label="Ẩn phân tích AI"
        title="Ẩn phân tích"
        disabled={action !== null}
        onClick={() => void setVisibility(true)}
        className="rounded-md p-2 text-text-muted hover:bg-bg hover:text-navy disabled:opacity-50"
      ><EyeOff className="h-4 w-4" /></button>}
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className="rounded-md border border-border bg-surface p-2 text-text-muted hover:text-navy"
        aria-label={expanded ? 'Thu gọn AI Coach' : 'Mở AI Coach'}
      >{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
    </div>

    {!expanded && applied && insight && <div className="border-t border-border-soft p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold text-success"><CheckCircle2 className="h-4 w-4" /> Dashboard đã được cập nhật</p>
          <p className="mt-1 text-2xs text-text-muted">“Ưu tiên tiếp theo” đang dùng bước đầu tiên; toàn bộ kế hoạch được ghim bên dưới.</p>
        </div>
        <button type="button" onClick={() => setExpanded(true)} className="text-xs font-semibold text-primary hover:underline">Xem phân tích và quản lý</button>
      </div>
      <ol className={viewMode === 'table' ? 'divide-y divide-border-soft rounded-lg border border-border' : 'grid gap-2 sm:grid-cols-3'}>
        {insight.steps.map((step, index) => <li key={`${step.href}-${index}`} className={viewMode === 'table' ? '' : 'rounded-lg border border-border bg-bg p-3'}>
          <Link href={step.href} className={`group flex min-w-0 items-center gap-3 ${viewMode === 'table' ? 'px-3 py-2.5' : 'items-start'}`}>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-2xs font-bold text-on-ink">{index + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-navy group-hover:text-primary">{step.title}</span>
              {viewMode === 'cards' && <span className="mt-1 line-clamp-2 block text-2xs leading-relaxed text-text-muted">{step.task}</span>}
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-text-faint group-hover:text-primary" />
          </Link>
        </li>)}
      </ol>
    </div>}

    {expanded && <div className="space-y-4 p-5">
      {isLoading ? <div className="h-24 animate-pulse rounded bg-border-soft" /> : data?.status === 'disabled' ? <>
        <p className="text-sm text-text-muted">Bạn đang tắt sử dụng dữ liệu để cá nhân hóa.</p>
        <Link href="/profile?tab=personalization" className="text-xs font-semibold text-primary">Điều chỉnh lựa chọn cá nhân hóa →</Link>
      </> : <>
        {error && !insight && <div className="rounded-lg border border-danger/25 p-3">
          <p className="text-xs text-text-muted">AI Coach tạm thời chưa kết nối được.</p>
          <Button className="mt-2" variant="outline" size="sm" onClick={reload}>Kết nối lại</Button>
        </div>}
        {insight ? <>
          {applied && <div className="rounded-lg border border-success/30 bg-success/5 px-3 py-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-success"><CheckCircle2 className="h-4 w-4" /> Thay đổi đã áp dụng trên Dashboard</p>
            <ul className="mt-2 space-y-1 text-2xs leading-relaxed text-text-muted">
              <li>• Thẻ “Ưu tiên tiếp theo” chuyển sang bước đầu tiên của kế hoạch.</li>
              <li>• Kế hoạch {insight.steps.length} bước được ghim để bạn mở lại bất cứ lúc nào.</li>
              <li>• Không tự đăng ký khóa học, nộp bài hoặc thay đổi lịch học.</li>
            </ul>
          </div>}
          <div>
            <p className="text-sm leading-relaxed text-text">{insight.summary}</p>
            <div className="mt-3 rounded-lg border border-border bg-bg p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-primary"><Target className="h-3.5 w-3.5" /> Trọng tâm đề xuất</p>
              <p className="text-xs leading-relaxed text-text">{insight.focus}</p>
            </div>
          </div>
          <ol className="space-y-4">
            {insight.steps.map((step, index) => <li key={`${step.href}-${index}`} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-bg text-xs font-bold text-primary">{index + 1}</span>
              <div className="min-w-0">
                <Link href={step.href} className="text-sm font-semibold text-navy hover:text-primary">{step.title} <ArrowUpRight className="inline h-3 w-3" /></Link>
                <p className="mt-1 text-xs leading-relaxed text-text">{step.task}</p>
                <p className="mt-1 text-2xs text-text-muted">Vì sao: {step.reason}</p>
              </div>
            </li>)}
          </ol>
          {!applied && <div className="rounded-lg border border-primary/25 bg-bg p-3">
            <p className="text-xs font-semibold text-navy">Khi áp dụng, điều gì sẽ thay đổi?</p>
            <p className="mt-1 text-2xs leading-relaxed text-text-muted">Dashboard sẽ đưa “{insight.steps[0]?.title ?? 'bước ưu tiên đầu tiên'}” lên thẻ ưu tiên chính và ghim toàn bộ kế hoạch. Bạn vẫn là người quyết định khi nào mở và hoàn thành từng nội dung.</p>
          </div>}
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {applied ? <Button
              size="sm"
              variant="outline"
              disabled={action !== null}
              onClick={() => void runInsightAction('unapply', api.dashboard.removeAppliedInsight, 'Đã bỏ áp dụng kế hoạch. Dashboard quay lại ưu tiên tự động.')}
            >{action === 'unapply' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PinOff className="h-4 w-4" />} Bỏ áp dụng kế hoạch</Button> : <Button
              size="sm"
              disabled={action !== null || insight.steps.length === 0}
              onClick={() => void runInsightAction('apply', api.dashboard.applyInsight, 'Đã áp dụng. Ưu tiên và kế hoạch trên Dashboard đã được cập nhật.')}
            >{action === 'apply' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pin className="h-4 w-4" />} Áp dụng lên Dashboard</Button>}
            {insight.steps[0] && <Button href={insight.steps[0].href} size="sm" variant="outline">Xem bước ưu tiên <ArrowUpRight className="h-4 w-4" /></Button>}
          </div>
          {data?.generatedAt && <p className="text-2xs text-text-faint">Phân tích lúc {new Date(data.generatedAt).toLocaleString('vi-VN')}{data.stale ? ' · Nên cập nhật với tiến độ mới' : ''}</p>}
        </> : <>
          <p className="text-sm font-semibold text-navy">Bạn nên tập trung vào đâu tiếp theo?</p>
          <p className="text-xs leading-relaxed text-text-muted">AI sử dụng mục tiêu, hoạt động gần đây và nội dung đang học để giải thích ưu tiên và gợi ý việc có thể bắt đầu ngay.</p>
        </>}
        <Button
          className="w-full"
          size="sm"
          variant={insight ? 'outline' : 'primary'}
          disabled={action !== null || isLoading || data?.configured === false}
          onClick={() => void runInsightAction('generate', api.dashboard.generateInsight, insight ? 'Đã cập nhật phân tích bằng dữ liệu mới.' : 'Đã tạo kế hoạch AI Coach.')}
        >{action === 'generate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{action === 'generate' ? 'Đang phân tích tiến độ…' : insight ? 'Phân tích lại với dữ liệu mới' : 'Phân tích và lập kế hoạch'}</Button>
        <p className="text-2xs leading-relaxed text-text-faint">{data?.configured === false ? 'Tính năng AI chưa sẵn sàng.' : 'Lưu riêng theo tài khoản · Chỉ chạy khi bạn yêu cầu · Có thể ẩn hoặc bỏ áp dụng bất cứ lúc nào.'}</p>
      </>}
    </div>}
  </Card>;
}
