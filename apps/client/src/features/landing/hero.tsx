import { ArrowRight, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LandingData } from "./data";
import { HeroStudio } from "./hero-studio";

const count = (value: number) => value.toLocaleString("vi-VN");

export function LandingHero({ courses, roadmaps, articles }: LandingData) {
  const lessons = courses.reduce((sum, course) => sum + (course.totalLessons ?? 0), 0);
  // Chỉ những con số đếm được từ danh mục công khai; số 0 thì ẩn chứ không khoe.
  const stats = [
    { value: courses.length, label: "khóa học" },
    { value: roadmaps.length, label: "lộ trình" },
    { value: lessons, label: "bài học" },
    { value: articles.length, label: "bài viết" },
  ].filter((stat) => stat.value > 0);

  return (
    <section aria-labelledby="hero-title" data-tone="surface" className="px-4 pt-10 pb-10 sm:px-8 lg:pt-14 lg:pb-12">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <p className="text-xs font-semibold tracking-wider text-text-muted uppercase">Học lập trình qua khóa học, lộ trình và bài tập chấm tự động</p>
          <h1 id="hero-title" className="mt-4 text-4xl leading-[1.1] font-extrabold tracking-tight text-navy sm:text-5xl lg:text-6xl">
            Học đúng thứ cần học, <span className="text-primary">luyện đến khi viết được code.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-text-muted sm:text-lg sm:leading-8">
            Chọn khóa học từ giảng viên, đi theo lộ trình xếp sẵn và làm bài ngay trong trình duyệt — mỗi bài nộp được chạy
            test, có Codey gợi ý khi bạn bế tắc.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/courses" className="h-12 px-6 text-base">
              Khám phá khóa học <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button href="/practice" variant="outline" className="h-12 px-6 text-base">
              <Code2 className="size-4" aria-hidden /> Bắt đầu luyện code
            </Button>
          </div>
          {stats.length > 0 && (
            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-6 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <dt className="text-sm text-text-muted">{stat.label}</dt>
                  <dd className="order-first text-2xl font-bold text-navy">{count(stat.value)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <HeroStudio />
      </div>
    </section>
  );
}
