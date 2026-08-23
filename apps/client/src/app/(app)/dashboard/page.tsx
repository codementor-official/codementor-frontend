import Link from "next/link";
import { BarChart3, Calendar, LayoutDashboard, Pencil } from "lucide-react";
import { StatStrip } from "@codementor/ui";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseCard } from "@/components/course-card";
import { ProblemRow } from "@/components/problem-row";
import { WeeklyGoalCard } from "@/components/personalization/weekly-goal-card";
import { placeholderCoverUrl } from "@/lib/placeholder-image";
import { courseDifficulty, courseHref, featuredCourses } from "@/lib/roadmap/course-catalog";
import {
  continueLearning,
  dashDeadlines,
  dashStats,
  popularTopics,
  recommendedProblems,
  skillProgress,
  weeklyGoal,
} from "@/data/sample-dashboard";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        icon={LayoutDashboard}
        title="Chào mừng trở lại, Gia Sĩ"
        subtitle="Lộ trình Frontend Developer của bạn đang ở 14% — còn 2 bài nữa là xong chương CSS layout."
        actions={
          <>
            <Button href="/roadmaps/frontend-developer" size="sm">
              Tiếp tục học →
            </Button>
            <Button href="/settings" variant="outline" size="sm">
              <Pencil className="h-3.5 w-3.5" /> Chỉnh hồ sơ học tập
            </Button>
          </>
        }
      />

      {/* The four numbers that were a grid of cards, and the three the banner repeated in
        * different words. One row, one set. */}
      <StatStrip className="mb-5" stats={dashStats.map(({ label, value }) => ({ label, value }))} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section>
            <h2 className="mb-3 text-base font-bold text-navy">Tiếp tục học</h2>
            <div className="flex flex-col gap-3">
              {continueLearning.map((cl) => (
                <Link key={cl.title} href={cl.href}>
                  <Card className="flex items-center gap-3.5 p-4 hover:border-navy">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md font-mono text-sm font-bold text-on-ink ${
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
                    <span className="shrink-0 rounded-md bg-navy px-3.5 py-2 text-xs font-semibold text-on-ink">
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
              <Link href="/practice" className="text-xs font-semibold text-primary">
                Luyện tiếp →
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
                      <span className="shrink-0 text-2xs text-text-faint">
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
              <h2 className="text-base font-bold text-navy">Khóa học đề xuất cho bạn</h2>
              <Link href="/courses" className="text-xs font-semibold text-primary">
                Xem tất cả →
              </Link>
            </div>
            {/* Was a fixed-width horizontal strip that clipped cards on the very screens
              * with room to show them. A grid uses the width the shell now hands over. */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {featuredCourses.slice(0, 6).map((course, i) => (
                <div key={course.id}>
                  <CourseCard
                    tile={course.thumbnail}
                    tileVariant={i % 2 === 0 ? "navy" : "primary"}
                    coverImage={placeholderCoverUrl(course.slug)}
                    title={course.title}
                    desc={course.description}
                    difficulty={courseDifficulty(course.level)}
                    tags={course.technologies.slice(0, 3)}
                    stats={[
                      { label: "chương", value: course.totalChapters },
                      { label: "giờ", value: course.durationHours },
                    ]}
                    completed={course.progressPercent >= 100}
                    href={courseHref(course)}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Two cards, both carrying an action or a deadline. The rail used to stack five —
          * streak, activity, recently-viewed — none of which the user could act on, and the
          * streak duplicated /practice's copy of the same widget in different markup. */}
        <div className="flex min-w-0 flex-col gap-4">
          <WeeklyGoalCard completedHours={weeklyGoal.doneH} />

          <Card className="p-4">
            <div className="mb-3.5 flex items-center gap-1.5 text-sm font-bold text-navy">
              <Calendar className="h-4 w-4 text-primary" /> Hạn sắp tới
            </div>
            <div className="flex flex-col gap-3">
              {dashDeadlines.map((d) => (
                <div key={d.title} className="flex items-center gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-navy">{d.title}</div>
                    <div className="text-2xs text-text-faint">
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
