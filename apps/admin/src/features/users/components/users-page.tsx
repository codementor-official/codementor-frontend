"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ApiClientError } from "@codementor/api-client";
import { Users } from "lucide-react";
import { ManagePage, Select, StatusBadge } from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import { UserDetailDrawer } from "@/features/users/components/user-detail-drawer";
import { usersApi, type AdminUser } from "@/lib/api";

const ROLE_LABELS: Record<string, string> = {
  learner: "Học viên",
  lecturer: "Giảng viên",
  admin: "Quản trị",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Đang hoạt động",
  suspended: "Tạm khoá",
  deleted: "Đã xoá",
};

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" });
const dateTimeFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

/**
 * Danh sách tài khoản, đọc từ `GET /api/v1/users` — bảng `users` thật, không phải mock.
 *
 * Tìm kiếm và lọc chạy Ở SERVER chứ không lọc mảng đã tải: danh sách này sẽ dài ra theo
 * số người dùng thật, và lọc phía client chỉ đúng khi toàn bộ dữ liệu đã nằm trong trang
 * đầu tiên — tức là đúng cho tới lúc nó âm thầm sai.
 */
export function UsersPage() {
  const request = useAdminApi();
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextCursor?: string) => {
      setLoading(true);
      setError(null);
      try {
        const page = await usersApi.list(request, {
          q: search.trim() || undefined,
          role: role || undefined,
          status: status || undefined,
          cursor: nextCursor,
          limit: 25,
        });
        // Cursor có nghĩa là "xem thêm", nên nối vào; không có thì đây là lần lọc mới.
        setRows((current) => (nextCursor ? [...current, ...page.items] : page.items));
        setCursor(page.nextCursor);
      } catch (cause) {
        setError(describe(cause));
      } finally {
        setLoading(false);
      }
    },
    [request, search, role, status],
  );

  useEffect(() => {
    // Hoãn một nhịp để gõ tìm kiếm không bắn một request mỗi ký tự.
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    void usersApi
      .summary(request)
      .then((data) => setTotal(data.total))
      .catch(() => setTotal(null));
  }, [request]);

  const columns = useMemo<ColumnDef<AdminUser, unknown>[]>(
    () => [
      {
        accessorKey: "displayName",
        header: "Người dùng",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      // Ô "Người dùng" hiện hai dòng, nhưng file xuất chỉ đọc được một giá trị mỗi cột.
      // Email vì thế là cột riêng, ẩn khỏi bảng (xem `columnVisibility`) và chỉ xuất hiện
      // trong CSV — nơi nó là thứ đầu tiên người ta cần.
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "role",
        header: "Vai trò",
        cell: ({ row }) => ROLE_LABELS[row.original.role] ?? row.original.role,
        meta: { exportValue: (row) => ROLE_LABELS[row.role] ?? row.role },
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => (
          <StatusBadge tone={row.original.status === "active" ? "success" : "warning"}>
            {STATUS_LABELS[row.original.status] ?? row.original.status}
          </StatusBadge>
        ),
        meta: { exportValue: (row) => STATUS_LABELS[row.status] ?? row.status },
      },
      {
        accessorKey: "lastActiveAt",
        header: "Hoạt động cuối",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.lastActiveAt ? dateTimeFormat.format(new Date(row.original.lastActiveAt)) : "—"}
          </span>
        ),
        meta: {
          exportValue: (row) =>
            row.lastActiveAt ? dateTimeFormat.format(new Date(row.lastActiveAt)) : "",
        },
      },
      {
        accessorKey: "createdAt",
        header: "Ngày tạo",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {dateFormat.format(new Date(row.original.createdAt))}
          </span>
        ),
        meta: { exportValue: (row) => dateFormat.format(new Date(row.createdAt)) },
      },
    ],
    [],
  );

  const activeFilterCount = (role ? 1 : 0) + (status ? 1 : 0);

  return (
    <ManagePage
      activeFilterCount={activeFilterCount}
      columnVisibility={{ email: false }}
      columns={columns}
      description={
        total === null
          ? "Tài khoản đã đồng bộ từ Keycloak sang CodeMentor."
          : `${total} tài khoản. Danh tính và mật khẩu do Keycloak giữ; đây là hồ sơ tương ứng trong CodeMentor.`
      }
      drawer={{
        title: (row) => row.displayName,
        description: (row) => row.email,
        width: "wide",
        // `key` theo id: drawer giữ trạng thái tab và dữ liệu đã nạp bên trong, nên mở
        // sang tài khoản khác phải dựng lại từ đầu chứ không tái dùng dữ liệu người trước.
        body: (row) => <UserDetailDrawer key={row.id} user={row} />,
      }}
      emptyMessage="Không có tài khoản nào khớp bộ lọc."
      error={error}
      filters={
        <>
          <Select
            label="Vai trò"
            onChange={(value) => setRole(value)}
            options={[
              { value: "", label: "Tất cả" },
              { value: "learner", label: "Học viên" },
              { value: "lecturer", label: "Giảng viên" },
              { value: "admin", label: "Quản trị" },
            ]}
            value={role}
          />
          <Select
            label="Trạng thái"
            onChange={(value) => setStatus(value)}
            options={[
              { value: "", label: "Tất cả" },
              { value: "active", label: "Đang hoạt động" },
              { value: "suspended", label: "Tạm khoá" },
            ]}
            value={status}
          />
        </>
      }
      getRowId={(row) => row.id}
      loading={loading}
      onClearFilters={() => {
        setRole("");
        setStatus("");
      }}
      onSearchChange={setSearch}
      rows={rows}
      search={search}
      searchPlaceholder="Tìm theo tên, email hoặc handle…"
      icon={Users}
      title="Người dùng"
    />
  );
}

function describe(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "Không tải được danh sách";
}
