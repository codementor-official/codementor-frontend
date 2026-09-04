"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Code2, FileCode2, Target } from "lucide-react";
import { FilterBar, Select, StatStrip } from "@codementor/ui";
import { PageHeader } from "@/components/page-header";
import { StreakCard } from "@/components/streak-card";
import { Card } from "@/components/ui/card";
import { RecommendedExercises } from "@/components/recommendation/recommended";
import { CatalogueError } from "@/components/ui/catalogue-state";
import { api } from "@/lib/api";
import { DIFFICULTY_OPTIONS, exerciseDifficulty } from "@/lib/catalogue/level";
import type { Difficulty } from "@/components/ui/badge";
import type { ExerciseProgressSummary, ExerciseSummary } from "@/types/catalogue";
import type { UserActivityCalendar, UserLearningStats } from "@/features/account/types";
import { SaveButton } from "@/features/saved/components/save-button";
import { ReportButton } from "@/features/reports/report-button";
import { TopicFilter } from "@/features/practice/components/topic-filter";
import type { ExerciseTopicSummary } from "@/types/catalogue";

const PAGE_SIZE = 10;
const KIND_OPTIONS = [
  { value: "all", label: "Mọi dạng bài" },
  { value: "code", label: "Bài code" },
  { value: "quiz", label: "Trắc nghiệm" },
  { value: "theory", label: "Lý thuyết / tự luận" },
];
const PROGRESS_OPTIONS = [
  { value: "all", label: "Mọi trạng thái" },
  { value: "solved", label: "Đã giải" },
  { value: "attempted", label: "Đang làm" },
  { value: "unsolved", label: "Chưa giải" },
];

function difficultyClass(difficulty: Difficulty) {
  return difficulty === "Cơ bản" ? "text-success" : difficulty === "Trung bình" ? "text-accent" : "text-danger";
}

function exerciseKindLabel(kind: string) {
  return KIND_OPTIONS.find((option) => option.value === kind)?.label ?? "Bài tập";
}

function ExerciseRow({ item, number }: { item: ExerciseSummary; number: number }) {
  const difficulty = exerciseDifficulty(item.difficulty);
  return (
    <li className="group flex items-center gap-3 border-t border-border-soft px-3 py-3 transition-colors duration-150 hover:bg-bg sm:px-4">
      <span className="hidden w-7 shrink-0 text-right text-xs tabular-nums text-text-faint md:block">{number}</span>
      <span className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-md sm:flex ${
        item.progressStatus === "solved"
          ? "bg-success/10 text-success"
          : item.progressStatus === "attempted"
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
      }`} title={item.progressStatus === "solved" ? "Đã giải" : item.progressStatus === "attempted" ? "Đang làm" : "Chưa giải"}>
        {item.progressStatus === "solved" ? <CheckCircle2 className="h-4 w-4" /> : item.progressStatus === "attempted" ? <Clock3 className="h-4 w-4" /> : <FileCode2 className="h-4 w-4" />}
      </span>
      <Link href={`/solve/${item.id}`} className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary">{item.title}</span>
        {item.summary && <span className="mt-0.5 block truncate text-xs text-text-muted">{item.summary}</span>}
        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-2xs text-text-faint">
          <span>{item.authorName ?? "CodeMentor"}</span>
          <span aria-hidden="true">·</span>
          <span>{new Date(item.updatedAt).toLocaleDateString("vi-VN")}</span>
          {item.topics.slice(0, 3).map((topic) => (
            <span key={topic.id} className="rounded-sm bg-border-soft px-1.5 py-0.5 font-medium text-text-muted">
              {topic.name}
            </span>
          ))}
          {item.topics.length > 3 && <span>+{item.topics.length - 3}</span>}
        </span>
      </Link>
      <span className="hidden w-28 shrink-0 text-xs text-muted-foreground lg:block">{exerciseKindLabel(item.kind)}</span>
      <span className={`w-20 shrink-0 text-right text-xs font-semibold ${difficultyClass(difficulty)}`}>{difficulty}</span>
      <div className="flex w-20 shrink-0 justify-end gap-1">
        <SaveButton compact targetType="EXERCISE" targetId={item.id} />
        <ReportButton compact targetType="EXERCISE" targetId={item.id} />
      </div>
    </li>
  );
}

export default function PracticePage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [progress, setProgress] = useState("all");
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [topics, setTopics] = useState<ExerciseTopicSummary[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [cursors, setCursors] = useState<Array<string | undefined>>([undefined]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [items, setItems] = useState<ExerciseSummary[]>([]);
  const [stats, setStats] = useState<UserLearningStats | null>(null);
  const [progressSummary, setProgressSummary] = useState<ExerciseProgressSummary | null>(null);
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
        topicIds: selectedTopicIds.length ? selectedTopicIds.join(",") : undefined,
        progress: progress === "all" ? undefined : progress as "solved" | "attempted" | "unsolved",
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
  }, [cursors, difficulty, kind, page, progress, query, selectedTopicIds]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    void Promise.allSettled([api.account.stats(), api.account.activityCalendar(4), api.exercises.progressSummary()]).then(([statsResult, calendarResult, summaryResult]) => {
      if (statsResult.status === "fulfilled") setStats(statsResult.value);
      if (calendarResult.status === "fulfilled") setCalendar(calendarResult.value);
      if (summaryResult.status === "fulfilled") setProgressSummary(summaryResult.value);
    });
  }, []);

  useEffect(() => {
    let active = true;
    void api.exercises
      .topics()
      .then((response) => {
        if (active) setTopics(response);
      })
      .catch(() => {
        if (active) setTopicsError("Không tải được danh sách chủ đề. Bạn vẫn có thể tìm và lọc theo độ khó.");
      })
      .finally(() => {
        if (active) setTopicsLoading(false);
      });
    return () => {
      active = false;
    };
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
          { label: "Tổng bài công khai", value: progressSummary?.total ?? "—" },
          { label: "Đã giải", value: progressSummary?.solved ?? "—" },
          { label: "Chưa giải", value: progressSummary?.unsolved ?? "—" },
          { label: "Đang làm", value: progressSummary?.attempted ?? "—" },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
        <main className="min-w-0">
          {!search.trim() &&
            difficulty === "all" &&
            kind === "all" &&
            selectedTopicIds.length === 0 &&
            page === 1 && (
              <section className="mb-6" aria-label="Bài tập đề xuất">
                <RecommendedExercises limit={3} title="Gợi ý tiếp theo" />
              </section>
            )}
          <div className="mb-4">
            <TopicFilter
              topics={topics}
              selectedIds={selectedTopicIds}
              loading={topicsLoading}
              error={topicsError}
              onChange={(ids) => {
                setSelectedTopicIds(ids);
                resetPagination();
              }}
              onClear={() => {
                setSelectedTopicIds([]);
                resetPagination();
              }}
            />
          </div>
          <FilterBar
            className="mb-3"
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              resetPagination();
            }}
            searchPlaceholder="Tìm theo tên bài, slug, tác giả..."
            activeFilterCount={Number(kind !== "all") + Number(difficulty !== "all") + Number(progress !== "all") + selectedTopicIds.length}
            onClearFilters={() => {
              setKind("all");
              setDifficulty("all");
              setProgress("all");
              setSelectedTopicIds([]);
              setSearch("");
              resetPagination();
            }}
            sheetTitle="Lọc bài tập"
            controls={
              <>
                <Select
                  label="Dạng bài"
                  value={kind}
                  options={KIND_OPTIONS}
                  onChange={(value) => {
                    setKind(value);
                    resetPagination();
                  }}
                />
                <Select
                  label="Tiến độ"
                  value={progress}
                  options={PROGRESS_OPTIONS}
                  onChange={(value) => {
                    setProgress(value);
                    resetPagination();
                  }}
                />
                <Select
                  label="Độ khó"
                  value={difficulty}
                  options={DIFFICULTY_OPTIONS}
                  onChange={(value) => {
                    setDifficulty(value);
                    resetPagination();
                  }}
                />
              </>
            }
          />

          {error ? (
            <CatalogueError message={error} />
          ) : (
            <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
              <div className="flex items-center gap-3 border-b border-border bg-bg px-4 py-3">
                <span className="hidden w-7 md:block" />
                <span className="hidden w-8 sm:block" />
                <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Bài tập
                </span>
                <span className="hidden w-28 text-xs font-semibold text-muted-foreground lg:block">
                  Dạng bài
                </span>
                <span className="w-20 text-right text-xs text-text-faint">Độ khó</span>
                <span className="w-20" />
              </div>
              {loading ? (
                <ul>
                  {Array.from({ length: 6 }, (_, index) => (
                    <li key={index} className="border-t border-border-soft px-4 py-4">
                      <div className="h-3 w-1/3 animate-pulse rounded bg-border-soft" />
                    </li>
                  ))}
                </ul>
              ) : items.length ? (
                <ul>
                  {items.map((item, index) => (
                    <ExerciseRow key={item.id} item={item} number={(page - 1) * PAGE_SIZE + index + 1} />
                  ))}
                </ul>
              ) : (
                <div className="p-10 text-center">
                  <Target className="mx-auto mb-2 h-5 w-5 text-text-faint" />
                  <p className="text-sm font-semibold text-navy">Chưa có bài phù hợp</p>
                  <p className="mt-1 text-xs text-text-faint">Thử đổi chủ đề, độ khó, dạng bài hoặc từ khóa.</p>
                </div>
              )}
              {(page > 1 || nextCursor) && (
                <nav
                  aria-label="Phân trang bài tập"
                  className="flex items-center justify-between border-t border-border px-4 py-3"
                >
                  <span className="text-xs text-text-faint">Trang {page}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page === 1 || loading}
                      onClick={() => setPage((current) => current - 1)}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                    >
                      Trước
                    </button>
                    <button
                      type="button"
                      disabled={!nextCursor || loading}
                      onClick={goNext}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                    >
                      Sau
                    </button>
                  </div>
                </nav>
              )}
            </section>
          )}
        </main>

        <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
          <StreakCard
            days={streakDays}
            hint={
              stats
                ? `Chuỗi hiện tại ${stats.currentStreakDays} ngày · dài nhất ${stats.longestStreakDays} ngày.`
                : "Đang tải dữ liệu hoạt động..."
            }
          />
          <Card className="p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <Target className="h-4 w-4 text-primary" /> Tiến độ của bạn
            </h2>
            <dl className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Bài đã giải</dt>
                <dd className="font-bold text-foreground">{stats?.solvedCount ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Tổng XP</dt>
                <dd className="font-bold text-foreground">{stats?.xp ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Chuỗi dài nhất</dt>
                <dd className="font-bold text-foreground">
                  {stats ? `${stats.longestStreakDays} ngày` : "—"}
                </dd>
              </div>
            </dl>
          </Card>
          <Card className="p-4 text-xs leading-5 text-text-muted">
            Kết quả Run/Submit, số lần thử và lịch sử bài nộp được lưu theo tài khoản và vẫn còn sau khi đăng
            nhập lại.
          </Card>
        </aside>
      </div>
    </div>
  );
}
