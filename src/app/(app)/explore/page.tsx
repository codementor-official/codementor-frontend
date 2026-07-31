import Link from "next/link";
import { Flame, BookOpen, Star, Target, Globe } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { CourseCard } from "@/components/course-card";
import { ProblemRow } from "@/components/problem-row";
import { samplePaths } from "@/data/sample-courses";
import { communityItems, learningCollections, popularProblems, recommendedTopics } from "@/data/sample-explore";

export default function ExplorePage() {
  return (
    <div>
      <PageHeader
        title="Khám phá"
        subtitle="Nội dung mới đang nổi trên toàn hệ thống — khóa học, bài luyện tập, bộ sưu tập và cộng đồng"
      />

      <section className="mb-6">
        <h2 className="mb-3 flex items-center gap-1.5 text-base font-bold text-navy">
          <Flame className="h-4 w-4 text-primary" /> Khóa học đang nổi
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {samplePaths.map((item) => (
            <CourseCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-1 flex items-center gap-1.5 text-base font-bold text-navy">
          <BookOpen className="h-4 w-4 text-primary" /> Bộ sưu tập học tập
        </h2>
        <p className="mb-3 text-xs text-text-faint">Các lộ trình chủ đề được tuyển chọn theo công nghệ</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {learningCollections.map((c) => (
            <Card key={c.name} className="flex flex-col gap-2.5 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-border-soft text-navy">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-navy">{c.name}</h3>
              <p className="flex-1 text-xs leading-relaxed text-text-muted">{c.desc}</p>
              <div className="flex items-center justify-between border-t border-border-soft pt-2.5">
                <span className="text-[11px] font-medium text-text-faint">{c.count}</span>
                <span className="rounded-sm bg-border-soft px-2 py-1 text-[11px] font-semibold text-navy">
                  {c.tag}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="flex items-center gap-1.5 text-base font-bold text-navy">
                <Star className="h-4 w-4 fill-primary text-primary" /> Bài luyện tập phổ biến
              </h2>
              <Link href="/practice" className="text-xs font-semibold text-primary">
                Xem tất cả →
              </Link>
            </div>
            <Card className="overflow-hidden">
              {popularProblems.map((p) => (
                <ProblemRow key={p.title} {...p} />
              ))}
            </Card>
          </section>

          <section>
            <div className="mb-1 flex items-center gap-1.5 text-base font-bold text-navy">
              <Target className="h-4 w-4 text-primary" /> Chủ đề AI đề xuất cho bạn
            </div>
            <p className="mb-3 text-xs text-text-faint">Dựa trên lĩnh vực bạn chọn khi đăng ký</p>
            <div className="flex flex-wrap gap-2">
              {recommendedTopics.map((t) => (
                <Link
                  key={t}
                  href="/practice"
                  className="rounded-md border border-border bg-surface px-3.5 py-2 text-sm font-medium text-navy hover:border-primary hover:text-primary"
                >
                  {t}
                </Link>
              ))}
            </div>
          </section>
        </div>

        <Card className="h-fit p-4">
          <div className="mb-3.5 flex items-center gap-1.5 text-sm font-bold text-navy">
            <Globe className="h-4 w-4 text-primary" /> Cộng đồng
          </div>
          <div className="flex flex-col gap-4">
            {communityItems.map((c) => (
              <div key={c.title} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-border-soft text-navy">
                  <c.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="mb-0.5 text-[10px] font-bold tracking-wide text-primary uppercase">
                    {c.kind}
                  </div>
                  <div className="mb-0.5 text-sm font-semibold text-navy">{c.title}</div>
                  <div className="flex items-center gap-1 text-xs text-text-faint">
                    {c.rating && (
                      <span className="flex items-center gap-0.5 text-primary">
                        <Star className="h-3 w-3 fill-primary" /> {c.rating} ·
                      </span>
                    )}
                    {c.meta}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/workspace"
            className="mt-4 block rounded-md border border-border py-2.5 text-center text-xs font-semibold text-navy hover:bg-bg"
          >
            Khám phá nhóm học tập →
          </Link>
        </Card>
      </div>
    </div>
  );
}
