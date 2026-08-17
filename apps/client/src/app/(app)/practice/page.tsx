"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, Code2, Search, Target } from "lucide-react";
import { FilterBar, SegmentedTabs, Select, StatStrip } from "@codementor/ui";
import { PageHeader } from "@/components/page-header";
import { StreakCard } from "@/components/streak-card";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { CatalogueError } from "@/components/ui/catalogue-state";
import { useCatalogue } from "@/hooks/use-catalogue";
import { api } from "@/lib/api";
import { DIFFICULTY_OPTIONS, exerciseDifficulty } from "@/lib/catalogue/level";
import type { Difficulty } from "@/components/ui/badge";
import { MAX_PAGE_SIZE, type ExerciseSummary } from "@/types/catalogue";

const PAGE_SIZE = 15;

const KIND_OPTIONS = [
  { value: "all", label: "Mọi dạng bài" },
  { value: "code", label: "Bài code" },
  { value: "quiz", label: "Trắc nghiệm" },
  { value: "essay", label: "Tự luận" },
];

/* ponytail: static, and honestly so — these are search shortcuts, not counts of anything.
 * The backend has no tag or topic field on an exercise yet. */
const TRENDING_TAGS = ["Array", "String", "SQL", "React", "REST API", "BFS/DFS", "OOP", "Git"];

/* MOCK — user progress has no backend. submission-service does not exist, so nothing knows
 * which exercises this learner solved or how long a streak they are on. Kept because the
 * shape is the real one and the service is planned; delete both when it lands. */
const PRACTICE_STREAK = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((label, index) => ({
  label,
  active: index < 5,
}));

function difficultyClass(difficulty: Difficulty) {
  return difficulty === "Cơ bản" ? "text-success" : difficulty === "Trung bình" ? "text-accent" : "text-danger";
}

function ExerciseRow({
  item,
  number,
  favorite,
  onToggleFavorite,
}: {
  item: ExerciseSummary;
  number: number;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  const difficulty = exerciseDifficulty(item.difficulty);
  return (
    <li className="group flex items-center gap-3 border-t border-border-soft px-3 py-3 transition-colors hover:bg-bg sm:px-4">
      <span className="hidden w-7 shrink-0 text-right text-xs tabular-nums text-text-faint md:block">
        {number}
      </span>
      <Link href={`/solve/${item.id}`} className="min-w-0 flex-1">
        <span className="truncate text-sm font-semibold text-navy group-hover:text-primary">
          {item.title}
        </span>
        <span className="mt-0.5 block truncate text-2xs text-text-faint">
          {item.authorName ?? "CodeMentor"} · cập nhật{" "}
          {new Date(item.updatedAt).toLocaleDateString("vi-VN")}
        </span>
      </Link>
      <span className="hidden w-20 shrink-0 text-right text-xs text-text-muted sm:block">
        {item.kind === "code" ? "Bài code" : item.kind}
      </span>
      <span className={`w-20 shrink-0 text-right text-xs font-semibold ${difficultyClass(difficulty)}`}>
        {difficulty}
      </span>
      <button
        type="button"
        aria-label={favorite ? "Bỏ lưu bài tập" : "Lưu bài tập"}
        onClick={onToggleFavorite}
        className={`shrink-0 rounded p-1.5 transition-colors ${
          favorite ? "text-accent" : "text-text-faint hover:bg-border-soft hover:text-navy"
        }`}
      >
        <Bookmark className="h-4 w-4" fill={favorite ? "currentColor" : "none"} />
      </button>
    </li>
  );
}

export default function PracticePage() {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [page, setPage] = useState(1);
  // Session-scoped: there is no endpoint to persist a bookmark yet.
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());

  const { items, isLoading, error } = useCatalogue<ExerciseSummary>(() =>
    api.exercises.bank({ limit: MAX_PAGE_SIZE }),
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items
      .filter((e) => kind === "all" || e.kind === kind)
      .filter((e) => difficulty === "all" || e.difficulty === difficulty)
      .filter((e) => !query || `${e.title} ${e.slug} ${e.authorName ?? ""}`.toLowerCase().includes(query));
  }, [items, search, kind, difficulty]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginated = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const byDifficulty = (d: string) => items.filter((e) => e.difficulty === d).length;
  const toggleFavorite = (id: string) =>
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      <PageHeader
        title="Bài luyện tập"
        subtitle="Ngân hàng bài code đã công khai. Chọn một bài để mở trong không gian làm bài."
      />

      {/* Counts of what the bank actually holds. Solved/XP are absent on purpose: no
        * submission-service means nothing on the server knows this learner's progress. */}
      <StatStrip
        className="mb-5"
        stats={[
          { label: "Bài tập", value: items.length },
          { label: "Cơ bản", value: byDifficulty("easy") },
          { label: "Trung bình", value: byDifficulty("medium") },
          { label: "Nâng cao", value: byDifficulty("hard") },
        ]}
      />

      <div className="mb-4">
        <SegmentedTabs
          options={DIFFICULTY_OPTIONS}
          value={difficulty}
          onChange={(v) => {
            setDifficulty(v);
            setPage(1);
          }}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
        <main className="min-w-0">
          <FilterBar
            className="mb-5"
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder="Tìm theo tên bài, slug, tác giả..."
            activeFilterCount={Number(kind !== "all")}
            onClearFilters={() => {
              setKind("all");
              setDifficulty("all");
              setSearch("");
              setPage(1);
            }}
            sheetTitle="Lọc bài tập"
            controls={
              <Select
                label="Dạng bài"
                value={kind}
                options={KIND_OPTIONS}
                onChange={(v) => {
                  setKind(v);
                  setPage(1);
                }}
              />
            }
          />

          {error ? (
            <CatalogueError message={error} />
          ) : (
            <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
              <div className="flex items-center gap-3 border-b border-border bg-bg px-4 py-3">
                <Search className="h-4 w-4 text-text-faint" />
                <span className="flex-1 text-sm font-bold text-navy">Danh sách bài tập</span>
                <span className="hidden w-20 text-right text-xs text-text-faint sm:block">Dạng</span>
                <span className="w-20 text-right text-xs text-text-faint">Độ khó</span>
                <span className="w-7" />
              </div>

              {isLoading ? (
                <ul>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <li key={index} className="flex items-center gap-3 border-t border-border-soft px-4 py-4">
                      <div className="h-3 w-1/3 animate-pulse rounded bg-border-soft" />
                    </li>
                  ))}
                </ul>
              ) : paginated.length > 0 ? (
                <ul>
                  {paginated.map((item, index) => (
                    <ExerciseRow
                      key={item.id}
                      item={item}
                      number={(currentPage - 1) * PAGE_SIZE + index + 1}
                      favorite={favorites.has(item.id)}
                      onToggleFavorite={() => toggleFavorite(item.id)}
                    />
                  ))}
                </ul>
              ) : (
                <div className="p-10 text-center">
                  <Target className="mx-auto mb-2 h-5 w-5 text-text-faint" />
                  <p className="text-sm font-semibold text-navy">
                    {items.length === 0 ? "Chưa có bài tập nào được công khai" : "Chưa có bài phù hợp"}
                  </p>
                  <p className="mt-1 text-xs text-text-faint">
                    {items.length === 0
                      ? "Bài tập xuất hiện ở đây sau khi giảng viên soạn và công khai."
                      : "Thử đổi độ khó, dạng bài hoặc từ khóa tìm kiếm."}
                  </p>
                </div>
              )}

              {visible.length > 0 && (
                <Pagination
                  label="Phân trang bài tập"
                  page={currentPage}
                  pageCount={pageCount}
                  onChange={setPage}
                  className="border-t border-border bg-surface px-4 py-3"
                />
              )}
            </section>
          )}
        </main>

        <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
          <StreakCard
            days={PRACTICE_STREAK}
            hint="Giải thêm 1 bài hôm nay để giữ chuỗi. (Số liệu tạm — chưa có submission-service.)"
          />
          <Card className="p-4">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-navy">
              <Code2 className="h-4 w-4 text-primary" /> Từ khóa thịnh hành
            </h2>
            <div className="flex flex-wrap gap-2">
              {TRENDING_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSearch(tag);
                    setPage(1);
                  }}
                  className="rounded-full bg-bg px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-primary-tint hover:text-primary"
                >
                  {tag}
                </button>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
