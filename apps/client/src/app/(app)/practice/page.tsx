"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Code2, Search, Target } from "lucide-react";
import { FilterBar, SegmentedTabs, Select, StatStrip } from "@codementor/ui";
import { PageHeader } from "@/components/page-header";
import { StreakCard } from "@/components/streak-card";
import { Card } from "@/components/ui/card";
import { CatalogueError } from "@/components/ui/catalogue-state";
import { RecommendedExercises } from "@/components/recommendation/recommended";
import { api } from "@/lib/api";
import { DIFFICULTY_OPTIONS, exerciseDifficulty } from "@/lib/catalogue/level";
import type { Difficulty } from "@/components/ui/badge";
import type { ExerciseSummary } from "@/types/catalogue";
import type { UserActivityCalendar, UserLearningStats } from "@/features/account/types";
import { SaveButton } from "@/features/saved/components/save-button";
import { ReportButton } from "@/features/reports/report-button";

const PAGE_SIZE = 10;
const KIND_OPTIONS = [
  { value: "all", label: "Mọi dạng bài" },
  { value: "code", label: "Bài code" },
  { value: "quiz", label: "Trắc nghiệm" },
  { value: "essay", label: "Tự luận" },
];

function difficultyClass(difficulty: Difficulty) {
  return difficulty === "Cơ bản" ? "text-success" : difficulty === "Trung bình" ? "text-accent" : "text-danger";
}

function ExerciseRow({ item, number }: { item: ExerciseSummary; number: number }) {
  const difficulty = exerciseDifficulty(item.difficulty);
  return (
    <li className="group flex items-center gap-3 border-t border-border-soft px-3 py-3 transition-colors hover:bg-bg sm:px-4">
      <span className="hidden w-7 shrink-0 text-right text-xs tabular-nums text-text-faint md:block">{number}</span>
      <Link href={`/solve/${item.id}`} className="min-w-0 flex-1">
        <span className="truncate text-sm font-semibold text-navy group-hover:text-primary">{item.title}</span>
        <span className="mt-0.5 block truncate text-2xs text-text-faint">
          {item.authorName ?? "CodeMentor"} · cập nhật {new Date(item.updatedAt).toLocaleDateString("vi-VN")}
        </span>
      </Link>
      <span className={`w-20 shrink-0 text-right text-xs font-semibold ${difficultyClass(difficulty)}`}>{difficulty}</span>
      <SaveButton compact targetType="EXERCISE" targetId={item.id} />
      <ReportButton compact targetType="EXERCISE" targetId={item.id} />
    </li>
  );
}

export default function PracticePage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [page, setPage] = useState(1);
  const [cursors, setCursors] = useState<Array<string | undefined>>([undefined]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [items, setItems] = useState<ExerciseSummary[]>([]);
  const [stats, setStats] = useState<UserLearningStats | null>(null);
  const [calendar, setCalendar] = useState<UserActivityCalendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const resetPagination = () => {
    setPage(1);
    setCursors([undefined]);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError(null);
    try {
      const response = await api.exercises.bank({
        q: query || undefined,
        kind: kind === "all" ? undefined : kind,
        difficulty: difficulty === "all" ? undefined : difficulty,
        cursor: cursors[page - 1],
        limit: PAGE_SIZE,
      });
      if (sequence === requestSequence.current) {
        setItems(response.items);
        setNextCursor(response.nextCursor);
      }
    } catch (cause) {
      if (sequence === requestSequence.current) {
        setItems([]);
        setNextCursor(null);
        setError(cause instanceof Error ? cause.message : "Không tải được danh sách bài tập.");
      }
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [cursors, difficulty, kind, page, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    void Promise.allSettled([api.account.stats(), api.account.activityCalendar(1)]).then(([statsResult, calendarResult]) => {
      if (statsResult.status === "fulfilled") setStats(statsResult.value);
      if (calendarResult.status === "fulfilled") setCalendar(calendarResult.value);
    });
  }, []);

  const streakDays = useMemo(() => {
    const counts = new Map((calendar?.days ?? []).map((day) => [day.date, day.count]));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      return {
        label: date.toLocaleDateString("vi-VN", { weekday: "short" }).replace("Th ", "T"),
        active: (counts.get(key) ?? 0) > 0,
      };
    });
  }, [calendar]);

  const goNext = () => {
    if (!nextCursor) return;
    setCursors((current) => {
      const copy = current.slice(0, page);
      copy[page] = nextCursor;
      return copy;
    });
    setPage((current) => current + 1);
  };

  return (
    <div>
      <PageHeader icon={Code2} title="Bài luyện tập" subtitle="Tìm, mở, chạy và nộp bài trên ngân hàng bài tập công khai." />
      <StatStrip
        className="mb-5"
        stats={[
          { label: "Đã giải", value: stats?.solvedCount ?? "—" },
          { label: "Tổng XP", value: stats?.xp ?? "—" },
          { label: "Chuỗi hiện tại", value: stats ? `${stats.currentStreakDays} ngày` : "—" },
          { label: "Bài trên trang", value: items.length },
        ]}
      />

      {/* Trên bộ lọc độ khó: gợi ý là câu trả lời cho "làm bài nào tiếp", còn bộ lọc là
          công cụ cho người đã tự biết mình muốn gì. */}
      <div className="mb-6">
        <RecommendedExercises />
      </div>

      <div className="mb-4">
        <SegmentedTabs
          options={DIFFICULTY_OPTIONS}
          value={difficulty}
          onChange={(value) => {
            setDifficulty(value);
            resetPagination();
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
              resetPagination();
            }}
            searchPlaceholder="Tìm theo tên bài, slug, tác giả..."
            activeFilterCount={Number(kind !== "all") + Number(difficulty !== "all")}
            onClearFilters={() => {
              setKind("all");
              setDifficulty("all");
              setSearch("");
              resetPagination();
            }}
            sheetTitle="Lọc bài tập"
            controls={
              <Select
                label="Dạng bài"
                value={kind}
                options={KIND_OPTIONS}
                onChange={(value) => {
                  setKind(value);
                  resetPagination();
                }}
              />
            }
          />

          {error ? <CatalogueError message={error} /> : (
            <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
              <div className="flex items-center gap-3 border-b border-border bg-bg px-4 py-3">
                <Search className="h-4 w-4 text-text-faint" />
                <span className="flex-1 text-sm font-bold text-navy">Danh sách bài tập</span>
                <span className="w-20 text-right text-xs text-text-faint">Độ khó</span>
                <span className="w-8" />
              </div>
              {loading ? (
                <ul>{Array.from({ length: 6 }, (_, index) => <li key={index} className="border-t border-border-soft px-4 py-4"><div className="h-3 w-1/3 animate-pulse rounded bg-border-soft" /></li>)}</ul>
              ) : items.length ? (
                <ul>{items.map((item, index) => <ExerciseRow key={item.id} item={item} number={(page - 1) * PAGE_SIZE + index + 1} />)}</ul>
              ) : (
                <div className="p-10 text-center">
                  <Target className="mx-auto mb-2 h-5 w-5 text-text-faint" />
                  <p className="text-sm font-semibold text-navy">Chưa có bài phù hợp</p>
                  <p className="mt-1 text-xs text-text-faint">Thử đổi độ khó, dạng bài hoặc từ khóa.</p>
                </div>
              )}
              {(page > 1 || nextCursor) && (
                <nav aria-label="Phân trang bài tập" className="flex items-center justify-between border-t border-border px-4 py-3">
                  <span className="text-xs text-text-faint">Trang {page}</span>
                  <div className="flex gap-2">
                    <button type="button" disabled={page === 1 || loading} onClick={() => setPage((current) => current - 1)} className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40">Trước</button>
                    <button type="button" disabled={!nextCursor || loading} onClick={goNext} className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40">Sau</button>
                  </div>
                </nav>
              )}
            </section>
          )}
        </main>

        <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
          <StreakCard days={streakDays} hint={stats ? `Chuỗi hiện tại ${stats.currentStreakDays} ngày · dài nhất ${stats.longestStreakDays} ngày.` : "Đang tải dữ liệu hoạt động..."} />
          <Card className="p-4 text-xs leading-5 text-text-muted">Kết quả Run/Submit, số lần thử và lịch sử bài nộp được lưu theo tài khoản và vẫn còn sau khi đăng nhập lại.</Card>
        </aside>
      </div>
    </div>
  );
}
