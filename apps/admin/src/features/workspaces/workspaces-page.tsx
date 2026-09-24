"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ApiClientError } from "@codementor/api-client";
import { Archive, Network, RotateCcw, UserMinus, Users } from "lucide-react";
import {
  Button,
  DetailMeta,
  DetailRow,
  DetailSection,
  DrawerDetail,
  ManagePage,
  ReasonButton,
  Select,
  StatusBadge,
  useToast,
} from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import { workspacesApi, type AdminWorkspace, type AdminWorkspaceDetail, type AdminWorkspaceSummary } from "@/lib/api";

const STATUS = { active: "Đang hoạt động", archived: "Đã lưu trữ" } as const;
const PRIVACY = { public: "Công khai", private: "Riêng tư" } as const;
const JOIN_POLICY = { open: "Tự do tham gia", approval: "Cần duyệt", invite_only: "Chỉ qua lời mời" } as const;
const ROLE = { owner: "Chủ nhóm", deputy: "Phó nhóm", member: "Thành viên" } as const;
const dateTime = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

export function WorkspacesPage() {
  const request = useAdminApi();
  const toast = useToast();
  const [rows, setRows] = useState<AdminWorkspace[]>([]);
  const [summary, setSummary] = useState<AdminWorkspaceSummary | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [privacy, setPrivacy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Drawer tải chi tiết một lần mỗi lần mount; tăng số này để nó tải lại sau khi gỡ thành viên.
  const [detailVersion, setDetailVersion] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ponytail: 100 nhóm đầu, bảng tự phân trang phía client; thêm phân trang server khi vượt.
      const [page, counts] = await Promise.all([
        workspacesApi.list(request, {
          q: search.trim() || undefined,
          status: status || undefined,
          privacy: privacy || undefined,
          limit: 100,
        }),
        workspacesApi.summary(request),
      ]);
      setRows(page.items);
      setSummary(counts);
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setLoading(false);
    }
  }, [request, search, status, privacy]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 300);
    return () => window.clearTimeout(timer);
  }, [load]);

  const act = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(message);
      setDetailVersion((value) => value + 1);
      await load();
    } catch (cause) {
      toast.error(describe(cause));
    } finally {
      setBusy(false);
    }
  };

  const columns = useMemo<ColumnDef<AdminWorkspace, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nhóm",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.topic ?? row.original.slug}</p>
          </div>
        ),
      },
      {
        id: "owner",
        accessorFn: (row) => row.owner.displayName,
        header: "Chủ nhóm",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm">{row.original.owner.displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.owner.email ?? ""}</p>
          </div>
        ),
      },
      { accessorKey: "memberCount", header: "Thành viên" },
      { accessorKey: "privacy", header: "Quyền riêng tư", cell: ({ row }) => PRIVACY[row.original.privacy] },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => (
          <StatusBadge tone={row.original.status === "active" ? "success" : "neutral"}>
            {STATUS[row.original.status]}
          </StatusBadge>
        ),
      },
      {
        id: "lastActivityAt",
        accessorFn: (row) => row.lastActivityAt ?? row.updatedAt,
        header: "Hoạt động gần nhất",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {dateTime.format(new Date(row.original.lastActivityAt ?? row.original.updatedAt))}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <ManagePage
      activeFilterCount={privacy ? 1 : 0}
      columns={columns}
      description="Mọi nhóm học tập trên nền tảng. Lưu trữ thay vì xoá: nhóm giữ nguyên tài liệu, bài tập và lịch sử để khôi phục được."
      drawer={{
        title: (row) => row.name,
        description: (row) => `${STATUS[row.status]} · ${PRIVACY[row.privacy]} · ${row.memberCount} thành viên`,
        width: "wide",
        body: (row) => (
          <DrawerDetail key={`${row.id}:${detailVersion}`} load={() => workspacesApi.detail(request, row.id)}>
            {(detail) => (
              <WorkspaceDetail
                busy={busy}
                detail={detail}
                onRemoveMember={(memberId, reason) =>
                  act(() => workspacesApi.removeMember(request, row.id, memberId, reason), "Đã gỡ thành viên khỏi nhóm.")
                }
              />
            )}
          </DrawerDetail>
        ),
        footer: (row) =>
          row.status === "active" ? (
            <ReasonButton
              confirmLabel="Lưu trữ"
              description="Nhóm biến khỏi danh sách của mọi thành viên và không ai vào được nữa. Dữ liệu giữ nguyên, khôi phục được bất cứ lúc nào."
              disabled={busy}
              onConfirm={(reason) => act(() => workspacesApi.archive(request, row.id, reason), "Đã lưu trữ nhóm.")}
              placeholder="Vì sao lưu trữ nhóm này?"
              title={`Lưu trữ "${row.name}"?`}
              variant="outline"
            >
              <Archive aria-hidden="true" className="size-4" />
              Lưu trữ
            </ReasonButton>
          ) : (
            <Button
              disabled={busy}
              onClick={() => void act(() => workspacesApi.restore(request, row.id), "Đã khôi phục nhóm.")}
              variant="outline"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              Khôi phục
            </Button>
          ),
      }}
      emptyMessage="Không có nhóm học tập nào khớp bộ lọc."
      error={error}
      exportFilename="nhom-hoc-tap"
      filters={
        <Select
          label="Quyền riêng tư"
          onChange={setPrivacy}
          options={[
            { value: "", label: "Mọi quyền riêng tư" },
            { value: "public", label: PRIVACY.public },
            { value: "private", label: PRIVACY.private },
          ]}
          value={privacy}
        />
      }
      getRowId={(row) => row.id}
      icon={Network}
      loading={loading}
      onClearFilters={() => setPrivacy("")}
      onRefresh={load}
      onSearchChange={setSearch}
      rows={rows}
      search={search}
      searchPlaceholder="Tìm theo tên, slug, chủ đề hoặc chủ nhóm…"
      tabs={{
        value: status,
        onChange: setStatus,
        options: [
          { value: "active", label: STATUS.active, count: summary?.active },
          { value: "archived", label: STATUS.archived, count: summary?.archived },
          { value: "", label: "Tất cả", count: summary?.total },
        ],
      }}
      title="Nhóm học tập"
    />
  );
}

function WorkspaceDetail({
  detail,
  busy,
  onRemoveMember,
}: {
  detail: AdminWorkspaceDetail;
  busy: boolean;
  onRemoveMember: (memberId: string, reason: string) => Promise<unknown>;
}) {
  return (
    <>
      <DetailMeta>
        <DetailRow label="Slug" value={detail.slug} />
        <DetailRow label="Chủ đề" value={detail.topic ?? "—"} />
        <DetailRow label="Chủ nhóm" value={`${detail.owner.displayName}${detail.owner.email ? ` · ${detail.owner.email}` : ""}`} />
        <DetailRow label="Cách tham gia" value={JOIN_POLICY[detail.joinPolicy]} />
        <DetailRow label="Mã mời" value={detail.inviteCode} />
        <DetailRow label="Tạo lúc" value={dateTime.format(new Date(detail.createdAt))} />
      </DetailMeta>

      {detail.description && (
        <DetailSection title="Mô tả">
          <p className="whitespace-pre-line text-sm text-muted-foreground">{detail.description}</p>
        </DetailSection>
      )}

      <DetailSection icon={Users} title={`Thành viên (${detail.members.total})`}>
        {detail.members.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nhóm chưa có thành viên nào đang hoạt động.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {detail.members.items.map((member) => (
              <li className="flex items-center gap-3 px-3 py-2" key={member.id}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.user.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {ROLE[member.role]} · {member.user.email ?? member.user.handle ?? ""} · vào {dateTime.format(new Date(member.joinedAt))}
                  </p>
                </div>
                {member.role !== "owner" && (
                  <ReasonButton
                    aria-label={`Gỡ ${member.user.displayName} khỏi nhóm`}
                    confirmLabel="Gỡ khỏi nhóm"
                    description="Thành viên sẽ nhận thông báo kèm đúng lý do này."
                    disabled={busy}
                    onConfirm={(reason) => onRemoveMember(member.id, reason)}
                    placeholder="Vì sao gỡ thành viên này?"
                    title={`Gỡ ${member.user.displayName} khỏi nhóm?`}
                    variant="ghost"
                  >
                    <UserMinus aria-hidden="true" className="size-4" />
                  </ReasonButton>
                )}
              </li>
            ))}
          </ul>
        )}
        {detail.members.total > detail.members.items.length && (
          <p className="mt-2 text-xs text-muted-foreground">
            Đang hiện {detail.members.items.length}/{detail.members.total} thành viên đầu tiên.
          </p>
        )}
      </DetailSection>
    </>
  );
}

function describe(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "Thao tác thất bại";
}
