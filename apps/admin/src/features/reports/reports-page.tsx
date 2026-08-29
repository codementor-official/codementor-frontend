"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ApiClientError } from "@codementor/api-client";
import { Flag } from "lucide-react";
import { ManagePage, RejectDialogButton, Select, StatusBadge, useToast } from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import {
  reportsApi,
  type AdminContentReport,
  type ReportCategory,
  type ReportStatus,
  type ReportTargetType,
} from "@/lib/api";

const STATUS = { PENDING: "Chờ xử lý", RESOLVED: "Đã xử lý", REJECTED: "Bỏ qua" } as const;
const CATEGORY = { SPAM: "Spam", MISLEADING: "Sai lệch", INAPPROPRIATE: "Không phù hợp", COPYRIGHT: "Bản quyền", OTHER: "Khác" } as const;
const TARGET = { DOCUMENT: "Tài liệu", POST: "Bài viết", COURSE: "Khóa học", ROADMAP: "Lộ trình", EXERCISE: "Bài tập", WORKSPACE: "Nhóm học tập" } as const;
const dateTime = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

export function ReportsPage() {
  const request = useAdminApi();
  const toast = useToast();
  const [rows, setRows] = useState<AdminContentReport[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReportStatus | "">("PENDING");
  const [targetType, setTargetType] = useState<ReportTargetType | "">("");
  const [category, setCategory] = useState<ReportCategory | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await reportsApi.list(request, {
        q: search.trim() || undefined,
        status: status || undefined,
        targetType: targetType || undefined,
        category: category || undefined,
        page: 1,
        limit: 100,
      });
      setRows(page.items);
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setLoading(false);
    }
  }, [category, request, search, status, targetType]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 300);
    return () => window.clearTimeout(timer);
  }, [load]);

  const resolve = async (row: AdminContentReport, next: "RESOLVED" | "REJECTED", note: string) => {
    await reportsApi.resolve(request, row.id, next, note);
    toast.success(next === "RESOLVED" ? "Đã đánh dấu báo cáo là đã xử lý." : "Đã đóng báo cáo không vi phạm.");
    await load();
  };

  const columns = useMemo<ColumnDef<AdminContentReport, unknown>[]>(() => [
    { accessorKey: "targetRef", header: "Nội dung", cell: ({ row }) => <div className="min-w-0"><p className="truncate font-medium">{row.original.targetRef ?? row.original.targetId}</p><p className="text-xs text-muted-foreground">{TARGET[row.original.targetType]}</p></div> },
    { accessorKey: "category", header: "Lý do", cell: ({ row }) => CATEGORY[row.original.category] },
    { accessorKey: "reporterName", header: "Người báo cáo", cell: ({ row }) => <div><p>{row.original.reporterName}</p><p className="text-xs text-muted-foreground">{row.original.reporterEmail}</p></div> },
    { accessorKey: "status", header: "Trạng thái", cell: ({ row }) => <StatusBadge tone={row.original.status === "PENDING" ? "warning" : row.original.status === "RESOLVED" ? "success" : "neutral"}>{STATUS[row.original.status]}</StatusBadge> },
    { accessorKey: "createdAt", header: "Gửi lúc", cell: ({ row }) => dateTime.format(new Date(row.original.createdAt)) },
  ], []);

  return <ManagePage
    title="Báo cáo vi phạm"
    description="Phân loại, kiểm tra và kết luận các báo cáo do người dùng gửi."
    icon={Flag}
    rows={rows}
    columns={columns}
    getRowId={(row) => row.id}
    search={search}
    onSearchChange={setSearch}
    searchPlaceholder="Tìm nội dung, ghi chú hoặc người báo cáo..."
    filters={<><Select label="Trạng thái" value={status} onChange={(value) => setStatus(value as ReportStatus | "")} options={[{ value: "", label: "Tất cả" }, ...Object.entries(STATUS).map(([value, label]) => ({ value, label }))]} /><Select label="Loại nội dung" value={targetType} onChange={(value) => setTargetType(value as ReportTargetType | "")} options={[{ value: "", label: "Tất cả" }, ...Object.entries(TARGET).map(([value, label]) => ({ value, label }))]} /><Select label="Lý do" value={category} onChange={(value) => setCategory(value as ReportCategory | "")} options={[{ value: "", label: "Tất cả" }, ...Object.entries(CATEGORY).map(([value, label]) => ({ value, label }))]} /></>}
    activeFilterCount={[status, targetType, category].filter(Boolean).length}
    onClearFilters={() => { setStatus(""); setTargetType(""); setCategory(""); }}
    emptyMessage="Không có báo cáo phù hợp."
    loading={loading}
    error={error}
    onRefresh={load}
    drawer={{
      title: (row) => row.targetRef ?? row.targetId,
      description: (row) => `${TARGET[row.targetType]} · ${CATEGORY[row.category]}`,
      body: (row) => <div className="space-y-5 text-sm"><section><p className="text-xs font-medium text-muted-foreground">Người báo cáo</p><p className="mt-1 font-medium">{row.reporterName}</p><p className="text-muted-foreground">{row.reporterEmail}</p></section><section><p className="text-xs font-medium text-muted-foreground">Ghi chú</p><p className="mt-1 whitespace-pre-wrap">{row.note || "Không có ghi chú."}</p></section><section><p className="text-xs font-medium text-muted-foreground">Mã nội dung</p><p className="mt-1 break-all font-mono text-xs">{row.targetId}</p></section>{row.resolutionNote && <section><p className="text-xs font-medium text-muted-foreground">Kết luận</p><p className="mt-1 whitespace-pre-wrap">{row.resolutionNote}</p></section>}</div>,
      footer: (row) => row.status === "PENDING" ? <RejectDialogButton title="Kết luận báo cáo" description="Ghi rõ kết quả kiểm tra để lưu lại lịch sử xử lý." decisions={[{ value: "RESOLVED", label: "Đã xử lý vi phạm" }, { value: "REJECTED", label: "Không có vi phạm" }]} placeholder="Kết quả kiểm tra và hành động đã thực hiện..." onConfirm={(decision, reason) => resolve(row, decision as "RESOLVED" | "REJECTED", reason)}>Kết luận</RejectDialogButton> : null,
      width: "wide",
    }}
  />;
}

function describe(error: unknown) {
  if (error instanceof ApiClientError) return error.message;
  return error instanceof Error ? error.message : "Không tải được hàng chờ báo cáo.";
}
