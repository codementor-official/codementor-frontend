"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { WarningIcon as AlertTriangle, ArrowUpRightIcon as ArrowUpRight, BellRingingIcon as BellRing, CalendarDotsIcon as CalendarClock, CreditCardIcon as CreditCard, EyeSlashIcon as EyeOff, LockIcon as Lock, ReceiptIcon as Receipt, ShieldCheckIcon as ShieldCheck, SparkleIcon as Sparkles } from "@phosphor-icons/react/ssr";
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
              {sub?.refundToday && sub.refundToday.terms.length > 0 && <RefundToday refund={sub.refundToday} />}
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
              <UsageMeter
                label="Lượt hỏi AI tài liệu tháng này"
                used={usage.usage.aiRequestsThisMonth}
                limit={usage.entitlements.monthlyAiRequests}
                level={usage.levels.ai}
                display={`${usage.usage.aiRequestsThisMonth} / ${formatLimit(usage.entitlements.monthlyAiRequests)} lượt`}
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
                        {g.overLimitReasons.length > 0 && (
                          <p className="mt-1 text-xs text-danger">
                            Vượt hạn mức:{" "}
                            {g.overLimitReasons
                              .map((r) => ({ groups: "ngoài số nhóm được giữ", members: "quá số thành viên", storage: "dung lượng chung" })[r])
                              .join(", ")}
                            {usage.overage && ` · ${{ notice: "sắp chỉ đọc", read_only: "đang chỉ đọc", hidden: "đang tạm ẩn" }[usage.overage.stage]}`}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {overview && <LapsePolicy policy={overview.policy} />}

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
                      {o.coupon && <span className="ml-2 text-xs font-normal text-success">mã {o.coupon.code} −{formatVnd(o.discountVnd)}</span>}
                    </span>
                    <span className="text-right">
                      <span className="block font-semibold text-navy">{formatVnd(o.amountVnd)}</span>
                      {o.status === "refunded" && o.refundedVnd !== null && (
                        <span className="block text-xs text-text-muted">đã hoàn {formatVnd(o.refundedVnd)}</span>
                      )}
                    </span>
                    <OrderStatus status={o.status} />
                    <span className="flex items-center gap-1 text-xs text-text-faint">Hoá đơn <ArrowUpRight className="h-4 w-4" aria-hidden /></span>
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
  const ended = overview.recentlyEnded;
  if (ended && ended.reason === "refunded")
    notices.push({
      key: "refunded",
      text: `Gói ${ended.planName} đã kết thúc ngày ${formatVnDate(ended.endedAt)} vì đơn đã được hoàn tiền. Tài khoản đang dùng hạn mức Free; nhóm và tài liệu vẫn được giữ nguyên.`,
      action: { href: "/workspace/pricing", label: "Mua lại gói" },
    });
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
  const why = [
    usage.overLimit.groups && `sở hữu ${usage.usage.ownedGroups}/${usage.entitlements.maxOwnedGroups} nhóm`,
    usage.overLimit.storage && `dùng ${formatBytes(usage.usage.totalBytes)}/${formatBytes(usage.entitlements.maxStorageBytes)}`,
    usage.overLimit.memberGroupIds.length > 0 && `${usage.overLimit.memberGroupIds.length} nhóm quá số thành viên`,
  ].filter(Boolean).join(", ");
  const affected = usage.groups.filter((g) => g.overLimitReasons.length).length;
  if (why) {
    const o = usage.overage;
    const when = !o
      ? `Nếu chưa xử lý, sau ${overview.policy.overageNoticeDays} ngày các nhóm vượt hạn mức sẽ chuyển sang chỉ đọc.`
      : o.stage === "notice"
        ? `Từ ${formatVnDate(o.readOnlyAt)}, ${affected} nhóm vượt hạn mức sẽ chuyển sang chỉ đọc.`
        : o.stage === "read_only"
          ? `${affected} nhóm đang chỉ đọc. Từ ${formatVnDate(o.hiddenAt)} các nhóm này sẽ tạm ẩn với thành viên.`
          : `${affected} nhóm đang tạm ẩn với thành viên. Dữ liệu vẫn được giữ nguyên.`;
    notices.push({
      key: "overage",
      text: (
        <>
          <strong>Workspace đang vượt hạn mức gói {usage.plan.name}</strong> ({why}). {when} Nâng cấp, gia hạn hoặc dọn dẹp để
          mở lại ngay; các nhóm bị ảnh hưởng được đánh dấu bên dưới.
        </>
      ),
      action: { href: "/workspace/pricing", label: "So sánh gói" },
    });
  }
  if (!notices.length) return null;
  return (
    <div className="mb-4 space-y-2">
      {notices.map((n) => (
        <div key={n.key} role="status" className="flex flex-wrap items-start gap-3 rounded-lg border border-border bg-border-soft p-4 text-sm text-text">
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

/** What happens if a paid plan is not renewed, with the durations configured by administrators. */
export function LapsePolicy({ policy }: { policy: SubscriptionOverview["policy"] }) {
  const steps = [
    { icon: BellRing, title: `${policy.renewalReminderDays} ngày trước hạn`, body: "Bạn nhận thông báo nhắc gia hạn. Không có khoản tự động trừ tiền." },
    { icon: ShieldCheck, title: `Ân hạn ${policy.graceDays} ngày`, body: "Hết kỳ vẫn giữ nguyên hạn mức và tính năng của gói." },
    { icon: AlertTriangle, title: `Cảnh báo ${policy.overageNoticeDays} ngày`, body: "Về hạn mức Free. Nếu đang vượt, mọi thứ vẫn chạy và bạn được báo ngày khoá." },
    { icon: Lock, title: `Chỉ đọc ${policy.overageReadOnlyDays} ngày`, body: "Nhóm vượt hạn mức: xem, tải, làm bài đã giao, dọn dẹp được; không thêm nội dung mới." },
    { icon: EyeOff, title: "Tạm ẩn", body: "Thành viên không mở được nhóm; bạn vẫn vào để dọn dẹp. Không có dữ liệu nào bị xoá." },
  ];
  return (
    <Card className="mt-4 p-5">
      <h2 className="font-semibold text-navy">Nếu không gia hạn thì sao?</h2>
      <p className="mt-1 text-sm text-text-muted">
        Chỉ các nhóm vượt hạn mức Free bị ảnh hưởng: nhóm ngoài số nhóm được giữ (giữ nhóm hoạt động gần nhất), nhóm quá số thành
        viên, hoặc mọi nhóm nếu vượt dung lượng. Gia hạn, nâng cấp hay dọn dẹp ở bất kỳ bước nào đều mở lại ngay.
      </p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step, i) => (
          <li key={step.title} className="rounded-lg border border-border-soft p-3">
            <span className="flex items-center gap-2 text-xs font-semibold text-text-faint">
              <step.icon className="h-4 w-4 text-text-muted" aria-hidden /> Bước {i + 1}
            </span>
            <p className="mt-1 text-sm font-semibold text-navy">{step.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}

const DAY = 86_400_000;

/** What the buyer would get back today, term by term, so the refund policy is never a surprise. */
function RefundToday({ refund }: { refund: NonNullable<SubscriptionOverview["subscription"]>["refundToday"] }) {
  return (
    <div className="mt-4 rounded-md bg-border-soft p-3 text-sm">
      <p className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold text-navy">Nếu hoàn tiền hôm nay</span>
        <span className="font-semibold text-navy">{formatVnd(refund.totalVnd)}</span>
      </p>
      <ul className="mt-1 space-y-0.5 text-xs text-text-muted">
        {refund.terms.map((t) => {
          const total = Math.round((Date.parse(t.endsAt) - Date.parse(t.startsAt)) / DAY);
          // The server refunds paid × daysLeft / total (rounded down), so the days left follow exactly from the amount.
          const left = t.paidVnd > 0 ? Math.round((total * t.refundableVnd) / t.paidVnd) : 0;
          return (
            <li key={t.orderId}>
              Kỳ {formatVnDate(t.startsAt)} – {formatVnDate(t.endsAt)}: {formatVnd(t.refundableVnd)} trên {formatVnd(t.paidVnd)} đã trả
              {t.refundableVnd === t.paidVnd ? " (chưa dùng, hoàn đủ)" : ` (còn ${left}/${total} ngày)`}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs leading-relaxed text-text-muted">
        Hoàn theo số ngày chưa dùng của kỳ: qua nửa kỳ thì hoàn một nửa, kỳ trả trước chưa bắt đầu hoàn đủ. Số tiền giảm mỗi
        ngày một lần. Muốn hoàn tiền, gửi yêu cầu tới{" "}
        <a href="mailto:codementor.official@gmail.com" className="font-semibold text-navy underline">codementor.official@gmail.com</a>;
        hoàn kỳ đang dùng thì gói kết thúc ngay và tài khoản về hạn mức Free, dữ liệu giữ nguyên.
      </p>
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
