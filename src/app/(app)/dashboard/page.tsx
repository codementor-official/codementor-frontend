import Link from "next/link";
import {
  Activity,
  Award,
  BarChart3,
  Bot,
  BookOpen,
  Calendar,
  CheckCircle2,
  Eye,
  Flame,
  Pencil,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";
import { PageBanner } from "@/components/page-banner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EntityCard } from "@/components/entity-card";
import { ProblemRow } from "@/components/problem-row";
import { StatBlock } from "@/components/ui/stat-block";
import { WeeklyGoalCard } from "@/components/personalization/weekly-goal-card";
import { placeholderCoverUrl } from "@/lib/placeholder-image";
import { PAGE_ILLUSTRATIONS } from "@/lib/content-illustrations";
import { courseDifficulty, courseHref, featuredCourses } from "@/lib/roadmap/course-catalog";
import {
  continueLearning,
  dashDeadlines,
  dashStats,
  popularTopics,
  recentActivity,
  recentlyViewed,
  recommendedProblems,
  skillProgress,
  streakCells,
  weeklyGoal,
} from "@/data/sample-dashboard";

const ACTIVITY_ICON: Record<(typeof recentActivity)[number]["kind"], LucideIcon> = {
  solved: CheckCircle2,
  lesson: PlayCircle,
  streak: Flame,
  badge: Award,
};

export default function DashboardPage() {
  return (
    <div>
      <PageBanner
        illustrationSrc={PAGE_ILLUSTRATIONS.dashboard}
        eyebrow="Chào mừng trở lại, Gia Sĩ"
        title="Lộ trình Frontend Developer của bạn đang chờ"
        description="Bạn đang ở 14% chặng đường — còn 2 bài nữa là xong chương CSS layout. Giữ nhịp 5 giờ/tuần thì khoảng 7 tháng nữa bạn hoàn thành toàn bộ lộ trình."
        actions={
          <>
            <Button href="/paths/frontend-developer" size="sm">
              Tiếp tục học →
            </Button>
            <Button href="/settings" variant="outline" size="sm">
              <Pencil className="h-3.5 w-3.5" /> Chỉnh hồ sơ học tập
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {dashStats.map((w) => (
          <Card key={w.label} className="p-4">
            <StatBlock value={w.value} label={w.label} />
            <div className="mt-1 text-xs text-text-faint">{w.sub}</div>
          </Card>
        ))}
      </div>

      <Link
        href="/paths"
        className="mb-5 flex flex-wrap items-center gap-5 rounded-lg bg-navy p-5 text-white"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white/10">
          <Bot className="h-5 w-5" />
        </div>
        <div className="min-w-[260px] flex-1">
          <div className="mb-1.5 text-[10.5px] font-bold tracking-wide text-primary uppercase">
            Đề xuất từ AI
          </div>
          <div className="mb-1 text-base font-bold">Frontend Developer Roadmap</div>
          <div className="text-sm text-zinc-300">
            Dựa trên mục tiêu &ldquo;Học để đi làm&rdquo; và trình độ Beginner bạn chọn khi đăng ký.
          </div>
        </div>
        <span className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-semibold">
          Xem lộ trình →
        </span>
      </Link>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section>
            <h2 className="mb-3 text-base font-bold text-navy">Tiếp tục học</h2>
            <div className="flex flex-col gap-3">
              {continueLearning.map((cl) => (
                <Link key={cl.title} href={cl.href}>
                  <Card className="flex items-center gap-3.5 p-4 hover:border-navy">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md font-mono text-sm font-bold text-white ${
                        cl.tileVariant === "primary" ? "bg-primary" : "bg-navy"
                      }`}
                    >
                      {cl.tile}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 truncate text-sm font-semibold text-navy">{cl.title}</div>
                      <div className="flex items-center gap-2.5">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-soft">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${cl.progress}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-primary">
                          {cl.progress}%
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md bg-navy px-3.5 py-2 text-xs font-semibold text-white">
                      Tiếp tục
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-base font-bold text-navy">Bài luyện tập đề xuất</h2>
              <Link href="/practice" className="text-xs font-semibold text-primary">
                Xem tất cả →
              </Link>
            </div>
            <Card className="overflow-hidden">
              {recommendedProblems.map((p) => (
                <ProblemRow key={p.title} {...p} />
              ))}
            </Card>
          </section>

          <section>
            <div className="mb-1 flex items-baseline justify-between">
              <h2 className="flex items-center gap-1.5 text-base font-bold text-navy">
                <BarChart3 className="h-4 w-4 text-primary" /> Kỹ năng của bạn
              </h2>
              <Link href="/progress" className="text-xs font-semibold text-primary">
                Xem chi tiết →
              </Link>
            </div>
            <p className="mb-3 text-xs text-text-faint">
              Tỷ lệ bài đã giải trên từng nhóm chủ đề — chủ đề thấp nhất là nơi nên luyện tiếp.
            </p>
            <Card className="flex flex-col gap-3.5 p-4">
              {skillProgress.map((s) => {
                const percent = Math.round((s.solved / s.total) * 100);
                return (
                  <div key={s.topic}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <span className="truncate text-xs font-semibold text-navy">{s.topic}</span>
                      <span className="shrink-0 text-[11px] text-text-faint">
                        {s.solved}/{s.total} bài · {percent}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-border-soft">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </Card>
          </section>

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-base font-bold text-navy">Đề xuất lộ trình cho bạn</h2>
              <Link href="/paths" className="text-xs font-semibold text-primary">
                Xem tất cả →
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-1">
              {featuredCourses.map((course, i) => (
                <div key={course.id} className="w-64 shrink-0">
                  <EntityCard
                    tile={course.thumbnail}
                    tileVariant={i % 2 === 0 ? "ink" : "primary"}
                    coverImage={placeholderCoverUrl(course.slug)}
                    kind={{ icon: BookOpen, label: course.roadmapTitle }}
                    title={course.title}
                    description={course.description}
                    difficulty={courseDifficulty(course.level)}
                    tags={course.technologies.slice(0, 3)}
                    stats={[
                      { label: "chương", value: course.totalChapters },
                      { label: "giờ", value: course.durationHours },
                    ]}
                    progress={course.progressPercent > 0 ? course.progressPercent : undefined}
                    href={courseHref(course)}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <WeeklyGoalCard completedHours={weeklyGoal.doneH} />

          <Card className="p-4">
            <div className="mb-3.5 flex items-baseline justify-between">
              <span className="flex items-center gap-1.5 text-sm font-bold text-navy">
                <Flame className="h-4 w-4 text-primary" /> Chuỗi ngày
              </span>
              <span className="text-base font-bold text-primary">5 ngày</span>
            </div>
            <div className="flex justify-between gap-1.5">
              {streakCells.map((c) => (
                <div key={c.label} className="flex-1 text-center">
                  <div
                    className={`mb-1 flex h-8 items-center justify-center rounded-md ${
                      c.active ? "bg-primary text-white" : "bg-border-soft"
                    }`}
                  >
                    {c.active && <Flame className="h-4 w-4" />}
                  </div>
                  <div className="text-[10px] font-medium text-text-faint">{c.label}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-3.5 flex items-center gap-1.5 text-sm font-bold text-navy">
              <Calendar className="h-4 w-4 text-primary" /> Hạn sắp tới
            </div>
            <div className="flex flex-col gap-3">
              {dashDeadlines.map((d) => (
                <div key={d.title} className="flex items-center gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-navy">{d.title}</div>
                    <div className="text-[11px] text-text-faint">
                      {d.deadline} · {d.group}
                    </div>
                  </div>
                  <Badge tone={d.overdue ? "danger" : "navy"} className="shrink-0">
                    {d.overdue ? "Quá hạn" : "Sắp tới"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-3.5 flex items-center gap-1.5 text-sm font-bold text-navy">
              <Activity className="h-4 w-4 text-primary" /> Hoạt động gần đây
            </div>
            <div className="flex flex-col gap-3.5">
              {recentActivity.map((a) => {
                const Icon = ACTIVITY_ICON[a.kind];
                return (
                  <div key={a.text} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-border-soft text-navy">
                      <Icon className="h-3 w-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs leading-relaxed text-navy">{a.text}</div>
                      <div className="text-[11px] text-text-faint">{a.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-3.5 flex items-center gap-1.5 text-sm font-bold text-navy">
              <Eye className="h-4 w-4 text-primary" /> Xem gần đây
            </div>
            <div className="flex flex-col gap-3">
              {recentlyViewed.map((r) => (
                <Link key={r.title} href={r.href} className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-navy font-mono text-xs font-bold text-white">
                    {r.tile}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-navy">{r.title}</div>
                    <div className="text-[11px] text-text-faint">{r.meta}</div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-base font-bold text-navy">Chủ đề phổ biến</h2>
        <div className="flex flex-wrap gap-2">
          {popularTopics.map((t) => (
            <Link
              key={t}
              href="/practice"
              className="rounded-md border border-border bg-surface px-3.5 py-2 text-sm font-medium text-text hover:border-primary hover:text-primary"
            >
              {t}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
