"use client";

import { useMemo, useState } from "react";
import { Braces, Check, ChevronDown, Code2, Database, LayoutGrid, Server, Sparkles, Tags } from "lucide-react";
import type { CatalogueTopicSummary } from "@/types/catalogue";

const VISIBLE_TOPIC_LIMIT = 10;
const CATEGORY_OPTIONS = [
  { value: "algorithms", label: "Thuật toán", icon: Braces },
  { value: "database", label: "Cơ sở dữ liệu", icon: Database },
  { value: "web", label: "Web & JavaScript", icon: Code2 },
  { value: "systems", label: "Hệ thống", icon: Server },
  { value: "data_ai", label: "Dữ liệu & AI", icon: Sparkles },
] as const;

export function TopicFilter({
  topics,
  selectedIds,
  loading,
  error,
  onChange,
  onClear,
}: {
  topics: CatalogueTopicSummary[];
  selectedIds: string[];
  loading: boolean;
  error: string | null;
  onChange: (ids: string[]) => void;
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleTopics = useMemo(
    () => (expanded ? topics : topics.slice(0, VISIBLE_TOPIC_LIMIT)),
    [expanded, topics],
  );
  const categories = useMemo(
    () => CATEGORY_OPTIONS.map((category) => ({
      ...category,
      topicIds: topics.filter((topic) => topic.category === category.value).map((topic) => topic.id),
    })).filter((category) => category.topicIds.length > 0),
    [topics],
  );

  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-card"
      aria-labelledby="practice-topics-label"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="practice-topics-label" className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Tags className="h-4 w-4 text-primary" />
            Khám phá theo chủ đề
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Các chủ đề có nhiều bài được ưu tiên trước. Chọn nhiều mục để mở rộng kết quả.
          </p>
        </div>
        {topics.length > VISIBLE_TOPIC_LIMIT && (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
            className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            {expanded ? "Thu gọn" : `Thêm ${topics.length - VISIBLE_TOPIC_LIMIT} chủ đề`}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-wrap gap-2" aria-label="Đang tải chủ đề">
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index} className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{error}</p>
      ) : topics.length === 0 ? (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Chưa có bài công khai nào được gắn chủ đề.
        </p>
      ) : (
        <>
        <div className="mb-3 flex flex-wrap gap-2 border-b border-border-soft pb-3" role="group" aria-label="Nhóm chủ đề lớn">
          <button
            type="button"
            aria-pressed={selectedIds.length === 0}
            onClick={onClear}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors ${
              selectedIds.length === 0
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-muted text-foreground hover:border-foreground"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Tất cả chủ đề
          </button>
          {categories.map((category) => {
            const active = category.topicIds.every((id) => selectedIds.includes(id));
            const Icon = category.icon;
            return (
              <button
                key={category.value}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  const next = active
                    ? selectedIds.filter((id) => !category.topicIds.includes(id))
                    : [...new Set([...selectedIds, ...category.topicIds])];
                  onChange(next);
                }}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors ${
                  active
                    ? "border-primary bg-primary text-on-ink"
                    : "border-border bg-muted text-foreground hover:border-primary hover:text-primary"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {category.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Chủ đề chi tiết">
          {visibleTopics.map((topic) => {
            const selected = selectedIds.includes(topic.id);
            return (
              <button
                key={topic.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(
                  selected ? selectedIds.filter((id) => id !== topic.id) : [...selectedIds, topic.id],
                )}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors duration-150 ${
                  selected
                    ? "border-primary bg-primary text-on-ink"
                    : "border-border bg-muted text-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {selected && <Check className="h-3.5 w-3.5" />}
                {topic.name}
                <span className={selected ? "text-on-ink/70" : "text-muted-foreground"}>{topic.count}</span>
              </button>
            );
          })}
        </div>
        </>
      )}
      {selectedIds.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Đang lọc theo{" "}
          <strong className="font-semibold text-foreground">{selectedIds.length} chủ đề</strong>. Một bài chỉ cần
          khớp một chủ đề đã chọn.
        </p>
      )}
    </section>
  );
}
