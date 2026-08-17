"use client";

import { useState, type ReactNode } from "react";
import { Download } from "lucide-react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Button } from "./button";
import { DataTable, TablePagination, useDataTable } from "./data-table";
import { exportTableToCsv } from "./export-csv";
import { FilterBar } from "./filter-bar";
import { PageHeader } from "./page-header";
import { SegmentedTabs, type SegmentedTabOption } from "./segmented-tabs";
import { SideDrawer } from "./side-drawer";

export interface ManagePageProps<TData> {
  title: string;
  description?: string;
  /** The one primary action for this screen, rendered beside the title. */
  action?: ReactNode;
  /** Scope switch for the screen — "mine" versus the shared catalogue. Rendered inside the
   * header row rather than above it, so a screen with tabs is not three stacked blocks. */
  tabs?: {
    options: SegmentedTabOption[];
    value: string;
    onChange: (value: string) => void;
  };

  rows: TData[];
  // TanStack's own public shape for a heterogeneous column list.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  getRowId: (row: TData) => string;
  initialSorting?: SortingState;
  /** Cột ẩn khỏi bảng nhưng vẫn xuất ra CSV, theo id. */
  columnVisibility?: Record<string, boolean>;

  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Selects and toggles for the advanced filter popover. */
  filters?: ReactNode;
  activeFilterCount?: number;
  onClearFilters?: () => void;

  emptyMessage: string;
  loading?: boolean;
  error?: string | null;

  /** Tên tệp khi xuất CSV, không kèm đuôi. Bỏ trống thì suy từ `title`. */
  exportFilename?: string;

  /** Right-hand drawer contents for the selected row. Absent means rows are not clickable. */
  drawer?: {
    title: (row: TData) => string;
    description?: (row: TData) => string;
    body: (row: TData) => ReactNode;
    footer?: (row: TData) => ReactNode;
    width?: "default" | "wide";
  };
}

/** Tên tệp tải về từ tiêu đề trang. Bỏ dấu tiếng Việt vì tên tệp có dấu hay vỡ khi đi
 * qua email hoặc một máy chủ tệp cũ. */
function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * The one screen shape every content domain uses: title with a single primary action,
 * a search and filter bar, a sortable table, and a right-hand drawer for the selected
 * row. Exercises, courses and roadmaps differ only in their columns and filters.
 *
 * Sharing this is the whole point. The web application drifted into a different layout
 * per screen, so the same task looks different depending on where you do it; keeping
 * every management screen inside one component makes that impossible rather than merely
 * discouraged.
 */
export function ManagePage<TData>({
  title,
  description,
  action,
  tabs,
  rows,
  columns,
  getRowId,
  initialSorting,
  columnVisibility,
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  activeFilterCount,
  onClearFilters,
  emptyMessage,
  loading = false,
  error = null,
  exportFilename,
  drawer,
}: ManagePageProps<TData>) {
  // Holds the id, not the row. A row object captured here goes stale the moment the
  // list refetches, and the drawer would keep showing values that no longer exist.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? (rows.find((row) => getRowId(row) === selectedId) ?? null) : null;

  const table = useDataTable({ data: rows, columns, getRowId, initialSorting, columnVisibility });

  return (
    <>
      <PageHeader
        action={
          // Nút xuất nằm ở ĐÂY chứ không phải ở từng màn: mọi màn quản trị đều dựng từ
          // component này, nên thêm một bảng mới là có sẵn nút xuất, không phải nhớ.
          <div className="flex items-center gap-2">
            <Button
              disabled={rows.length === 0}
              onClick={() => exportTableToCsv(table, exportFilename ?? slugify(title))}
              type="button"
              variant="outline"
            >
              <Download aria-hidden="true" className="size-4" />
              Xuất Excel
            </Button>
            {action}
          </div>
        }
        center={
          tabs && (
            <SegmentedTabs onChange={tabs.onChange} options={tabs.options} value={tabs.value} />
          )
        }
        description={description}
        title={title}
      />

      {filters !== undefined || search !== undefined ? (
        <div className="mb-3">
          <FilterBar
            activeFilterCount={activeFilterCount}
            controls={filters}
            onClearFilters={onClearFilters}
            onSearchChange={onSearchChange}
            searchPlaceholder={searchPlaceholder}
            searchValue={search}
          />
        </div>
      ) : null}

      {error && (
        <p
          className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      <DataTable
        emptyMessage={loading ? "Đang tải…" : emptyMessage}
        onRowClick={drawer ? (row) => setSelectedId(getRowId(row)) : undefined}
        table={table}
      />
      <TablePagination table={table} />

      {drawer && selected && (
        <SideDrawer
          description={drawer.description?.(selected)}
          footer={drawer.footer?.(selected)}
          onClose={() => setSelectedId(null)}
          open
          title={drawer.title(selected)}
          width={drawer.width}
        >
          {drawer.body(selected)}
        </SideDrawer>
      )}
    </>
  );
}
