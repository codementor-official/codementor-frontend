import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseCard } from "@/components/course-card";
import { ProblemRow } from "@/components/problem-row";
import { samplePaths } from "@/data/sample-courses";
import {
  continueLearning,
  dashDeadlines,
  dashStats,
  popularTopics,
  recentlyViewed,
  recommendedProblems,
  streakCells,
  weeklyGoal,
} from "@/data/sample-dashboard";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 text-xs font-bold tracking-widest text-primary uppercase">
            Chào mừng trở lại, Gia Sĩ
          </div>
          <h1 className="max-w-lg text-2xl font-bold text-navy">
            Lộ trình Frontend Developer của bạn đang chờ — mục tiêu: học để đi làm.
          </h1>
        </div>
        <Button href="/settings" variant="outline" size="sm">
          ✎ Chỉnh hồ sơ học tập
        </Button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {dashStats.map((w) => (
          <Card key={w.label} className="p-4">
            <div className="mb-2 text-xs font-medium text-text-muted">{w.label}</div>
            <div className="mb-1 text-xl font-bold text-navy">{w.value}</div>
            <div className="text-xs text-text-faint">{w.sub}</div>
          </Card>
        ))}
      </div>

      <Link
        href="/paths"
        className="mb-5 flex flex-wrap items-center gap-5 rounded-lg bg-navy p-5 text-white"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white/10 text-lg">
          🤖
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
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-base font-bold text-navy">Đề xuất khóa học cho bạn</h2>
              <Link href="/paths" className="text-xs font-semibold text-primary">
                Xem tất cả →
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-1">
              {samplePaths.map((item) => (
                <div key={item.title} className="w-64 shrink-0">
                  <CourseCard {...item} />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Card className="p-4">
            <div className="mb-3.5 text-sm font-bold text-navy">🎯 Mục tiêu tuần</div>
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(var(--color-primary) ${weeklyGoal.pct}%, var(--color-border-soft) 0)`,
                }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-sm font-bold text-navy">
                  {weeklyGoal.pct}%
                </div>
              </div>
              <div>
                <div className="mb-1 text-lg font-bold text-navy">
                  {weeklyGoal.doneH} / {weeklyGoal.targetH}h
                </div>
                <div className="text-xs text-text-muted">
                  Còn {weeklyGoal.targetH - weeklyGoal.doneH}h để đạt mục tiêu tuần này
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-3.5 flex items-baseline justify-between">
              <span className="text-sm font-bold text-navy">🔥 Chuỗi ngày</span>
              <span className="text-base font-bold text-primary">5 ngày</span>
            </div>
            <div className="flex justify-between gap-1.5">
              {streakCells.map((c) => (
                <div key={c.label} className="flex-1 text-center">
                  <div
                    className={`mb-1 flex h-8 items-center justify-center rounded-md text-xs ${
                      c.active ? "bg-primary text-white" : "bg-border-soft"
                    }`}
                  >
                    {c.active ? "🔥" : ""}
                  </div>
                  <div className="text-[10px] font-medium text-text-faint">{c.label}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-3.5 text-sm font-bold text-navy">📅 Hạn sắp tới</div>
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
            <div className="mb-3.5 text-sm font-bold text-navy">👀 Xem gần đây</div>
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
