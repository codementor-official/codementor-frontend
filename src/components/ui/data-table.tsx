"use client";

import { type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Inbox } from "lucide-react";

/** Ticks the header/row checkboxes. Native input so keyboard + indeterminate come free. */
export function TableCheckbox({
  checked,
  indeterminate = false,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate && !checked;
      }}
      onChange={(e) => onChange(e.target.checked)}
      onClick={(e) => e.stopPropagation()}
      className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
    />
  );
}

/**
 * Shared TanStack table shell for the group tabs. Deliberately plain: no per-cell
 * chrome, no zebra striping, no column labels repeated inside cells — the header
 * carries the label, the cell carries only the value.
 */
export function DataTable<TData>({
  table,
  emptyMessage,
  onRowClick,
}: {
  table: TanstackTable<TData>;
  emptyMessage: string;
  /** Row-level navigation; the checkbox cell stops propagation so selection still works. */
  onRowClick?: (row: TData) => void;
}) {
  const rows = table.getRowModel().rows;
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-3xl border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border">
              {headerGroup.headers.map((header) => {
                const sortable = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() === 150 ? undefined : header.getSize() }}
                    className="px-3 py-2.5 text-left text-2xs font-bold tracking-wide text-text-faint uppercase"
                  >
                    {header.isPlaceholder ? null : sortable ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 rounded-sm text-2xs font-bold tracking-wide uppercase hover:text-navy"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : sorted === "desc" ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={table.getAllLeafColumns().length} className="px-3 py-12 text-center">
                <Inbox className="mx-auto mb-2 h-5 w-5 text-text-faint" />
                <p className="text-sm text-text-muted">{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={`border-t border-border-soft ${
                  row.getIsSelected() ? "bg-primary-tint" : "hover:bg-bg"
                } ${onRowClick ? "cursor-pointer" : ""}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2.5 align-middle text-text">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Wires the common table options so each tab only declares columns + data. */
export function useDataTable<TData>({
  data,
  columns,
  globalFilter,
  onGlobalFilterChange,
  rowSelection,
  onRowSelectionChange,
  getRowId,
  initialSorting = [],
}: {
  data: TData[];
  // TanStack's own public shape for a heterogeneous column list.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  rowSelection: RowSelectionState;
  onRowSelectionChange: (value: RowSelectionState) => void;
  getRowId: (row: TData) => string;
  initialSorting?: SortingState;
}) {
  return useReactTable({
    data,
    columns,
    state: { globalFilter, rowSelection },
    initialState: { sorting: initialSorting },
    getRowId,
    enableRowSelection: true,
    onGlobalFilterChange: (updater) =>
      onGlobalFilterChange(typeof updater === "function" ? updater(globalFilter) : updater),
    onRowSelectionChange: (updater) =>
      onRowSelectionChange(typeof updater === "function" ? updater(rowSelection) : updater),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
}

/** Bar above a table: search, filters, then a selection-aware action strip. */
export function TableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  selectedCount,
  onClearSelection,
  bulkActions,
  primaryAction,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filters?: ReactNode;
  selectedCount: number;
  onClearSelection: () => void;
  /** Rendered only while rows are selected. */
  bulkActions?: ReactNode;
  /** Always-visible action on the right, e.g. "Tải tài liệu lên". */
  primaryAction?: ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-9 min-w-48 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-navy outline-none placeholder:text-text-faint focus:border-navy"
        />
        {filters}
        {primaryAction}
      </div>
      {selectedCount > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-primary bg-primary-tint px-3 py-2">
          <span className="text-xs font-semibold text-navy">Đã chọn {selectedCount} mục</span>
          <button
            type="button"
            onClick={onClearSelection}
            className="text-xs font-medium text-text-muted underline-offset-2 hover:text-navy hover:underline"
          >
            Bỏ chọn
          </button>
          <div className="ml-auto flex flex-wrap items-center gap-2">{bulkActions}</div>
        </div>
      )}
    </div>
  );
}
