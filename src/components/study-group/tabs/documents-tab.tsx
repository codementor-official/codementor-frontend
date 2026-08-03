"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, Download, Eye, EyeOff, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { DataTable, TableCheckbox, TableToolbar, useDataTable } from "@/components/ui/data-table";
import { DocumentPreviewModal } from "@/components/study-group/document-preview-modal";
import {
  DOCUMENT_STATUS_META,
  DOCUMENT_VERDICT_META,
  visibleDocuments,
} from "@/lib/study-group/group-detail-meta";
import type { GroupDocument } from "@/types/study-group-detail";

/** Which bulk action the confirm dialog is currently gating. */
type PendingAction = { kind: "delete" | "hide"; docs: GroupDocument[] } | null;

export function DocumentsTab({ documents, canManage }: { documents: GroupDocument[]; canManage: boolean }) {
  // ponytail: session-scoped moderation. Swap for a service call when there's a backend.
  const [docs, setDocs] = useState(documents);
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [preview, setPreview] = useState<GroupDocument | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);

  const typeOptions = useMemo(
    () => [
      { value: "all", label: "Mọi định dạng" },
      ...Array.from(new Set(docs.map((d) => d.type))).map((t) => ({ value: t, label: t })),
    ],
    [docs],
  );

  const rows = useMemo(
    () =>
      visibleDocuments(docs, canManage)
        .filter((d) => status === "all" || d.status === status)
        .filter((d) => type === "all" || d.type === type),
    [docs, canManage, status, type],
  );

  const applyStatus = (targets: GroupDocument[], next: GroupDocument["status"]) => {
    const ids = new Set(targets.map((d) => d.id));
    setDocs((prev) => prev.map((d) => (ids.has(d.id) ? { ...d, status: next } : d)));
  };

  const removeDocs = (targets: GroupDocument[]) => {
    const ids = new Set(targets.map((d) => d.id));
    setDocs((prev) => prev.filter((d) => !ids.has(d.id)));
  };

  const columns = useMemo<ColumnDef<GroupDocument, unknown>[]>(
    () => [
      ...(canManage
        ? [
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
            } satisfies ColumnDef<GroupDocument, unknown>,
          ]
        : []),
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
      ...(canManage
        ? [
            {
              accessorKey: "verdict",
              header: "AI kiểm tra",
              size: 130,
              cell: ({ row }) => {
                const meta = DOCUMENT_VERDICT_META[row.original.verdict];
                return (
                  <span className={meta.tone === "primary" ? "text-primary" : "text-text"}>{meta.label}</span>
                );
              },
            } satisfies ColumnDef<GroupDocument, unknown>,
          ]
        : []),
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
      {
        id: "actions",
        header: "",
        size: canManage ? 130 : 70,
        enableSorting: false,
        cell: ({ row }) => {
          const doc = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                title="Xem nội dung"
                aria-label={`Xem nội dung ${doc.title}`}
                onClick={() => setPreview(doc)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-navy"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              {canManage && doc.status !== "published" && (
                <button
                  type="button"
                  title="Duyệt tài liệu"
                  aria-label={`Duyệt ${doc.title}`}
                  onClick={() => applyStatus([doc], "published")}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-navy"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
              {canManage && doc.status !== "hidden" && (
                <button
                  type="button"
                  title="Ẩn với thành viên"
                  aria-label={`Ẩn ${doc.title}`}
                  onClick={() => setPending({ kind: "hide", docs: [doc] })}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-navy"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                </button>
              )}
              {canManage && (
                <button
                  type="button"
                  title="Xóa tài liệu"
                  aria-label={`Xóa ${doc.title}`}
                  onClick={() => setPending({ kind: "delete", docs: [doc] })}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-primary"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [canManage],
  );

  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    initialSorting: [{ id: "title", desc: false }],
  });

  const selected = table.getSelectedRowModel().rows.map((r) => r.original);
  const globalFilter = table.getState().globalFilter ?? "";
  const pendingCount = pending?.docs.length ?? 0;

  return (
    <div>
      <TableToolbar
        searchValue={globalFilter}
        onSearchChange={(v) => table.setGlobalFilter(v)}
        searchPlaceholder="Tìm theo tên tài liệu, chủ đề, người tải..."
        selectedCount={selected.length}
        onClearSelection={() => table.resetRowSelection()}
        filters={
          <>
            <Select
              label="Trạng thái"
              shape="box"
              value={status}
              onChange={setStatus}
              options={
                canManage
                  ? [
                      { value: "all", label: "Mọi trạng thái" },
                      { value: "published", label: "Đã duyệt" },
                      { value: "pending", label: "Chờ kiểm duyệt" },
                      { value: "changes", label: "Cần chỉnh sửa" },
                      { value: "rejected", label: "Bị từ chối" },
                      { value: "hidden", label: "Đã ẩn" },
                    ]
                  : [{ value: "all", label: "Mọi trạng thái" }]
              }
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
              <>
                <Button size="sm" variant="outline" onClick={() => applyStatus(selected, "published")}>
                  <Check className="h-3.5 w-3.5" /> Duyệt
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPending({ kind: "hide", docs: selected })}
                >
                  <EyeOff className="h-3.5 w-3.5" /> Ẩn
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-primary"
                  onClick={() => setPending({ kind: "delete", docs: selected })}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Xóa
                </Button>
              </>
            )}
          </>
        }
      />
      <DataTable table={table} emptyMessage="Không có tài liệu nào khớp bộ lọc." />

      <DocumentPreviewModal
        doc={preview}
        onClose={() => setPreview(null)}
        canManage={canManage}
        onApprove={(doc) => {
          applyStatus([doc], "published");
          setPreview(null);
        }}
        onHide={(doc) => {
          setPreview(null);
          setPending({ kind: "hide", docs: [doc] });
        }}
      />

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          if (pending.kind === "delete") removeDocs(pending.docs);
          else applyStatus(pending.docs, "hidden");
          setPending(null);
          table.resetRowSelection();
        }}
        title={pending?.kind === "delete" ? "Xóa tài liệu?" : "Ẩn tài liệu?"}
        tone={pending?.kind === "delete" ? "danger" : "default"}
        confirmLabel={pending?.kind === "delete" ? `Xóa ${pendingCount} tài liệu` : `Ẩn ${pendingCount} tài liệu`}
        message={
          pending?.kind === "delete" ? (
            <>
              <span className="font-semibold text-navy">{pendingCount} tài liệu</span> sẽ bị xóa vĩnh viễn
              khỏi nhóm. Thao tác này không thể hoàn tác.
            </>
          ) : (
            <>
              <span className="font-semibold text-navy">{pendingCount} tài liệu</span> sẽ không còn hiển thị
              với thành viên không có quyền quản lý. Bạn vẫn thấy và có thể bỏ ẩn bất cứ lúc nào.
            </>
          )
        }
      >
        {pendingCount > 0 && (
          <ul className="max-h-32 overflow-y-auto rounded-md bg-bg p-2.5 text-xs text-text-muted">
            {pending?.docs.map((d) => (
              <li key={d.id} className="truncate py-0.5">
                {d.title}
              </li>
            ))}
          </ul>
        )}
      </ConfirmDialog>
    </div>
  );
}
