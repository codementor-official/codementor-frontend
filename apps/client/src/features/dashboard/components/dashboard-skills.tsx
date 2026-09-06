import Link from 'next/link';
import { ArrowRight, CheckCircle2, Compass, PlayCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { ExerciseTopicSummary } from '@/types/catalogue';
import { DashboardSection, DashboardUnavailable } from './dashboard-section';

export function DashboardSkills({ topics, onRetry }: { topics: ExerciseTopicSummary[] | null; onRetry: () => void }) {
  if (topics === null) return <DashboardSection title="Tiến độ luyện tập theo chủ đề"><DashboardUnavailable onRetry={onRetry} /></DashboardSection>;
  const available = topics.filter((topic) => topic.count > 0);
  const active = available.filter((topic) => (topic.solved ?? 0) > 0 || (topic.attempted ?? 0) > 0)
    .sort((a, b) => (a.solved ?? 0) / a.count - (b.solved ?? 0) / b.count).slice(0, 6);
  const starters = available.filter((topic) => !active.some((item) => item.id === topic.id))
    .sort((a, b) => b.count - a.count).slice(0, 4);

  return <DashboardSection title="Tiến độ luyện tập theo chủ đề" href="/practice" action="Xem ngân hàng bài tập" description="Được cập nhật tự động từ các bài công khai bạn đã nộp; bài riêng trong Workspace không được tính.">
    {!active.length ? <Card className="overflow-hidden">
      <div className="border-b border-border-soft p-5"><div className="flex items-start gap-3"><span className="rounded-lg border border-border bg-bg p-2 text-primary"><Compass className="h-5 w-5" /></span><div><h3 className="text-sm font-bold text-navy">Bắt đầu theo dõi một chủ đề</h3><p className="mt-1 text-xs leading-relaxed text-text-muted">Không cần cấu hình thủ công. Chọn chủ đề, giải đạt ít nhất một bài công khai và tiến độ sẽ xuất hiện tại đây.</p></div></div>
        <ol className="mt-4 grid gap-2 sm:grid-cols-3">{[['1', 'Chọn chủ đề'], ['2', 'Nộp đạt một bài'], ['3', 'Theo dõi tiến độ']].map(([step, label]) => <li key={step} className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text-muted"><span className="font-bold text-primary">{step}</span>{label}</li>)}</ol>
      </div>
      <div className="p-5"><p className="mb-3 text-xs font-semibold text-navy">Chủ đề có thể bắt đầu ngay</p><div className="grid gap-2 sm:grid-cols-2">{starters.map((topic) => <Link key={topic.id} href={`/practice?topic=${encodeURIComponent(topic.slug)}`} className="flex items-center gap-3 rounded-lg border border-border p-3 transition hover:border-primary"><PlayCircle className="h-4 w-4 shrink-0 text-primary" /><span className="min-w-0 flex-1 truncate text-sm font-semibold text-navy">{topic.name}</span><span className="text-xs text-text-muted">{topic.count} bài</span><ArrowRight className="h-4 w-4 shrink-0 text-text-faint" /></Link>)}</div></div>
    </Card> : <Card className="p-4"><div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text-muted"><CheckCircle2 className="h-4 w-4 text-success" />Tiến độ được ghi nhận tự động khi bài công khai được chấm đạt.</div><div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">{active.map((topic) => <div key={topic.id}>
      <div className="mb-2 flex items-start justify-between gap-2 text-xs"><Link href={`/practice?topic=${encodeURIComponent(topic.slug)}`} className="font-semibold text-navy hover:text-primary">{topic.name} →</Link><span className="shrink-0 text-text-muted">{topic.solved ?? 0}/{topic.count} đã giải</span></div>
      <ProgressBar value={(topic.solved ?? 0) / topic.count * 100} label={`${Math.round((topic.solved ?? 0) / topic.count * 100)}% hoàn thành`} />
      {(topic.attempted ?? 0) > 0 && <p className="mt-1 text-2xs text-text-faint">{topic.attempted} bài đang thử</p>}
    </div>)}</div>{starters.length > 0 && <div className="mt-5 border-t border-border-soft pt-4"><p className="mb-2 text-xs text-text-muted">Mở rộng sang chủ đề mới</p><div className="flex flex-wrap gap-2">{starters.slice(0, 3).map((topic) => <Link key={topic.id} href={`/practice?topic=${encodeURIComponent(topic.slug)}`} className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-navy hover:border-primary hover:text-primary">{topic.name} · {topic.count}</Link>)}</div></div>}</Card>}
  </DashboardSection>;
}
