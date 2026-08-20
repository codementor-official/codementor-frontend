"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Download, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Button } from "./button";
import { DataTable, TablePagination, useDataTable, useFittedPageSize } from "./data-table";
import { exportTableToCsv } from "./export-csv";
import { FilterBar } from "./filter-bar";
import { PageHeader } from "./page-header";
import { SegmentedTabs, type SegmentedTabOption } from "./segmented-tabs";
import { SideDrawer } from "./side-drawer";
import { ViewToggle, type ViewMode } from "./view-toggle";

export interface ManagePageProps<TData> {
  title: string;
  description?: string;
  /** Square tile beside the title — see `PageHeader`. */
  icon?: LucideIcon;
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

  /**
   * Nạp lại đúng bảng này. Bỏ trống thì không có nút — màn nào không tự đọc dữ liệu
   * (danh sách tĩnh) thì một nút làm mới là lời hứa suông.
   *
   * Ở ĐÂY chứ không ở từng màn, cùng lý do như nút "Xuất Excel" ngay bên cạnh: mọi bảng
   * quản trị đều dựng từ component này, nên thêm một bảng mới là có sẵn nút làm mới với
   * đúng vị trí, đúng trạng thái quay, đúng nhãn — không phải nhớ, và không thể lệch.
   *
   * Nơi gọi KHÔNG được xoá bộ lọc hay quay về trang 1: hàm này chỉ đọc lại dữ liệu với
   * đúng bộ lọc đang có. Người dùng bấm làm mới là để thấy dữ liệu mới của thứ họ đang
   * xem, không phải để bắt đầu lại.
   */
  onRefresh?: () => void | Promise<unknown>;

  /** Right-hand drawer contents for the selected row. Absent means rows are not clickable. */
  drawer?: {
    title: (row: TData) => string;
    description?: (row: TData) => string;
    body: (row: TData) => ReactNode;
    footer?: (row: TData) => ReactNode;
    width?: "default" | "wide";
  };

  /** Table/grid toggle — same `rows`, same filter state, same pagination, only the paint
   * differs. Omit to keep the table-only behavior every existing screen already has. */
  view?: {
    mode: ViewMode;
    onModeChange: (mode: ViewMode) => void;
    renderCard: (row: TData) => ReactNode;
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
  icon,
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
  onRefresh,
  drawer,
  view,
}: ManagePageProps<TData>) {
  // Holds the id, not the row. A row object captured here goes stale the moment the
  // list refetches, and the drawer would keep showing values that no longer exist.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? (rows.find((row) => getRowId(row) === selectedId) ?? null) : null;

  const table = useDataTable({ data: rows, columns, getRowId, initialSorting, columnVisibility });

  // Bảng cao đúng phần màn hình còn lại thay vì cứng 10 dòng — xem `useFittedPageSize`.
  const tableRef = useRef<HTMLDivElement>(null);
  const fittedPageSize = useFittedPageSize(tableRef);
  useEffect(() => table.setPageSize(fittedPageSize), [table, fittedPageSize]);

  return (
    <>
      <PageHeader
        action={
          // Nút xuất nằm ở ĐÂY chứ không phải ở từng màn: mọi màn quản trị đều dựng từ
          // component này, nên thêm một bảng mới là có sẵn nút xuất, không phải nhớ.
          <div className="flex items-center gap-2">
            {onRefresh && <RefreshButton onRefresh={onRefresh} />}
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
        icon={icon}
        title={title}
      />

      {filters !== undefined || search !== undefined || view ? (
        <div className="mb-3 flex items-start gap-2">
          {(filters !== undefined || search !== undefined) && (
            <div className="min-w-0 flex-1">
              <FilterBar
                activeFilterCount={activeFilterCount}
                controls={filters}
                onClearFilters={onClearFilters}
                onSearchChange={onSearchChange}
                searchPlaceholder={searchPlaceholder}
                searchValue={search}
              />
            </div>
          )}
          {view && <ViewToggle mode={view.mode} onChange={view.onModeChange} />}
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

      <div ref={tableRef}>
        {view?.mode === "grid" ? (
          <CardGrid
            emptyMessage={loading ? "Đang tải…" : emptyMessage}
            getRowId={getRowId}
            onCardClick={drawer ? (row) => setSelectedId(getRowId(row)) : undefined}
            renderCard={view.renderCard}
            rows={table.getRowModel().rows.map((row) => row.original)}
          />
        ) : (
          <DataTable
            emptyMessage={loading ? "Đang tải…" : emptyMessage}
            onRowClick={drawer ? (row) => setSelectedId(getRowId(row)) : undefined}
            table={table}
          />
        )}
        <TablePagination table={table} />
      </div>

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

/**
 * Nút nạp lại một bảng.
 *
 * Trạng thái quay là của RIÊNG nút, không lấy từ `loading` của trang: `loading` cũng bật
 * lên ở lần tải đầu và sau mỗi lần đổi bộ lọc, nên dùng nó ở đây sẽ khiến nút quay tít
 * vào những lúc người dùng không hề bấm gì.
 *
 * Nó cũng không dựng lại bảng: `rows` giữ nguyên trong lúc nạp, nên bảng không nháy trắng
 * rồi hiện lại. Đó là điểm khác biệt cả tính năng này tồn tại vì nó — F5 cả trang thì
 * bộ lọc, ô tìm kiếm, trang hiện tại và ngăn chi tiết đang mở đều mất sạch.
 */
function RefreshButton({ onRefresh }: { onRefresh: () => void | Promise<unknown> }) {
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button aria-label="Làm mới" disabled={busy} onClick={() => void run()} type="button" variant="outline">
      <RefreshCw aria-hidden="true" className={`size-4 ${busy ? "animate-spin" : ""}`} />
      {busy ? "Đang tải…" : "Làm mới"}
    </Button>
  );
}

/** Lưới thẻ cho `ManagePage`'s `view="grid"` — cùng các hàng đã lọc/phân trang mà bảng
 * dùng, chỉ khác cách vẽ từng hàng. */
function CardGrid<TData>({
  rows,
  getRowId,
  renderCard,
  onCardClick,
  emptyMessage,
}: {
  rows: TData[];
  getRowId: (row: TData) => string;
  renderCard: (row: TData) => ReactNode;
  onCardClick?: (row: TData) => void;
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) =>
        onCardClick ? (
          <button
            className="rounded-lg text-left transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
            key={getRowId(row)}
            onClick={() => onCardClick(row)}
            type="button"
          >
            {renderCard(row)}
          </button>
        ) : (
          <div key={getRowId(row)}>{renderCard(row)}</div>
        ),
      )}
    </div>
  );
}
