"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DataTable, TableCheckbox, TableToolbar, useDataTable } from "@/components/ui/data-table";
import { DOCUMENT_STATUS_META, DOCUMENT_VERDICT_META } from "@/lib/study-group/group-detail-meta";
import type { GroupDocument } from "@/types/study-group-detail";

export function DocumentsTab({ documents, canManage }: { documents: GroupDocument[]; canManage: boolean }) {
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");

  const typeOptions = useMemo(
    () => [
      { value: "all", label: "Mọi định dạng" },
      ...Array.from(new Set(documents.map((d) => d.type))).map((t) => ({ value: t, label: t })),
    ],
    [documents],
  );

  const rows = useMemo(
    () =>
      documents
        .filter((d) => status === "all" || d.status === status)
        .filter((d) => type === "all" || d.type === type),
    [documents, status, type],
  );

  const columns = useMemo<ColumnDef<GroupDocument, unknown>[]>(
    () => [
      {
        id: "select",
        size: 40,
        enableSorting: false,
        header: ({ table }) => (
          <TableCheckbox
            label="Chọn tất cả tài liệu"
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={(v) => table.toggleAllRowsSelected(v)}
          />
        ),
        cell: ({ row }) => (
          <TableCheckbox
            label={`Chọn ${row.original.title}`}
            checked={row.getIsSelected()}
            onChange={(v) => row.toggleSelected(v)}
          />
        ),
      },
      {
        accessorKey: "title",
        header: "Tài liệu",
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-navy">{row.original.title}</div>
            <div className="truncate text-xs text-text-faint">{row.original.topic}</div>
          </div>
        ),
      },
      { accessorKey: "type", header: "Định dạng", size: 110 },
      {
        accessorKey: "status",
        header: "Trạng thái",
        size: 140,
        cell: ({ row }) => {
          const meta = DOCUMENT_STATUS_META[row.original.status];
          return <Badge tone={meta.tone}>{meta.label}</Badge>;
        },
      },
      {
        accessorKey: "verdict",
        header: "AI kiểm tra",
        size: 130,
        cell: ({ row }) => {
          const meta = DOCUMENT_VERDICT_META[row.original.verdict];
          return <span className={meta.tone === "primary" ? "text-primary" : "text-text"}>{meta.label}</span>;
        },
      },
      { accessorKey: "uploaderName", header: "Người tải", size: 150 },
      {
        accessorKey: "uploadedAt",
        header: "Ngày tải",
        size: 110,
        cell: ({ row }) => (
          <div>
            <div>{row.original.uploadedAt}</div>
            <div className="text-xs text-text-faint">{row.original.sizeLabel}</div>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    initialSorting: [{ id: "title", desc: false }],
  });

  const selectedCount = table.getSelectedRowModel().rows.length;
  const globalFilter = table.getState().globalFilter ?? "";

  return (
    <div>
      <TableToolbar
        searchValue={globalFilter}
        onSearchChange={(v) => table.setGlobalFilter(v)}
        searchPlaceholder="Tìm theo tên tài liệu, chủ đề, người tải..."
        selectedCount={selectedCount}
        onClearSelection={() => table.resetRowSelection()}
        filters={
          <>
            <Select
              label="Trạng thái"
              shape="box"
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: "Mọi trạng thái" },
                { value: "published", label: "Đã duyệt" },
                { value: "pending", label: "Chờ kiểm duyệt" },
                { value: "changes", label: "Cần chỉnh sửa" },
                { value: "rejected", label: "Bị từ chối" },
              ]}
            />
            <Select label="Định dạng" shape="box" value={type} onChange={setType} options={typeOptions} />
          </>
        }
        primaryAction={
          canManage ? (
            <Button size="sm">
              <Upload className="h-3.5 w-3.5" /> Tải tài liệu lên
            </Button>
          ) : undefined
        }
        bulkActions={
          <>
            <Button size="sm" variant="outline">
              <Download className="h-3.5 w-3.5" /> Tải xuống
            </Button>
            {canManage && (
              <Button size="sm" variant="outline" className="text-primary">
                <Trash2 className="h-3.5 w-3.5" /> Xóa
              </Button>
            )}
          </>
        }
      />
      <DataTable table={table} emptyMessage="Không có tài liệu nào khớp bộ lọc." />
    </div>
  );
}
