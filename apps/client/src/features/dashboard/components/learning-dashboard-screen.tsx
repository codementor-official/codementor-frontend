"use client";

import { LayoutDashboard, RefreshCw } from 'lucide-react';
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
import { DashboardSkills } from './dashboard-skills';
import { DashboardRecommendations } from './dashboard-recommendations';
import { DashboardUnavailable } from './dashboard-section';

export function LearningDashboardScreen() {
  const { user } = useAuth();
  const { data, isLoading, error, reload } = useRecommendations(loadDashboard);
  const stats = data?.stats;
  const learning = data?.learning;
  return <div className="min-w-0">
    <PageHeader icon={LayoutDashboard} title={`Chào ${user?.displayName ?? 'bạn'}`} subtitle="Tiếp nối việc học, theo dõi mục tiêu và chọn bước tiếp theo của bạn." />
    <div className="mb-4 flex flex-wrap gap-2">
      <Button href="/profile?tab=personalization" size="sm" variant="outline">Hồ sơ học tập</Button>
      <Button size="sm" variant="ghost" disabled={isLoading} onClick={reload}><RefreshCw className="h-4 w-4" /> Cập nhật</Button>
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
          <DashboardNextAction data={data} />
          <DashboardTrends data={learning ?? null} onRetry={reload} />
          <ContinueLearning data={learning ?? null} onRetry={reload} />
          <DashboardAssignments data={data} onRetry={reload} />
          <DashboardSkills topics={data.topics} onRetry={reload} />
          <DashboardRecommendations />
        </div>
        <aside className="min-w-0 space-y-5"><DashboardCoach /><DashboardPlanner data={data} onRetry={reload} /></aside>
      </div>
    </>}
  </div>;
}
