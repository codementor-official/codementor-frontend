"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, Rows3, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CourseCard } from "@/components/course-card";
import { ProblemRow } from "@/components/problem-row";
import { SegmentedTabs, type SegmentedTabOption } from "@/components/ui/segmented-tabs";
import { samplePracticeItems } from "@/data/sample-courses";
import type { Difficulty } from "@/components/ui/badge";

type DifficultyFilter = Difficulty | "all";

function parseParticipants(value?: string) {
  if (!value) return 0;
  return Number(value.replace(/\./g, "")) || 0;
}

export default function PracticePage() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [view, setView] = useState<"list" | "grid">("list");

  const tabs: SegmentedTabOption[] = useMemo(() => {
    const counts: Record<DifficultyFilter, number> = {
      all: samplePracticeItems.length,
      "Cơ bản": 0,
      "Trung bình": 0,
      "Nâng cao": 0,
    };
    for (const item of samplePracticeItems) counts[item.difficulty] += 1;
    return [
      { value: "all", label: "Tất cả", count: counts.all },
      { value: "Cơ bản", label: "Cơ bản", count: counts["Cơ bản"] },
      { value: "Trung bình", label: "Trung bình", count: counts["Trung bình"] },
      { value: "Nâng cao", label: "Nâng cao", count: counts["Nâng cao"] },
    ];
  }, []);

  const items = useMemo(() => {
    const query = search.trim().toLowerCase();
    return samplePracticeItems
      .filter((item) => difficulty === "all" || item.difficulty === difficulty)
      .filter((item) => {
        if (!query) return true;
        const haystack = `${item.title} ${item.desc} ${(item.tags ?? []).join(" ")}`.toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => parseParticipants(b.participants) - parseParticipants(a.participants));
  }, [search, difficulty]);

  return (
    <div>
      <PageHeader
        title="Luyện tập"
        subtitle="Duyệt qua các thử thách, bộ sưu tập và bài luyện tập hàng tuần"
      />

      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Placeholder label="Đã làm" />
        <Placeholder label="Tổng bài" />
        <Placeholder label="Đang thịnh hành" />
        <Placeholder label="Bộ sưu tập" />
      </div>

      <Placeholder label="Bài tập đề xuất cho bạn (AI)" className="mb-5" />

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="min-w-[220px] flex-1">
          <Input
            icon={<Search />}
            placeholder="Tìm bài luyện tập theo tên, chủ đề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="inline-flex items-center gap-1 rounded-md border border-border bg-surface p-1">
          <button
            type="button"
            aria-label="Xem dạng danh sách"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
            className={`flex h-8 w-8 items-center justify-center rounded-md ${
              view === "list" ? "bg-navy text-white" : "text-text-muted hover:bg-bg"
            }`}
          >
            <Rows3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Xem dạng lưới"
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
            className={`flex h-8 w-8 items-center justify-center rounded-md ${
              view === "grid" ? "bg-navy text-white" : "text-text-muted hover:bg-bg"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      <SegmentedTabs
        options={tabs}
        value={difficulty}
        onChange={(v) => setDifficulty(v as DifficultyFilter)}
        className="mb-4"
      />

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface p-10 text-center">
          <p className="mb-1 text-sm font-semibold text-navy">Không tìm thấy bài luyện tập phù hợp</p>
          <p className="text-xs text-text-faint">Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc độ khó.</p>
        </div>
      ) : view === "list" ? (
        <Card className="overflow-hidden">
          {items.map((item) => (
            <ProblemRow
              key={item.title}
              tile={item.tile}
              tileVariant={item.tileVariant}
              title={item.title}
              meta={(item.tags ?? []).join(" · ")}
              difficulty={item.difficulty}
              stats={item.participants ? [{ label: "lượt làm", value: item.participants }] : undefined}
              href={item.href ?? "#"}
            />
          ))}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <CourseCard key={item.title} {...item} />
          ))}
        </div>
      )}
    </div>
  );
}
