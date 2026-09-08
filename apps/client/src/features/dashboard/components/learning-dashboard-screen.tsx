"use client";

import { LayoutDashboard, RefreshCw } from 'lucide-react';
import { StatStrip } from '@codementor/ui';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CatalogueSkeleton } from '@/components/ui/catalogue-state';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { useRecommendations } from '@/features/recommendations/use-recommendations';
import { loadDashboard } from '../dashboard-service';
import { selectPrimaryAction, selectTodayPlan } from '../dashboard-priority';
import { ContinueLearning } from './continue-learning';
import { DashboardTrends } from './dashboard-trends';
import { DashboardNextAction } from './dashboard-next-action';
import { DashboardAssignments } from './dashboard-assignments';
import { DashboardCoach } from './dashboard-coach';
import { DashboardPlanner } from './dashboard-planner';
import { DashboardRecommendations } from './dashboard-recommendations';
import { DashboardTodayPlan } from './dashboard-today-plan';
import { DashboardUnavailable } from './dashboard-section';

export function LearningDashboardScreen() {
  const { user } = useAuth();
  const { data, isLoading, error, reload } = useRecommendations(loadDashboard);
  const coach = useRecommendations(api.dashboard.insight);
  const stats = data?.stats;
  const learning = data?.learning;
  const refreshAll = () => { reload(); coach.reload(); };
  const displayName = data?.profile?.displayName || user?.displayName || 'bạn';
  const direction = data?.preferences?.learningGoal
    ? `Hôm nay, hãy tiến thêm một bước tới mục tiêu “${data.preferences.learningGoal}”.`
    : 'Chọn một việc quan trọng, duy trì nhịp học và theo dõi tiến bộ của bạn.';

  return <div className="min-w-0">
    <PageHeader icon={LayoutDashboard} title={`Chào ${displayName}`} subtitle={direction} />
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Button href="/profile?tab=personalization" size="sm" variant="outline">Mục tiêu và lịch học</Button>
      <Button size="sm" variant="ghost" disabled={isLoading || coach.isLoading} onClick={refreshAll}><RefreshCw className="h-4 w-4" /> Cập nhật dữ liệu</Button>
    </div>
    {isLoading ? <div aria-busy="true" aria-label="Đang tải tổng quan học tập"><div className="mb-5 h-14 animate-pulse rounded bg-border-soft" /><CatalogueSkeleton count={4} /><Card className="mt-5 h-64 animate-pulse bg-border-soft" /></div> : error || !data ? <DashboardUnavailable onRetry={reload} /> : (() => {
      const primary = selectPrimaryAction(data, coach.data);
      const today = selectTodayPlan(data, coach.data, primary);
      const excludedHrefs = [primary.href, ...today.map((item) => item.href)];
      return <>
        <StatStrip className="mb-5" stats={[
          { label: 'Tổng XP', value: stats?.xp.toLocaleString('vi-VN') ?? '—' },
          { label: 'Bài công khai đã giải', value: stats?.solvedCount ?? '—' },
          { label: 'Chuỗi giải bài hiện tại', value: stats ? `${stats.currentStreakDays} ngày` : '—' },
          { label: 'Thời gian bài học ghi nhận', value: learning?.totalStudySeconds != null ? `${(learning.totalStudySeconds / 3600).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} giờ` : '—' },
        ]} />
        {!stats && <div className="mb-4"><DashboardUnavailable onRetry={reload} /></div>}
        <div className="space-y-5">
          <DashboardNextAction data={data} coach={coach.data} />
          <DashboardCoach data={coach.data} isLoading={coach.isLoading} error={coach.error} reload={coach.reload} onDataChange={coach.replaceData} />
          <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
            <DashboardTodayPlan items={today} />
            <DashboardPlanner data={data} onRetry={reload} />
          </div>
        </div>
        <div className="mt-6 space-y-6">
          <DashboardTrends data={learning ?? null} onRetry={reload} />
          <div className="grid items-stretch gap-6 xl:grid-cols-2">
            <ContinueLearning data={learning ?? null} onRetry={reload} excludeHref={primary.href} />
            <DashboardAssignments data={data} onRetry={reload} excludeId={primary.kind === 'assignment' ? primary.id : undefined} />
          </div>
          <DashboardRecommendations excludeHrefs={excludedHrefs} />
        </div>
      </>;
    })()}
  </div>;
}
