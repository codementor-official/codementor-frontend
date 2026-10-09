"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ApiClientError } from "@codementor/api-client";
import {
  CalendarDays,
  Clock,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { DetailMeta, DetailRow, DetailSection, FieldError, fieldA11y, ManagePage, Select, StatusBadge } from "@codementor/ui";
import { search as searchRule } from "@codementor/utils";
import { useAdminApi } from "@/features/auth/admin-api";
import { KpiStrip, useSummary } from "@codementor/ui";
import { auditLogsApi, type AuditLogEntry } from "@/lib/api";

const TARGET = { user: "Người dùng", course: "Khoá học", roadmap: "Lộ trình", exercise: "Bài tập", article: "Bài viết" } as const;
const TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  "user.created": "success",
  "user.activated": "success",
  "user.role_changed": "warning",
  "user.suspended": "danger",
  "content.approve": "success",
  "content.restore": "success",
  "content.request_changes": "warning",
  "content.reject": "danger",
  "content.archive": "danger",
};
const dateTime = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "medium" });

/**
 * Nhật ký kiểm toán — chỉ đọc, đúng như backend. Backend không có tìm kiếm tự do nên ô tìm
 * lọc trên 200 dòng mới nhất đã tải về; bộ lọc đối tượng và mã đối tượng đi xuống server.
 */
export function AuditLogsPage() {
  const request = useAdminApi();
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [targetType, setTargetType] = useState("");
  const [targetId, setTargetId] = useState("");
  // `ListAuditLogsQueryDto.targetId` ≤ 100. Quá trần thì báo lỗi và không gọi API.
  const targetIdError = searchRule(targetId, 100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const summary = useSummary(useCallback(() => auditLogsApi.summary(request), [request]));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ponytail: 200 là trần của backend; thêm phân trang theo cursor khi cần xem xa hơn.
      setRows(
        await auditLogsApi.list(request, {
          targetType: targetType || undefined,
          targetId: targetId.trim() || undefined,
          limit: 200,
        }),
      );
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setLoading(false);
    }
  }, [request, targetType, targetId]);

  useEffect(() => {
    if (targetIdError) return;
    const timer = window.setTimeout(() => void load(), 300);
    return () => window.clearTimeout(timer);
  }, [load, targetIdError]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      [row.summary, row.actorEmail, row.action, row.targetId].some((value) => value.toLowerCase().includes(needle)),
    );
  }, [rows, search]);

  const columns = useMemo<ColumnDef<AuditLogEntry, unknown>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Thời điểm",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">{dateTime.format(new Date(row.original.createdAt))}</span>
        ),
      },
      {
        accessorKey: "summary",
        header: "Hoạt động",
        cell: ({ row }) => (
          <div className="min-w-0">
            <StatusBadge tone={TONE[row.original.action] ?? "neutral"}>{row.original.action}</StatusBadge>
            <p className="mt-1 truncate text-sm">{row.original.summary}</p>
          </div>
        ),
      },
      { accessorKey: "actorEmail", header: "Người thực hiện" },
      {
        accessorKey: "targetType",
        header: "Đối tượng",
        cell: ({ row }) => TARGET[row.original.targetType as keyof typeof TARGET] ?? row.original.targetType,
      },
    ],
    [],
  );

  return (
    <ManagePage
      activeFilterCount={[targetType, targetId].filter(Boolean).length}
      columns={columns}
      drawer={{
        title: (row) => row.summary,
        description: (row) => `${row.action} · ${dateTime.format(new Date(row.createdAt))}`,
        body: (row) => (
          <>
            <DetailMeta>
              <DetailRow label="Người thực hiện" value={row.actorEmail} />
              <DetailRow label="Hành động" value={row.action} />
              <DetailRow label="Loại đối tượng" value={TARGET[row.targetType as keyof typeof TARGET] ?? row.targetType} />
              <DetailRow label="Mã đối tượng" value={row.targetId} />
            </DetailMeta>
            {Object.keys(row.metadata ?? {}).length > 0 && (
              <DetailSection title="Chi tiết">
                <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 text-xs">
                  {JSON.stringify(row.metadata, null, 2)}
                </pre>
              </DetailSection>
            )}
          </>
        ),
      }}
      emptyMessage="Không có dòng nhật ký nào khớp bộ lọc."
      error={error}
      exportFilename="nhat-ky-kiem-toan"
      filters={
        <>
          <Select
            label="Đối tượng"
            onChange={setTargetType}
            options={[{ value: "", label: "Mọi đối tượng" }, ...Object.entries(TARGET).map(([value, label]) => ({ value, label }))]}
            value={targetType}
          />
          <input
            {...fieldA11y("audit-target-id", targetIdError)}
            aria-label="Mã đối tượng"
            className="h-9 rounded-md border border-border bg-card px-2.5 text-xs font-semibold text-foreground focus:border-foreground"
            onChange={(event) => setTargetId(event.target.value)}
            placeholder="Mã đối tượng…"
            value={targetId}
          />
          <FieldError className="w-full text-xs" error={targetIdError} htmlFor="audit-target-id" />
        </>
      }
      getRowId={(row) => row.id}
      icon={ScrollText}
      summary={
        <KpiStrip
          loading={summary.loading}
          metrics={[
            { icon: ScrollText, label: "Tổng nhật ký", value: summary.data?.total ?? null },
            { icon: Clock, label: "24 giờ qua", value: summary.data?.last24h ?? null },
            { icon: CalendarDays, label: "7 ngày qua", value: summary.data?.last7d ?? null },
            { icon: ShieldCheck, label: "Admin thao tác (7 ngày)", value: summary.data?.actors7d ?? null },
          ]}
        />
      }
      loading={loading}
      onClearFilters={() => {
        setTargetType("");
        setTargetId("");
      }}
      onRefresh={() => Promise.all([load(), summary.reload()])}
      onSearchChange={setSearch}
      rows={visible}
      search={search}
      searchPlaceholder="Tìm trong nội dung, người thực hiện, hành động…"
      title="Nhật ký kiểm toán"
    />
  );
}

function describe(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "Không tải được nhật ký";
}
