"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DURATION_FILTER_OPTIONS,
  FIELD_FILTER_OPTIONS,
  LEVEL_FILTER_OPTIONS,
  SORT_OPTIONS,
  type RoadmapFilterState,
  type RoadmapSort,
} from "@/lib/roadmap/roadmap-filter";
import type { CurrentLevel } from "@/types/learning-preference";
import type { RoadmapField } from "@/types/roadmap";

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-navy outline-none focus:border-navy sm:w-auto"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function RoadmapFilterBar({
  filters,
  onChange,
  technologyOptions,
}: {
  filters: RoadmapFilterState;
  onChange: (patch: Partial<RoadmapFilterState>) => void;
  technologyOptions: string[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const controls = (
    <>
      <FilterSelect
        label="Lĩnh vực"
        value={filters.field}
        options={FIELD_FILTER_OPTIONS}
        onChange={(v) => onChange({ field: v as RoadmapField | "all" })}
      />
      <FilterSelect
        label="Trình độ"
        value={filters.level}
        options={LEVEL_FILTER_OPTIONS}
        onChange={(v) => onChange({ level: v as CurrentLevel | "all" })}
      />
      <FilterSelect
        label="Công nghệ"
        value={filters.technology}
        options={[{ value: "all", label: "Tất cả công nghệ" }, ...technologyOptions.map((t) => ({ value: t, label: t }))]}
        onChange={(v) => onChange({ technology: v })}
      />
      <FilterSelect
        label="Thời lượng"
        value={String(filters.maxDurationHours)}
        options={DURATION_FILTER_OPTIONS.map((d) => ({ value: String(d.value), label: d.label }))}
        onChange={(v) => onChange({ maxDurationHours: v === "all" ? "all" : Number(v) })}
      />
      <FilterSelect
        label="Sắp xếp"
        value={filters.sort}
        options={SORT_OPTIONS}
        onChange={(v) => onChange({ sort: v as RoadmapSort })}
      />
    </>
  );

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2.5">
      <div className="min-w-[220px] flex-1">
        <Input
          icon={<Search />}
          placeholder="Tìm lộ trình theo tên, công nghệ..."
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>

      <div className="hidden flex-wrap items-center gap-2.5 sm:flex">{controls}</div>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3.5 py-2.5 text-xs font-semibold text-navy sm:hidden"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" /> Bộ lọc
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end bg-navy/55 sm:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-full rounded-t-xl bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold text-navy">Bộ lọc</span>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Đóng bộ lọc">
                <X className="h-4 w-4 text-text-muted" />
              </button>
            </div>
            <div className="flex flex-col gap-2.5">{controls}</div>
          </div>
        </div>
      )}
    </div>
  );
}
