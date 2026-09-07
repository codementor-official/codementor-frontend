"use client";

import { useState } from 'react';
import { LayoutDashboard, LayoutGrid, List, RefreshCw } from 'lucide-react';
import { StatStrip } from '@codementor/ui';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CatalogueSkeleton } from '@/components/ui/catalogue-state';
import { useAuth } from '@/providers/auth-provider';
import { useRecommendations } from '@/features/recommendations/use-recommendations';
import { loadDashboard } from '../dashboard-service';
import { ContinueLearning } from './continue-learning';
import { DashboardTrends } from './dashboard-trends';
import { DashboardNextAction } from './dashboard-next-action';
import { DashboardAssignments } from './dashboard-assignments';
import { DashboardCoach } from './dashboard-coach';
import { DashboardPlanner } from './dashboard-planner';
import { DashboardRecommendations } from './dashboard-recommendations';
import { DashboardUnavailable, type DashboardViewMode } from './dashboard-section';

export function LearningDashboardScreen() {
  const [viewMode, setViewMode] = useState<DashboardViewMode>('table');
  const { user } = useAuth();
  const { data, isLoading, error, reload } = useRecommendations(loadDashboard);
  const stats = data?.stats;
  const learning = data?.learning;
  return <div className="min-w-0">
    <PageHeader icon={LayoutDashboard} title={`Chào ${user?.displayName ?? 'bạn'}`} subtitle="Tiếp nối việc học, theo dõi mục tiêu và chọn bước tiếp theo của bạn." />
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Button href="/profile?tab=personalization" size="sm" variant="outline">Hồ sơ học tập</Button>
      <Button size="sm" variant="ghost" disabled={isLoading} onClick={reload}><RefreshCw className="h-4 w-4" /> Cập nhật</Button>
      <div className="ml-auto inline-flex rounded-lg border border-border bg-surface p-1" role="group" aria-label="Kiểu hiển thị Dashboard">
        <button type="button" aria-pressed={viewMode === 'table'} onClick={() => setViewMode('table')} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${viewMode === 'table' ? 'bg-navy text-on-ink shadow-sm' : 'text-text-muted hover:text-navy'}`}><List className="h-3.5 w-3.5" /> Bảng</button>
        <button type="button" aria-pressed={viewMode === 'cards'} onClick={() => setViewMode('cards')} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${viewMode === 'cards' ? 'bg-navy text-on-ink shadow-sm' : 'text-text-muted hover:text-navy'}`}><LayoutGrid className="h-3.5 w-3.5" /> Thẻ</button>
      </div>
    </div>
    {isLoading ? <div aria-busy="true" aria-label="Đang tải tổng quan học tập"><div className="mb-5 h-14 animate-pulse rounded bg-border-soft" /><CatalogueSkeleton count={4} /><Card className="mt-5 h-64 animate-pulse bg-border-soft" /></div> : error || !data ? <DashboardUnavailable onRetry={reload} /> : <>
      <StatStrip className="mb-5" stats={[
        { label: 'Tổng XP', value: stats?.xp.toLocaleString('vi-VN') ?? '—' },
        { label: 'Bài đã giải', value: stats?.solvedCount ?? '—' },
        { label: 'Chuỗi giải bài', value: stats ? `${stats.currentStreakDays} ngày` : '—' },
        { label: 'Thời gian bài học đã ghi nhận', value: learning?.totalStudySeconds != null ? `${(learning.totalStudySeconds / 3600).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} giờ` : '—' },
      ]} />
      {!stats && <div className="mb-4"><DashboardUnavailable onRetry={reload} /></div>}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="min-w-0 space-y-6">
          <DashboardNextAction data={data} viewMode={viewMode} />
          <DashboardCoach viewMode={viewMode} />
          <DashboardTrends data={learning ?? null} onRetry={reload} viewMode={viewMode} />
          <ContinueLearning data={learning ?? null} onRetry={reload} viewMode={viewMode} />
          <DashboardAssignments data={data} onRetry={reload} viewMode={viewMode} />
          <DashboardRecommendations viewMode={viewMode} />
        </div>
        <aside className="min-w-0 space-y-5"><DashboardPlanner data={data} onRetry={reload} viewMode={viewMode} /></aside>
      </div>
    </>}
  </div>;
}
