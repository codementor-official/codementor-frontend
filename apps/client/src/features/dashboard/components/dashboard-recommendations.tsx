import { useCallback, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRecommendations } from '@/features/recommendations/use-recommendations';
import { RecommendationNotice } from '@/features/recommendations/recommendation-feedback';
import { DashboardEmpty, DashboardSection, DashboardUnavailable } from './dashboard-section';
import { withDashboardTimeout } from '../dashboard-service';

const OPTIONS = [{ id: 'exercises', label: 'Bài luyện tập', href: '/practice' }, { id: 'courses', label: 'Khóa học', href: '/courses' }, { id: 'roadmaps', label: 'Lộ trình', href: '/roadmaps' }] as const;
export function DashboardRecommendations() {
  const [kind, setKind] = useState<'exercises' | 'courses' | 'roadmaps'>('exercises');
  const load = useCallback(() => withDashboardTimeout(() => api.recommendations[kind](4)), [kind]);
  const { data, error, isLoading, reload } = useRecommendations(load);
  const selected = OPTIONS.find((option) => option.id === kind)!;
  return <DashboardSection title="Gợi ý bước học tiếp theo" href={selected.href}>
    <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Loại nội dung đề xuất">{OPTIONS.map((option) => <Button size="sm" key={option.id} variant={kind === option.id ? 'primary' : 'outline'} aria-pressed={kind === option.id} onClick={() => setKind(option.id)}>{option.label}</Button>)}</div>
    {isLoading ? <Card className="h-56 animate-pulse bg-border-soft" aria-label="Đang tải đề xuất" /> : error ? <DashboardUnavailable onRetry={reload} /> : data && <>
      <RecommendationNotice personalized={data.personalized} />
      {!data.items.length ? <DashboardEmpty text="Chưa có nội dung phù hợp để đề xuất. Bạn có thể khám phá danh mục hoặc cập nhật sở thích." href={selected.href} action="Khám phá danh mục" /> : <ul className="grid gap-3 sm:grid-cols-2">{data.items.map((item) => <li key={item.id}><Link href={`${kind === 'exercises' ? '/solve' : selected.href}/${item.id}`} className="block h-full"><Card className="h-full p-4 transition-colors duration-150 hover:border-primary/50">
        <p className="mb-2 text-2xs font-semibold text-primary">{selected.label}</p><p className="line-clamp-2 text-sm font-semibold text-navy">{item.title}</p><p className="mt-2 text-xs text-text-muted">{item.reasons[0] ?? 'Nội dung được đề xuất từ danh mục công khai.'}</p><div className="mt-3 flex flex-wrap gap-1">{item.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded bg-border-soft px-2 py-1 text-2xs text-text-muted">{tag}</span>)}</div>
      </Card></Link></li>)}</ul>}
    </>}
  </DashboardSection>;
}
