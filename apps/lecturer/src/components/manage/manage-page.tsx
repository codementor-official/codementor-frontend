"use client";

import { useState, type ReactNode } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  DataTable,
  FilterBar,
  SideDrawer,
  TablePagination,
  useDataTable,
} from "@codementor/ui";
import { PageHeader } from "@/components/page/page-header";

export interface ManagePageProps<TData> {
  title: string;
  description?: string;
  /** The one primary action for this screen, rendered beside the title. */
  action?: ReactNode;

  rows: TData[];
  // TanStack's own public shape for a heterogeneous column list.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  getRowId: (row: TData) => string;
  initialSorting?: SortingState;

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

  /** Right-hand drawer contents for the selected row. Absent means rows are not clickable. */
  drawer?: {
    title: (row: TData) => string;
    description?: (row: TData) => string;
    body: (row: TData) => ReactNode;
    footer?: (row: TData) => ReactNode;
    width?: "default" | "wide";
  };
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
  rows,
  columns,
  getRowId,
  initialSorting,
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  activeFilterCount,
  onClearFilters,
  emptyMessage,
  loading = false,
  error = null,
  drawer,
}: ManagePageProps<TData>) {
  // Holds the id, not the row. A row object captured here goes stale the moment the
  // list refetches, and the drawer would keep showing values that no longer exist.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? (rows.find((row) => getRowId(row) === selectedId) ?? null) : null;

  const table = useDataTable({ data: rows, columns, getRowId, initialSorting });

  return (
    <>
      <PageHeader action={action} description={description} title={title} />

      {filters !== undefined || search !== undefined ? (
        <div className="mb-4">
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
