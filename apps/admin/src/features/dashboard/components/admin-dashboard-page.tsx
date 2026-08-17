"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import { useAdminApi } from "@/features/auth/admin-api";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { MetricStrip } from "@/features/dashboard/components/metric-strip";
import { OperationsOverview } from "@/features/dashboard/components/operations-overview";
import { UserGrowthCard } from "@/features/dashboard/components/user-growth-card";
import { UsersByRoleCard } from "@/features/dashboard/components/users-by-role-card";
import { articlesApi, usersApi, type AuditLogEntry } from "@/lib/api";

interface DashboardData {
  users: { total: number; byRole: Record<string, number> };
  growth: { month: string; newUsers: number; total: number }[];
  articles: Record<string, number>;
  audit: AuditLogEntry[];
}

/**
 * Trang tổng quan, đọc từ API thật.
 *
 * Bản trước dựng hoàn toàn từ `dashboard.mock.ts`: 12.486 người dùng, 184.392 lượt nộp
 * bài, biểu đồ 12 tháng — không con số nào có thật. Một bảng điều khiển hiện số bịa còn
 * tệ hơn một bảng trống, vì người đọc không có cách nào phân biệt.
 *
 * Ba khối cũ đã bỏ hẳn thay vì nối tạm: "Người dùng hoạt động hằng ngày" cần lịch sử theo
 * ngày mà `users.last_active_at` chỉ giữ đúng một mốc; "Lượt chấm bài" và "Hoạt động nền
 * tảng" lấy từ `submissions`, bảng hiện có 0 hàng vì submission-service vẫn là khung rỗng.
 * Có nguồn thật rồi thì dựng lại, không sớm hơn.
 *
 * Bốn lời gọi chạy song song và CÙNG hỏng nếu một cái hỏng — khác với drawer chi tiết tài
 * khoản, ở đây không có gì để đọc từng phần: một trang tổng quan thiếu ba trên bốn số thì
 * không còn là tổng quan.
 */
export function AdminDashboardPage() {
  const request = useAdminApi();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      usersApi.summary(request),
      usersApi.growth(request),
      articlesApi.summary(request),
      usersApi.recentAudit(request),
    ])
      .then(([users, growth, articles, audit]) => {
        if (!cancelled) setData({ users, growth, articles, audit });
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(describe(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [request]);

  if (error !== null) {
    return (
      <p
        className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        role="alert"
      >
        <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {error}
      </p>
    );
  }

  if (data === null) {
    return (
      <p className="flex items-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        Đang tải số liệu…
      </p>
    );
  }

  return (
    <div>
      <div className="hidden xl:block">
        <DashboardHeader />
      </div>
      <div className="xl:mt-6">
        <MetricStrip articles={data.articles} users={data.users} />
      </div>
      <div className="mt-4 grid min-w-0 gap-4 sm:mt-6 xl:grid-cols-[minmax(0,1fr)_410px]">
        <UserGrowthCard growth={data.growth} />
        <UsersByRoleCard byRole={data.users.byRole} total={data.users.total} />
      </div>
      <div className="mt-4 sm:mt-6">
        <OperationsOverview entries={data.audit} />
      </div>
    </div>
  );
}

function describe(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "Không tải được số liệu tổng quan";
}
