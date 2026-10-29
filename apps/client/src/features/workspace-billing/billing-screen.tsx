"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CalendarClock, CreditCard, Receipt, ShieldCheck, Sparkles } from "lucide-react";
import { apiErrorMessage } from "@codementor/api-client";
import { ServerPagination, useToast } from "@codementor/ui";
import { formatBytes, formatLimit, formatVnDate, formatVnd } from "@codementor/utils";
import type { BillingPage, SubscriptionOverview, WorkspaceOrder, WorkspacePlanUsage } from "@codementor/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { billingApi } from "./api";
import { CYCLE_LABEL, STATE_LABEL, limitRows } from "./plan-presentation";
import { UsageMeter } from "./usage-meter";

export function BillingScreen() {
  const toast = useToast();
  const [overview, setOverview] = useState<SubscriptionOverview | null>(null);
  const [usage, setUsage] = useState<WorkspacePlanUsage | null>(null);
  const [orders, setOrders] = useState<BillingPage<WorkspaceOrder> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(
    () =>
      Promise.all([billingApi.subscription(), billingApi.usage()])
        .then(([o, u]) => {
          setError("");
          setOverview(o);
          setUsage(u);
        })
        .catch((e) => setError(apiErrorMessage(e))),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    billingApi.orders(page).then(setOrders).catch(() => setOrders({ items: [], total: 0, page, limit: 20 }));
  }, [page]);

  async function cancelRenewal() {
    try {
      const r = await billingApi.cancelRenewal();
      toast.success(`Đã huỷ gia hạn. Quyền lợi giữ đến ${formatVnDate(r.benefitsEndAt)}.`);
      setConfirmCancel(false);
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }
  async function resumeRenewal() {
    try {
      await billingApi.resumeRenewal();
      toast.success("Đã bật lại gia hạn.");
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  const sub = overview?.subscription ?? null;
  const renewHref = sub ? `/workspace/billing/checkout?plan=${sub.planId}&cycle=${sub.billingCycle}` : "/workspace/pricing";

  return (
    <>
      <PageHeader
        icon={CreditCard}
        title="Gói & thanh toán Workspace"
        subtitle="Gói hiện tại, hạn mức đang dùng và lịch sử thanh toán của các nhóm bạn sở hữu."
        actions={
          <Button href="/workspace/pricing" size="sm">
            <Sparkles className="h-4 w-4" /> Xem bảng giá
          </Button>
        }
      />

      {error && (
        <Card className="mb-4 p-4 text-sm text-danger" role="alert">
          {error}{" "}
          <button type="button" className="font-semibold underline" onClick={load}>
            Thử lại
          </button>
        </Card>
      )}

      {overview && usage && <Notices overview={overview} usage={usage} renewHref={renewHref} />}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="p-5 xl:col-span-2">
          {!overview ? (
            <SkeletonLines rows={6} />
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-text-muted">Gói hiện tại</p>
                  <h2 className="mt-1 text-2xl font-bold text-navy">{overview.plan.name}</h2>
                </div>
                <Badge tone={STATE_LABEL[overview.state].tone}>{STATE_LABEL[overview.state].label}</Badge>
              </div>
              {sub ? (
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <Item label="Giá theo hợp đồng" value={`${formatVnd(sub.priceVnd)} / ${CYCLE_LABEL[sub.billingCycle]}`} />
                  <Item label="Bắt đầu" value={formatVnDate(sub.startedAt)} />
                  <Item label="Kỳ hiện tại" value={sub.currentPeriod ? `${formatVnDate(sub.currentPeriod.startsAt)} – ${formatVnDate(sub.currentPeriod.endsAt)}` : "—"} />
                  <Item label="Đã thanh toán đến" value={sub.paidThrough ? formatVnDate(sub.paidThrough) : "—"} />
                  <Item label="Gia hạn" value={sub.cancelAtPeriodEnd ? "Đã tắt" : "Thủ công, có nhắc trước"} />
                  <Item label="Điều khoản" value={sub.termsVersion} />
                </dl>
              ) : (
                <p className="mt-3 text-sm text-text-muted">
                  Gói Free luôn sẵn có cho mọi tài khoản. Nâng cấp khi bạn cần thêm nhóm, thành viên hoặc dung lượng.
                </p>
              )}
              {sub?.scheduledChange && (
                <p className="mt-4 flex items-start gap-2 rounded-md bg-border-soft p-3 text-sm text-text">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  Đã lên lịch chuyển sang {sub.scheduledChange.planName ?? "gói mới"}
                  {sub.scheduledChange.billingCycle ? ` (theo ${CYCLE_LABEL[sub.scheduledChange.billingCycle]})` : ""} khi kỳ này kết
                  thúc. Bạn sẽ thanh toán gói mới vào lúc đó.
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                {sub?.renewable && !sub.hasQueuedTerm && (
                  <Button href={renewHref} size="sm">
                    Gia hạn {CYCLE_LABEL[sub.billingCycle]} tiếp theo
                  </Button>
                )}
                <Button href="/workspace/pricing" variant="outline" size="sm">
                  {sub ? "Đổi gói" : "Nâng cấp"}
                </Button>
                {overview.state === "ACTIVE" && (
                  <Button variant="ghost" size="sm" onClick={() => setConfirmCancel(true)}>
                    Huỷ gia hạn
                  </Button>
                )}
                {overview.state === "CANCEL_SCHEDULED" && (
                  <Button variant="ghost" size="sm" onClick={resumeRenewal}>
                    Bật lại gia hạn
                  </Button>
                )}
              </div>
              {sub && (
                <div className="mt-5 border-t border-border-soft pt-4">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-navy">
                    <ShieldCheck className="h-4 w-4 text-success" aria-hidden /> Quyền lợi được bảo vệ
                  </p>
                  <ul className="mt-2 grid grid-cols-1 gap-1.5 text-sm text-text sm:grid-cols-2">
                    {limitRows(sub.protectedEntitlements).map((r) => (
                      <li key={r.key}>
                        <span className="text-text-muted">{r.label}:</span> <span className="font-medium">{r.value}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-text-muted">
                    Giữ nguyên khi bạn gia hạn liên tục, kể cả khi bảng giá thay đổi.
                  </p>
                </div>
              )}
            </>
          )}
        </Card>

        <Card className="p-5 xl:col-span-3">
          <h2 className="font-semibold text-navy">Hạn mức đang dùng</h2>
          {!usage ? (
            <SkeletonLines rows={5} />
          ) : (
            <div className="mt-4 space-y-5">
              <UsageMeter
                label="Nhóm sở hữu"
                used={usage.usage.ownedGroups}
                limit={usage.entitlements.maxOwnedGroups}
                level={usage.levels.groups}
                display={`${usage.usage.ownedGroups} / ${formatLimit(usage.entitlements.maxOwnedGroups)} nhóm`}
              />
              <UsageMeter
                label="Dung lượng tài liệu"
                used={usage.usage.totalBytes}
                limit={usage.entitlements.maxStorageBytes}
                level={usage.levels.storage}
                display={`${formatBytes(usage.usage.totalBytes)} / ${formatBytes(usage.entitlements.maxStorageBytes)}`}
              />
              <div>
                <p className="text-sm font-medium text-text">
                  Thành viên theo nhóm{" "}
                  <span className="font-normal text-text-muted">
                    (tối đa {usage.entitlements.maxMembersPerGroup === null ? "không giới hạn" : `${usage.entitlements.maxMembersPerGroup} người`} mỗi nhóm)
                  </span>
                </p>
                {usage.groups.length === 0 ? (
                  <p className="mt-2 text-sm text-text-muted">
                    Bạn chưa sở hữu nhóm nào. <Link href="/workspace" className="font-semibold text-primary">Tạo nhóm đầu tiên</Link>
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {usage.groups.map((g) => (
                      <li key={g.id}>
                        <UsageMeter
                          label={g.status === "archived" ? `${g.name} (đã lưu trữ)` : g.name}
                          used={g.memberCount}
                          limit={usage.entitlements.maxMembersPerGroup}
                          level={g.memberLevel}
                          display={`${g.memberCount} / ${formatLimit(usage.entitlements.maxMembersPerGroup)} · ${formatBytes(g.storedBytes)}`}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Receipt className="h-4 w-4 text-text-muted" aria-hidden />
          <h2 className="font-semibold text-navy">Lịch sử thanh toán</h2>
        </div>
        {!orders ? (
          <div className="p-5">
            <SkeletonLines rows={3} />
          </div>
        ) : orders.items.length === 0 ? (
          <p className="px-5 py-6 text-sm text-text-muted">Chưa có giao dịch nào.</p>
        ) : (
          <>
            <ul className="divide-y divide-border-soft">
              {orders.items.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/workspace/billing/checkout/result?order=${o.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm transition-colors duration-150 hover:bg-bg"
                  >
                    <span className="w-36 text-text-muted">{formatVnDate(o.createdAt, true)}</span>
                    <span className="min-w-0 flex-1 font-medium text-navy">
                      {KIND[o.kind]} {o.planName} · theo {CYCLE_LABEL[o.billingCycle]}
                    </span>
                    <span className="font-semibold text-navy">{formatVnd(o.amountVnd)}</span>
                    <OrderStatus status={o.status} />
                    <ArrowUpRight className="h-4 w-4 text-text-faint" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-border-soft px-5 py-3">
              <ServerPagination page={orders.page} total={orders.total} pageSize={orders.limit} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={cancelRenewal}
        title="Huỷ gia hạn gói?"
        confirmLabel="Huỷ gia hạn"
        message={
          <>
            Bạn vẫn dùng {overview?.plan.name} đến <strong>{sub?.paidThrough ? formatVnDate(sub.paidThrough) : "hết kỳ"}</strong>.
            Sau đó tài khoản về gói Free ngay, không có thời gian ân hạn. Không có khoản hoàn tiền tự động; dữ liệu vẫn được
            giữ nguyên.
          </>
        }
      />
    </>
  );
}

const KIND: Record<WorkspaceOrder["kind"], string> = { new: "Mua", renewal: "Gia hạn", upgrade: "Nâng cấp" };

const ORDER_STATUS: Record<WorkspaceOrder["status"], { label: string; tone: "success" | "neutral" | "primary" | "danger" }> = {
  pending: { label: "Chờ thanh toán", tone: "primary" },
  paid: { label: "Đã thanh toán", tone: "success" },
  failed: { label: "Thất bại", tone: "danger" },
  cancelled: { label: "Đã huỷ", tone: "neutral" },
  expired: { label: "Hết hạn", tone: "neutral" },
  review: { label: "Đang kiểm tra", tone: "primary" },
  refunded: { label: "Đã hoàn tiền", tone: "neutral" },
};

export function OrderStatus({ status }: { status: WorkspaceOrder["status"] }) {
  return <Badge tone={ORDER_STATUS[status].tone}>{ORDER_STATUS[status].label}</Badge>;
}

/** Record state that stays true while the page is open: shown in place, never as a toast. */
function Notices({ overview, usage, renewHref }: { overview: SubscriptionOverview; usage: WorkspacePlanUsage; renewHref: string }) {
  const notices: { key: string; text: React.ReactNode; action?: { href: string; label: string } }[] = [];
  const sub = overview.subscription;
  if (overview.state === "SUSPENDED")
    notices.push({ key: "suspended", text: `Gói đang bị tạm ngưng${sub?.suspendedReason ? `: ${sub.suspendedReason}` : ""}. Hạn mức Free đang được áp dụng; liên hệ codementor.official@gmail.com.` });
  if (overview.state === "GRACE_PERIOD" && sub?.graceEndsAt)
    notices.push({
      key: "grace",
      text: `Kỳ thanh toán đã kết thúc. Hạn mức ${sub.planName} được giữ đến ${formatVnDate(sub.graceEndsAt)}; sau đó tài khoản về gói Free.`,
      action: { href: renewHref, label: "Gia hạn ngay" },
    });
  if (overview.pendingOrder)
    notices.push({
      key: "pending",
      text: `Bạn có giao dịch ${formatVnd(overview.pendingOrder.amountVnd)} chưa hoàn tất, hết hạn lúc ${formatVnDate(overview.pendingOrder.expiresAt, true)}.`,
      action: { href: `/workspace/billing/checkout/result?order=${overview.pendingOrder.id}`, label: "Xem giao dịch" },
    });
  if (usage.overLimit.groups)
    notices.push({ key: "groups", text: `Bạn đang sở hữu ${usage.usage.ownedGroups} nhóm, gói hiện tại cho phép ${usage.entitlements.maxOwnedGroups}. Không thể tạo nhóm mới cho đến khi nâng cấp.`, action: { href: "/workspace/pricing", label: "So sánh gói" } });
  if (usage.overLimit.storage)
    notices.push({ key: "storage", text: `Workspace đang dùng ${formatBytes(usage.usage.totalBytes)}, gói hiện tại cho phép ${formatBytes(usage.entitlements.maxStorageBytes)}. Không thể tải thêm tài liệu cho đến khi dọn bớt hoặc nâng cấp.`, action: { href: "/workspace/pricing", label: "So sánh gói" } });
  if (usage.overLimit.memberGroupIds.length)
    notices.push({ key: "members", text: `${usage.overLimit.memberGroupIds.length} nhóm đang vượt số thành viên tối đa. Thành viên hiện tại được giữ, nhưng không thể thêm người mới.` });
  if (!notices.length) return null;
  return (
    <div className="mb-4 space-y-2">
      {notices.map((n) => (
        <div key={n.key} role="status" className="flex flex-wrap items-start gap-3 rounded-lg border border-primary/30 bg-primary-tint p-4 text-sm text-text">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <p className="min-w-0 flex-1">{n.text}</p>
          {n.action && (
            <Button href={n.action.href} size="sm" variant="outline">
              {n.action.label}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="mt-0.5 truncate font-medium text-navy">{value}</dd>
    </div>
  );
}

function SkeletonLines({ rows }: { rows: number }) {
  return (
    <div className="mt-4 space-y-3" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-4 animate-pulse rounded bg-border-soft" style={{ width: `${90 - i * 8}%` }} />
      ))}
    </div>
  );
}
