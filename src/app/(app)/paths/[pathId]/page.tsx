import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getPathDetail } from "@/data/path-detail";

const reviews = [
  { initials: "VB", author: "Trần Văn Bình", rating: 5, text: "Lộ trình rất dễ theo, bài tập tăng độ khó hợp lý." },
  { initials: "TC", author: "Lê Thị Cường", rating: 4, text: "Phần vòng lặp hơi nhanh, mong có thêm ví dụ." },
];

export default async function PathDetailPage({
  params,
}: {
  params: Promise<{ pathId: string }>;
}) {
  const { pathId } = await params;
  const path = getPathDetail(pathId);

  const allExercises = path.chapters.flatMap((c) => c.lessons.flatMap((l) => l.exercises));
  const doneExercises = allExercises.filter((e) => e.done);
  const pct = allExercises.length ? Math.round((doneExercises.length / allExercises.length) * 100) : 0;
  const xp = doneExercises.reduce((t, e) => t + e.xp, 0);
  const doneLessons = path.chapters.flatMap((c) => c.lessons).filter((l) => l.done).length;
  const lessonCount = path.chapters.reduce((t, c) => t + c.lessons.length, 0);

  return (
    <div>
      <Link href="/paths" className="mb-3.5 inline-block text-sm text-text-muted hover:text-navy">
        ← Quay lại lộ trình học
      </Link>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="mb-5 rounded-lg bg-navy p-6 text-white">
            <div className="mb-2 text-[10.5px] font-bold tracking-wide text-primary uppercase">Lộ trình học</div>
            <h1 className="mb-2 text-2xl font-bold">{path.title}</h1>
            <p className="mb-3.5 max-w-xl text-sm leading-relaxed text-zinc-300">{path.desc}</p>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-zinc-200">
              <span>⭐ {path.rating}</span>
              <span>📊 {path.level}</span>
              <span>⏱ {path.duration}</span>
              <span>👥 {path.students} học viên</span>
            </div>
            <div className="mt-3.5 flex flex-wrap gap-2">
              <span className="rounded-md bg-white/15 px-2.5 py-1 text-xs font-semibold">
                {path.chapters.length} chương
              </span>
              <span className="rounded-md bg-white/15 px-2.5 py-1 text-xs font-semibold">
                {lessonCount} bài học
              </span>
              <span className="rounded-md bg-white/15 px-2.5 py-1 text-xs font-semibold">
                {allExercises.length} bài tập
              </span>
            </div>
          </div>

          <Card className="mb-3.5 p-5">
            <h2 className="mb-3 text-sm font-bold text-navy">Bạn sẽ học được gì</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {path.whatYouLearn.map((w) => (
                <div key={w} className="flex items-start gap-2 text-xs text-text">
                  <span className="mt-0.5 text-primary">✓</span>
                  {w}
                </div>
              ))}
            </div>
          </Card>

          <div className="mb-5 flex flex-col gap-3.5 sm:flex-row">
            <Card className="flex-1 p-5">
              <div className="mb-2.5 text-sm font-bold text-navy">Điều kiện tiên quyết</div>
              <ul className="flex flex-col gap-1.5">
                {path.prerequisites.map((p) => (
                  <li key={p} className="flex gap-2 text-xs leading-relaxed text-text-muted">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    {p}
                  </li>
                ))}
              </ul>
            </Card>
            {path.technologies.length > 0 && (
              <Card className="flex-1 p-5">
                <div className="mb-2.5 text-sm font-bold text-navy">Công nghệ liên quan</div>
                <div className="flex flex-wrap gap-1.5">
                  {path.technologies.map((t) => (
                    <span key={t} className="rounded-sm bg-border-soft px-2.5 py-1 text-xs font-semibold text-navy">
                      {t}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <h2 className="mb-1 text-base font-bold text-navy">Nội dung lộ trình</h2>
          <p className="mb-3.5 text-xs text-text-faint">
            Chọn một chương để xem danh sách bài học — mỗi bài học gồm các bài tập thực hành kèm gợi ý AI.
          </p>
          <div className="flex flex-col gap-2.5">
            {path.chapters.map((c, ci) => (
              <details key={c.name} className="group rounded-lg border border-border bg-surface open:border-primary" open={ci === 0}>
                <summary className="flex cursor-pointer list-none items-center gap-3 p-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-border-soft font-mono text-xs font-bold text-text-muted group-open:bg-primary group-open:text-white">
                    {String(ci + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-navy">{c.name}</span>
                  <span className="text-xs text-text-faint">{c.lessons.length} bài học</span>
                  <span className="text-text-faint transition-transform group-open:rotate-45">＋</span>
                </summary>
                <div className="flex flex-col border-t border-border-soft">
                  {c.lessons.map((l) => (
                    <details key={l.name} className="group/lesson border-t border-border-soft first:border-t-0">
                      <summary className="flex cursor-pointer list-none items-center gap-2.5 py-2.5 pr-3.5 pl-9">
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            l.done ? "bg-border-soft text-navy" : "bg-primary-tint text-primary"
                          }`}
                        >
                          {l.done ? "Xong" : "Chưa học"}
                        </span>
                        <span className="flex-1 text-xs font-medium text-text">{l.name}</span>
                        <span className="text-[11px] text-text-faint">{l.exercises.length} bài tập</span>
                      </summary>
                      <div className="flex flex-col gap-1.5 bg-bg py-2 pr-3.5 pl-9">
                        {l.exercises.map((ex) => (
                          <div
                            key={ex.title}
                            className="flex flex-wrap items-center gap-2.5 rounded-md border border-border-soft bg-surface px-3 py-2"
                          >
                            <span className={ex.done ? "text-navy" : "text-text-faint"}>{ex.done ? "✓" : "○"}</span>
                            <span className="flex-1 text-xs font-medium text-navy">{ex.title}</span>
                            <DifficultyBadge difficulty={ex.difficulty} />
                            <span className="text-[11px] text-text-faint">{ex.xp} XP</span>
                          </div>
                        ))}
                        {l.exercises.length === 0 && (
                          <div className="text-[11px] text-text-faint">Chưa có bài tập.</div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="flex w-full flex-col gap-3.5 lg:w-80 lg:shrink-0">
          <Card className="p-4">
            <div className="mb-3 text-sm font-bold text-navy">Tiến độ của bạn</div>
            <div className="mb-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-primary">{pct}%</span>
              <span className="text-xs text-text-faint">hoàn thành</span>
            </div>
            <div className="mb-3.5 h-1.5 overflow-hidden rounded-full bg-border-soft">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-text">
              <div className="flex justify-between">
                <span>Bài tập đã hoàn thành</span>
                <b>
                  {doneExercises.length}/{allExercises.length}
                </b>
              </div>
              <div className="flex justify-between">
                <span>Bài học đã hoàn thành</span>
                <b>
                  {doneLessons}/{lessonCount}
                </b>
              </div>
              <div className="flex justify-between">
                <span>XP tích lũy từ khóa học</span>
                <b>{xp} XP</b>
              </div>
            </div>
            <Button className="mt-3.5 w-full">
              {pct > 0 ? "Học tiếp bài đang dở →" : "Bắt đầu học ngay →"}
            </Button>
          </Card>

          <Card className="p-4">
            <div className="mb-1 text-sm font-bold text-navy">Đánh giá khóa học</div>
            <p className="mb-2.5 text-[11px] leading-relaxed text-text-faint">
              Dành cho học viên đã hoàn thành khóa học — chia sẻ trải nghiệm để người hướng dẫn cải thiện nội dung.
            </p>
            <div className="mb-2.5 flex gap-1 text-lg text-border">★★★★★</div>
            <Input placeholder="Viết nhận xét về khóa học này..." />
            <Button className="mt-2 w-full" size="sm">
              Gửi đánh giá
            </Button>
          </Card>

          <Card className="p-4">
            <div className="mb-3 text-sm font-bold text-navy">Nhận xét từ học viên</div>
            <div className="flex flex-col gap-3.5">
              {reviews.map((r) => (
                <div key={r.author} className="flex gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-[11px] font-semibold text-white">
                    {r.initials}
                  </span>
                  <div className="min-w-0">
                    <div className="mb-0.5 flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-navy">{r.author}</span>
                      <span className="text-[11px] text-primary">{"★".repeat(r.rating)}</span>
                    </div>
                    <div className="text-xs leading-relaxed text-text-muted">{r.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
