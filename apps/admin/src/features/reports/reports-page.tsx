"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ApiClientError } from "@codementor/api-client";
import { Flag } from "lucide-react";
import { ManagePage, Select, StatusBadge, useUrlState } from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import {
  reportsApi,
  type AdminContentReport,
  type ReportCategory,
  type ReportStatus,
  type ReportTargetType,
} from "@/lib/api";

import { ReportDetailModal } from "./report-detail-modal";
import { CATEGORY, STATUS, STATUS_TONE, TARGET } from "./report-labels";
const dateTime = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

export function ReportsPage() {
  const request = useAdminApi();
  const [openId, setOpenId] = useUrlState("report", "");
  const [rows, setRows] = useState<AdminContentReport[]>([]);
  const [search, setSearch] = useUrlState("q", "");
  const [status, setStatus] = useUrlState<ReportStatus | "">(
    "status",
    "PENDING",
  );
  const [targetType, setTargetType] = useUrlState<ReportTargetType | "">(
    "target",
    "",
  );
  const [category, setCategory] = useUrlState<ReportCategory | "">(
    "category",
    "",
  );
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
        // ponytail: trần 50 của `ListAdminReportsQueryDto`, chỉ đọc trang đầu. Thêm phân
        // trang server khi hàng chờ thật sự vượt 50 báo cáo.
        limit: 50,
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

  const columns = useMemo<ColumnDef<AdminContentReport, unknown>[]>(
    () => [
      {
        accessorKey: "targetTitle",
        header: "Nội dung",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">
              {row.original.targetTitle ??
                row.original.targetRef ??
                "Nội dung không còn tồn tại"}
            </p>
            <p className="text-xs text-muted-foreground">
              {TARGET[row.original.targetType]}
              {row.original.ownerName && ` · ${row.original.ownerName}`}
            </p>
          </div>
        ),
        meta: {
          exportValue: (row) =>
            `${row.targetTitle ?? row.targetRef ?? row.targetId} (${TARGET[row.targetType] ?? row.targetType})`,
        },
      },
      {
        accessorKey: "category",
        header: "Lý do",
        cell: ({ row }) => (
          <div>
            <p>{CATEGORY[row.original.category]?.label}</p>
            {row.original.note && (
              <p className="max-w-60 truncate text-xs text-muted-foreground">
                {row.original.note}
              </p>
            )}
          </div>
        ),
        meta: {
          exportValue: (row) => CATEGORY[row.category]?.label ?? row.category,
        },
      },
      {
        accessorKey: "sameTargetCount",
        header: "Số báo cáo",
        cell: ({ row }) => row.original.sameTargetCount,
      },
      {
        accessorKey: "reporterName",
        header: "Người báo cáo",
        cell: ({ row }) => (
          <div>
            <p>{row.original.reporterName}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.reporterEmail}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => (
          <StatusBadge tone={STATUS_TONE[row.original.status]}>
            {STATUS[row.original.status]}
          </StatusBadge>
        ),
        meta: { exportValue: (row) => STATUS[row.status] ?? row.status },
      },
      {
        accessorKey: "createdAt",
        header: "Gửi lúc",
        cell: ({ row }) => dateTime.format(new Date(row.original.createdAt)),
      },
    ],
    [],
  );

  return (
    <>
      <ManagePage
        title="Báo cáo vi phạm"
        icon={Flag}
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm nội dung, ghi chú hoặc người báo cáo..."
        filters={
          <>
            <Select
              label="Trạng thái"
              value={status}
              onChange={(value) => setStatus(value as ReportStatus | "")}
              options={[
                { value: "", label: "Tất cả" },
                ...Object.entries(STATUS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
            <Select
              label="Loại nội dung"
              value={targetType}
              onChange={(value) =>
                setTargetType(value as ReportTargetType | "")
              }
              options={[
                { value: "", label: "Tất cả" },
                ...Object.entries(TARGET).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
            <Select
              label="Lý do"
              value={category}
              onChange={(value) => setCategory(value as ReportCategory | "")}
              options={[
                { value: "", label: "Tất cả" },
                ...Object.entries(CATEGORY).map(([value, { label }]) => ({
                  value,
                  label,
                })),
              ]}
            />
          </>
        }
        activeFilterCount={
          [status, targetType, category].filter(Boolean).length
        }
        onClearFilters={() => {
          setStatus("");
          setTargetType("");
          setCategory("");
        }}
        emptyMessage="Không có báo cáo phù hợp."
        loading={loading}
        error={error}
        onRefresh={load}
        // Modal thay cho drawer: đủ chỗ cho lý do, nội dung, tác giả và lịch sử thao tác cùng lúc.
        onRowOpen={(row) => setOpenId(row.id)}
      />
      <ReportDetailModal
        // key: mở báo cáo khác là dựng modal mới, không mang chi tiết của báo cáo trước sang.
        key={openId}
        reportId={openId || null}
        onClose={() => setOpenId("")}
        onChanged={() => void load()}
      />
    </>
  );
}

function describe(error: unknown) {
  if (error instanceof ApiClientError) return error.message;
  return error instanceof Error
    ? error.message
    : "Không tải được hàng chờ báo cáo.";
}
