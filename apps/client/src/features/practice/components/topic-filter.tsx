"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Tags, X } from "lucide-react";
import type { CatalogueTopicSummary } from "@/types/catalogue";

const VISIBLE_TOPIC_LIMIT = 8;
const CATEGORY_LABELS: Record<string, string> = {
  algorithms: "Thuật toán",
  database: "Cơ sở dữ liệu",
  web: "Web & JavaScript",
  systems: "Hệ thống",
  data_ai: "Dữ liệu & AI",
  foundations: "Nền tảng",
  other: "Khác",
};
const CATEGORY_ORDER = ["algorithms", "database", "web", "systems", "data_ai", "foundations", "other"];

export function TopicFilter({
  topics,
  selectedIds,
  loading,
  error,
  onChange,
  onClear,
  label = "Chủ đề",
  standalone = false,
}: {
  topics: CatalogueTopicSummary[];
  selectedIds: string[];
  loading: boolean;
  error: string | null;
  onChange: (ids: string[]) => void;
  onClear: () => void;
  label?: string;
  standalone?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const categories = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        topicIds: topics.filter((topic) => topic.category === category).map((topic) => topic.id),
      })).filter((item) => item.topicIds.length > 0),
    [topics],
  );
  const effectiveCategory = selectedIds.length === 0 ? "all" : activeCategory;
  const scopedTopics = useMemo(
    () => effectiveCategory === "all" ? topics : topics.filter((topic) => topic.category === effectiveCategory),
    [effectiveCategory, topics],
  );
  const visibleTopics = useMemo(() => {
    if (expanded) return scopedTopics;
    const selected = scopedTopics.filter((topic) => selectedIds.includes(topic.id));
    const rest = scopedTopics.filter((topic) => !selectedIds.includes(topic.id));
    return [...selected, ...rest].slice(0, VISIBLE_TOPIC_LIMIT);
  }, [expanded, scopedTopics, selectedIds]);

  const chooseCategory = (category: string, topicIds: string[]) => {
    setExpanded(false);
    setActiveCategory(category);
    onChange(topicIds);
  };

  return (
    <div
      className={`${standalone ? "rounded-xl border border-border" : "border-b border-border"} bg-bg px-3 py-3 sm:px-4`}
      aria-label={`Lọc theo ${label.toLowerCase()}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex h-8 items-center gap-1.5 text-xs font-semibold text-foreground">
          <Tags className="h-3.5 w-3.5 text-primary" />
          {label}
        </span>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setActiveCategory("all");
              onClear();
            }}
            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-danger hover:bg-danger/10"
          >
            <X className="h-3.5 w-3.5" /> Xóa {selectedIds.length} lựa chọn
          </button>
        )}
      </div>

      {loading ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className="h-8 w-20 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
      ) : error ? (
        <p className="mt-2 text-xs text-muted-foreground">{error}</p>
      ) : topics.length > 0 ? (
        <>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Nhóm chủ đề lớn">
            <button
              type="button"
              aria-pressed={selectedIds.length === 0}
              onClick={() => {
                setActiveCategory("all");
                setExpanded(false);
                onClear();
              }}
              className={`h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
                selectedIds.length === 0
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Tất cả
            </button>
            {categories.map(({ category, topicIds }) => {
              const selected = topicIds.length > 0 && topicIds.every((id) => selectedIds.includes(id));
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => chooseCategory(category, topicIds)}
                  className={`h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
                    selected
                      ? "bg-primary text-on-ink"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {CATEGORY_LABELS[category] ?? category}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border-soft pt-3" role="group" aria-label="Chủ đề chi tiết">
            <span className="mr-1 text-2xs font-semibold uppercase tracking-wide text-text-faint">Chi tiết</span>
            {visibleTopics.map((topic) => {
              const selected = selectedIds.includes(topic.id);
              return (
                <button
                  key={topic.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange(selected ? selectedIds.filter((id) => id !== topic.id) : [...selectedIds, topic.id])}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-muted-foreground hover:border-primary hover:text-foreground"
                  }`}
                >
                  {selected && <Check className="h-3 w-3" />}
                  {topic.name}
                  <span className="text-text-faint">{topic.count}</span>
                </button>
              );
            })}
            {scopedTopics.length > VISIBLE_TOPIC_LIMIT && (
              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                aria-expanded={expanded}
                className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {expanded ? "Thu gọn" : `Thêm ${scopedTopics.length - VISIBLE_TOPIC_LIMIT}`}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Chưa có chủ đề phù hợp.</p>
      )}
    </div>
  );
}
