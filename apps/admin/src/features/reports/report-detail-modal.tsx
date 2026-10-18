"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiClientError } from "@codementor/api-client";
import {
  ExternalLink,
  History,
  Loader2,
  ShieldAlert,
  Undo2,
  UserRound,
} from "lucide-react";
import {
  Button,
  Modal,
  RejectDialogButton,
  StatusBadge,
  useToast,
} from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import {
  reportsApi,
  type AdminReportDetail,
  type ReportAction,
  type ReportStatus,
} from "@/lib/api";
import {
  ACCOUNT_STATUS,
  CATEGORY,
  ROLE,
  STATUS,
  STATUS_TONE,
  SUSPENSION_OPTIONS,
  TARGET,
  reportedContentPath,
} from "./report-labels";

const dateTime = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: typeof History;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        {title}
      </h3>
      {children}
    </section>
  );
}

function actionTitle(action: ReportAction) {
  if (action.action === "USER_SUSPENDED") {
    const until = action.suspendedUntil
      ? `tới ${dateTime.format(new Date(action.suspendedUntil))}`
      : "không thời hạn";
    return `Khoá tài khoản ${action.sanctionedUserName ?? "tác giả"} ${until}`;
  }
  if (action.action === "ROLLED_BACK")
    return action.sanctionedUserId
      ? "Hoàn tác khoá tài khoản"
      : "Hoàn tác đổi trạng thái";
  return `${action.fromStatus ? STATUS[action.fromStatus] : "—"} → ${action.toStatus ? STATUS[action.toStatus] : "—"}`;
}

/**
 * Chi tiết một báo cáo: vì sao bị báo cáo, nội dung nào (mở được ngay), ai là tác giả, và mọi
 * thao tác đã làm — mỗi thao tác hoàn tác được theo luật server trả về (`rollbackBlocker`).
 */
export function ReportDetailModal({
  reportId,
  onClose,
  onChanged,
}: {
  reportId: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const request = useAdminApi();
  const toast = useToast();
  const [detail, setDetail] = useState<AdminReportDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (id: string) => {
      setError(null);
      try {
        setDetail(await reportsApi.detail(request, id));
      } catch (cause) {
        setError(describe(cause));
      }
    },
    [request],
  );

  // Chỉ đặt state trong callback của request — modal được dựng lại theo `key` nên không cần reset.
  useEffect(() => {
    if (!reportId) return;
    let live = true;
    reportsApi.detail(request, reportId).then(
      (next) => live && setDetail(next),
      (cause) => live && setError(describe(cause)),
    );
    return () => {
      live = false;
    };
  }, [request, reportId]);

  // Mỗi thao tác trả về chi tiết mới nhất: hiện ngay, rồi báo danh sách bên ngoài tải lại.
  const run = async (
    work: () => Promise<AdminReportDetail>,
    success: string,
  ) => {
    try {
      setDetail(await work());
      toast.success(success);
      onChanged();
    } catch (cause) {
      toast.error(describe(cause));
    }
  };

  const report = detail;
  const contentPath = report ? reportedContentPath(report) : null;
  const category = report ? CATEGORY[report.category] : null;
  const canSuspend =
    report?.ownerId &&
    report.ownerRole !== "admin" &&
    report.ownerStatus === "active";

  return (
    <Modal
      open={reportId !== null}
      onClose={onClose}
      width="lg"
      title={
        report
          ? (report.targetTitle ??
            report.targetRef ??
            "Nội dung không còn tồn tại")
          : "Chi tiết báo cáo"
      }
      description={
        report
          ? `${TARGET[report.targetType]} · gửi ${dateTime.format(new Date(report.createdAt))}`
          : undefined
      }
      footer={
        report && (
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <StatusBadge tone={STATUS_TONE[report.status]}>
              {STATUS[report.status]}
            </StatusBadge>
            <div className="flex flex-wrap gap-2">
              {canSuspend && (
                <RejectDialogButton
                  variant="outline"
                  title="Tạm khoá tài khoản tác giả"
                  description={`${report.ownerName} bị đăng xuất ngay và không đăng nhập được tới hết thời hạn — hệ thống tự mở khoá khi hết hạn. Có thể hoàn tác sớm trong lịch sử thao tác.`}
                  decisions={SUSPENSION_OPTIONS}
                  placeholder="Lý do khoá, ví dụ: đăng nội dung vi phạm bản quyền lần thứ hai…"
                  onConfirm={(days, note) =>
                    run(
                      () =>
                        reportsApi.suspendOwner(
                          request,
                          report.id,
                          note,
                          days === "none" ? null : Number(days),
                        ),
                      "Đã khoá tài khoản tác giả và đăng xuất mọi phiên của họ.",
                    )
                  }
                >
                  <ShieldAlert className="size-4" /> Khoá tác giả
                </RejectDialogButton>
              )}
              <RejectDialogButton
                variant="default"
                title="Đổi trạng thái xử lý"
                description={
                  canSuspend
                    ? "Kết luận có vi phạm sẽ khoá luôn tác giả theo thời hạn bạn chọn. Lý do hiện cho tác giả ở trang đăng nhập; mỗi bước lưu vào lịch sử và hoàn tác được."
                    : "Ghi rõ kết quả kiểm tra. Lần đổi này được lưu vào lịch sử và hoàn tác được."
                }
                // "RESOLVED:<ngày|none>": kết luận vi phạm kèm mức khoá tác giả, khi khoá được.
                decisions={(Object.keys(STATUS) as ReportStatus[])
                  .filter((s) => s !== report.status)
                  .flatMap((value) =>
                    value === "RESOLVED" && canSuspend
                      ? SUSPENSION_OPTIONS.map((option) => ({
                          value: `RESOLVED:${option.value}`,
                          label: `${STATUS.RESOLVED} · ${option.label.replace(/^Khoá /, "khoá tác giả ")}`,
                        }))
                      : [{ value, label: STATUS[value] }],
                  )}
                placeholder="Kết quả kiểm tra và hành động đã thực hiện…"
                onConfirm={(decision, note) => {
                  const [status, days] = decision.split(":");
                  return run(
                    () =>
                      reportsApi.changeStatus(
                        request,
                        report.id,
                        status as ReportStatus,
                        note,
                        days && days !== "none" ? Number(days) : null,
                      ),
                    days ? "Đã kết luận vi phạm và khoá tác giả." : "Đã cập nhật trạng thái báo cáo.",
                  );
                }}
              >
                Đổi trạng thái
              </RejectDialogButton>
            </div>
          </div>
        )
      }
    >
      {error ? (
        <div className="space-y-3 text-sm">
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            onClick={() => reportId && void load(reportId)}
          >
            Thử lại
          </Button>
        </div>
      ) : !report || !category ? (
        <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Đang tải chi tiết báo cáo…
        </p>
      ) : (
        <div className="space-y-4 text-sm">
          <Section title="Lý do báo cáo">
            <p className="font-semibold">{category.label}</p>
            <p className="mt-1 text-muted-foreground">{category.meaning}</p>
            <blockquote className="mt-3 rounded-md bg-muted px-3 py-2 whitespace-pre-wrap">
              {report.note || (
                <span className="text-muted-foreground">
                  Người báo cáo không viết thêm mô tả.
                </span>
              )}
            </blockquote>
            <p className="mt-3 text-muted-foreground">
              Gửi bởi{" "}
              <span className="font-medium text-foreground">
                {report.reporterName}
              </span>{" "}
              ({report.reporterEmail}) · lần gửi gần nhất{" "}
              {dateTime.format(new Date(report.submittedAt))}
            </p>
            {report.sameTargetCount > 1 && (
              <p className="mt-2 font-medium text-warning">
                Nội dung này có {report.sameTargetCount} báo cáo từ các tài
                khoản khác nhau.
              </p>
            )}
          </Section>

          <Section title="Nội dung bị báo cáo">
            <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[8rem_1fr]">
              <dt className="text-muted-foreground">Loại</dt>
              <dd>
                {TARGET[report.targetType]}
                {report.targetParentName &&
                  ` · trong nhóm ${report.targetParentName}`}
              </dd>
              <dt className="text-muted-foreground">Trạng thái</dt>
              <dd>{report.targetStatus ?? "Không còn tồn tại"}</dd>
              <dt className="text-muted-foreground">Mã</dt>
              <dd className="font-mono text-xs break-all">{report.targetId}</dd>
            </dl>
            {contentPath && (
              // POST sang tab mới: admin vào client đã đăng nhập sẵn bằng chính tài khoản này ("super login").
              <form method="post" action="/api/auth/client-handoff" target="_blank" className="mt-3">
                <input type="hidden" name="path" value={contentPath} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  Mở nội dung để kiểm tra <ExternalLink className="size-4" />
                </button>
              </form>
            )}
          </Section>

          <Section title="Tác giả" icon={UserRound}>
            {report.ownerId ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{report.ownerName}</p>
                  <p className="text-muted-foreground">
                    {report.ownerEmail} ·{" "}
                    {ROLE[report.ownerRole ?? ""] ?? report.ownerRole} ·{" "}
                    {ACCOUNT_STATUS[report.ownerStatus ?? ""] ??
                      report.ownerStatus}
                  </p>
                </div>
                <a
                  href={`/users?q=${encodeURIComponent(report.ownerEmail ?? "")}&user=${report.ownerId}`}
                  className="font-medium text-primary hover:underline"
                >
                  Xem tài khoản
                </a>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Không xác định được tác giả (nội dung đã xoá hoặc không gắn
                người tạo).
              </p>
            )}
          </Section>

          <Section title="Lịch sử thao tác" icon={History}>
            {report.resolutionNote && (
              <p className="mb-3">
                <span className="text-muted-foreground">
                  Kết luận hiện tại:{" "}
                </span>
                {report.resolutionNote}
              </p>
            )}
            {report.actions.length === 0 ? (
              <p className="text-muted-foreground">Chưa có thao tác nào.</p>
            ) : (
              <ol className="space-y-3">
                {report.actions.map((action) => (
                  <li
                    key={action.id}
                    className="flex flex-wrap items-start justify-between gap-3 border-t border-border pt-3 first:border-t-0 first:pt-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-medium ${action.revertedAt ? "text-muted-foreground line-through" : ""}`}
                      >
                        {actionTitle(action)}
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap">
                        {action.note}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {action.actorEmail} ·{" "}
                        {dateTime.format(new Date(action.createdAt))}
                        {action.revertedAt &&
                          ` · đã hoàn tác ${dateTime.format(new Date(action.revertedAt))}`}
                      </p>
                    </div>
                    {!action.rollbackBlocker && (
                      <RejectDialogButton
                        variant="outline"
                        size="sm"
                        title="Hoàn tác thao tác"
                        description={
                          action.action === "USER_SUSPENDED"
                            ? "Tài khoản sẽ được mở khoá."
                            : `Báo cáo trở về trạng thái “${action.fromStatus ? STATUS[action.fromStatus] : ""}” với kết luận trước đó.`
                        }
                        decisions={[
                          { value: "rollback", label: actionTitle(action) },
                        ]}
                        placeholder="Vì sao hoàn tác, ví dụ: bấm nhầm báo cáo…"
                        onConfirm={(_, note) =>
                          run(
                            () =>
                              reportsApi.rollback(
                                request,
                                report.id,
                                action.id,
                                note,
                              ),
                            "Đã hoàn tác thao tác.",
                          )
                        }
                      >
                        <Undo2 className="size-4" /> Hoàn tác
                      </RejectDialogButton>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Section>
        </div>
      )}
    </Modal>
  );
}

function describe(error: unknown) {
  if (error instanceof ApiClientError) return error.message;
  return error instanceof Error
    ? error.message
    : "Không tải được chi tiết báo cáo.";
}
