"use client";

import { useCallback, useEffect, useState } from "react";
import { EyeOff, Lock, TriangleAlert } from "lucide-react";
import { apiErrorMessage } from "@codementor/api-client";
import { Field, ReasonButton, SideDrawer, StatusBadge, useToast } from "@codementor/ui";
import { formatBytes, formatLimit, formatVnDate, formatVnd, toBytes, usagePercent } from "@codementor/utils";
import type { Entitlements, OverageReason, SubscriberDetail, WorkspacePlanUsage } from "@codementor/types";
import { useAdminApi } from "@/features/auth/admin-api";
import { inputClassName } from "@/features/commerce/form-style";
import { plansApi } from "./api";
import { KIND, ORDER_LABEL, ORDER_TONE } from "./operations-tabs";
import { Section } from "./order-drawer";
import { STATE } from "./subscribers-tab";
import { TraceLink, useTrace } from "./trace";

const SOURCE: Record<string, string> = { free: "gói Free", paid: "gói đã trả", grace: "đang ân hạn" };
const END_REASON: Record<string, string> = {
  upgraded: "nâng cấp sang gói khác",
  replaced: "thay bằng gói khác",
  refunded: "đã hoàn tiền",
  expired: "hết hạn",
  admin: "quản trị viên kết thúc",
};
const REASON: Record<OverageReason, string> = {
  groups: "ngoài số nhóm được giữ",
  members: "quá số thành viên",
  storage: "dung lượng chung vượt hạn mức",
};
const STAGE = {
  notice: { label: "Đang cảnh báo", icon: TriangleAlert, text: "Mọi thứ vẫn hoạt động; chủ nhóm đã được báo ngày khoá." },
  read_only: { label: "Nhóm chỉ đọc", icon: Lock, text: "Các nhóm bị ảnh hưởng không thêm được nội dung mới." },
  hidden: { label: "Nhóm tạm ẩn", icon: EyeOff, text: "Thành viên không mở được các nhóm bị ảnh hưởng; dữ liệu vẫn còn." },
} as const;

/** One account's Workspace story: what applies now, why, what they bought and paid, and exceptions. */
export function SubscriberDrawer({ userId, onClose, onChanged }: { userId: string; onClose: () => void; onChanged?: () => void }) {
  const request = useAdminApi();
  const toast = useToast();
  const trace = useTrace();
  const [detail, setDetail] = useState<SubscriberDetail | null>(null);
  const [usage, setUsage] = useState<WorkspacePlanUsage | null>(null);
  const load = useCallback(
    () =>
      Promise.all([
        plansApi.subscriber(request, userId).then(setDetail),
        plansApi.ownerUsage(request, userId).then(setUsage).catch(() => setUsage(null)),
      ]).catch((e) => toast.error(apiErrorMessage(e))),
    [request, userId, toast],
  );
  useEffect(() => {
    void load();
  }, [load]);

  const act = async (work: () => Promise<unknown>, done: string) => {
    try {
      await work();
      toast.success(done);
      await load();
      onChanged?.();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const open = detail?.subscriptions.find((s) => !s.endedAt);
  const affected = usage?.groups.filter((g) => g.overLimitReasons.length) ?? [];
  return (
    <SideDrawer open onClose={onClose} width="wide" title={detail?.user.name ?? "Người dùng"} description={detail?.user.email}>
      {!detail ? (
        <div className="h-40 animate-pulse rounded-md bg-muted" aria-hidden />
      ) : (
        <div className="space-y-6 text-sm">
          <section className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={STATE[detail.state].tone}>{STATE[detail.state].label}</StatusBadge>
            {detail.effective && (
              <span>
                Đang áp dụng hạn mức <strong>{detail.effective.planName}</strong> ({SOURCE[detail.effective.source]})
              </span>
            )}
            {open && (
              <span className="ml-auto">
                {open.suspendedAt ? (
                  <ReasonButton size="sm" variant="outline" title="Khôi phục gói?" description="Quyền lợi đã mua được áp dụng lại ngay. Ghi lý do để lưu vào nhật ký."
                    onConfirm={(reason) => act(() => plansApi.restore(request, userId, reason), "Đã khôi phục gói")}>
                    Khôi phục
                  </ReasonButton>
                ) : (
                  <ReasonButton size="sm" variant="danger" title="Tạm ngưng gói?" description="Tài khoản dùng hạn mức Free cho đến khi khôi phục. Dữ liệu và quyền lợi đã mua không bị sửa."
                    onConfirm={(reason) => act(() => plansApi.suspend(request, userId, reason), "Đã tạm ngưng gói")}>
                    Tạm ngưng
                  </ReasonButton>
                )}
              </span>
            )}
          </section>

          {usage?.overage && (() => {
            const stage = STAGE[usage.overage.stage];
            return (
              <section className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
                <p className="flex items-center gap-2 font-semibold text-destructive">
                  <stage.icon className="size-4" aria-hidden /> Vượt hạn mức · {stage.label}
                </p>
                <p className="mt-1 text-xs">
                  Tài khoản này đang dùng nhiều hơn hạn mức {usage.plan.name}. {stage.text} Không có dữ liệu nào bị xoá; gia hạn, nâng cấp
                  hoặc dọn dẹp thì mở lại ngay.
                </p>
                <ol className="mt-2 grid gap-1 text-xs sm:grid-cols-3">
                  <li>Phát hiện: <strong>{formatVnDate(usage.overage.overSince, true)}</strong></li>
                  <li>Chỉ đọc từ: <strong>{formatVnDate(usage.overage.readOnlyAt)}</strong></li>
                  <li>Tạm ẩn từ: <strong>{formatVnDate(usage.overage.hiddenAt)}</strong></li>
                </ol>
              </section>
            );
          })()}

          {usage && (
            <Section title="Hạn mức và mức đang dùng" hint="Hạn mức đã gồm điều chỉnh ngoại lệ. Màu đỏ là đang vượt.">
              <div className="grid gap-2 sm:grid-cols-2">
                <Meter label="Nhóm sở hữu" used={usage.usage.ownedGroups} limit={usage.entitlements.maxOwnedGroups} text={`${usage.usage.ownedGroups} / ${formatLimit(usage.entitlements.maxOwnedGroups)}`} />
                <Meter label="Dung lượng" used={usage.usage.totalBytes} limit={usage.entitlements.maxStorageBytes} text={`${formatBytes(usage.usage.totalBytes)} / ${formatBytes(usage.entitlements.maxStorageBytes)}`} />
                <Meter label="Lượt AI tháng này" used={usage.usage.aiRequestsThisMonth} limit={usage.entitlements.monthlyAiRequests} text={`${usage.usage.aiRequestsThisMonth} / ${formatLimit(usage.entitlements.monthlyAiRequests)}`} />
                <div className="rounded-md border p-2 text-xs">
                  <span className="text-muted-foreground">Thành viên mỗi nhóm · tệp tối đa</span>
                  <p className="mt-1 font-medium">{formatLimit(usage.entitlements.maxMembersPerGroup)} · {formatBytes(usage.entitlements.maxUploadBytes)}</p>
                </div>
              </div>
              {usage.groups.length > 0 && (
                <table className="mt-3 w-full text-xs">
                  <thead className="text-left text-muted-foreground">
                    <tr><th className="py-1 font-medium">Nhóm sở hữu ({usage.groups.length})</th><th className="font-medium">Thành viên</th><th className="font-medium">Dung lượng</th><th className="font-medium">Tình trạng</th></tr>
                  </thead>
                  <tbody>
                    {[...affected, ...usage.groups.filter((g) => !g.overLimitReasons.length)].map((g) => (
                      <tr key={g.id} className="border-t">
                        <td className="py-1">
                          <a className="text-primary hover:underline" href={`/workspaces?q=${encodeURIComponent(g.slug)}`}>{g.name}</a>
                          {g.status === "archived" && <span className="text-muted-foreground"> · đã lưu trữ</span>}
                        </td>
                        <td>{g.memberCount}</td>
                        <td>{formatBytes(g.storedBytes)}</td>
                        <td className={g.overLimitReasons.length ? "text-destructive" : "text-muted-foreground"}>
                          {g.overLimitReasons.length ? g.overLimitReasons.map((r) => REASON[r]).join(", ") : "Trong hạn mức"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>
          )}

          <Section title="Các gói đã mua" hint="Mỗi gói giữ nguyên giá và hạn mức lúc mua (snapshot), kể cả khi bảng giá đổi.">
            {detail.subscriptions.length === 0 && <p className="text-muted-foreground">Chưa mua gói nào.</p>}
            <ul className="space-y-3">
              {detail.subscriptions.map((s) => (
                <li key={s.id} className="rounded-md border p-3">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {s.planName} · theo {s.billingCycle === "year" ? "năm" : "tháng"} · {formatVnd(s.priceVnd)}
                    {s.endedAt ? (
                      <StatusBadge>Kết thúc {formatVnDate(s.endedAt)} · {END_REASON[s.endReason ?? ""] ?? s.endReason}</StatusBadge>
                    ) : s.cancelAtPeriodEnd ? (
                      <StatusBadge tone="warning">Đã tắt gia hạn</StatusBadge>
                    ) : (
                      <StatusBadge tone="success">Đang mở</StatusBadge>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Mua {formatVnDate(s.createdAt)} · điều khoản {s.termsVersion}</p>
                  <Limits e={s.entitlements} />
                  <ul className="mt-2 space-y-0.5 text-xs">
                    {s.terms.map((t) => (
                      <li key={t.orderId}>
                        Kỳ {formatVnDate(t.startsAt)} – {formatVnDate(t.endsAt)} ·{" "}
                        <TraceLink onClick={() => trace.openOrder(t.orderId)}>xem đơn</TraceLink>
                      </li>
                    ))}
                  </ul>
                  {s.suspendedReason && <p className="mt-1 text-xs text-destructive">Tạm ngưng: {s.suspendedReason}</p>}
                </li>
              ))}
            </ul>
          </Section>

          <Section title={`Giao dịch (${detail.orders.length})`}>
            <ul className="divide-y rounded-md border">
              {detail.orders.map((o) => (
                <li key={o.id}>
                  <button type="button" className="flex w-full flex-wrap items-center gap-2 px-3 py-2 text-left hover:bg-muted/50" onClick={() => trace.openOrder(o.id)}>
                    <span className="w-32 text-xs text-muted-foreground">{formatVnDate(o.createdAt, true)}</span>
                    <span>{KIND[o.kind]} {o.planName} · {o.billingCycle === "year" ? "năm" : "tháng"}</span>
                    <span className="ml-auto font-medium">{formatVnd(o.amountVnd)}</span>
                    <StatusBadge tone={ORDER_TONE[o.status]}>{ORDER_LABEL[o.status]}</StatusBadge>
                  </button>
                </li>
              ))}
              {detail.orders.length === 0 && <li className="px-3 py-2 text-muted-foreground">Không có giao dịch.</li>}
            </ul>
          </Section>

          <Adjustments detail={detail} userId={userId} act={act} />
        </div>
      )}
    </SideDrawer>
  );
}

function Meter({ label, used, limit, text }: { label: string; used: number; limit: number; text: string }) {
  const pct = usagePercent(used, limit);
  const over = used > limit;
  return (
    <div className="rounded-md border p-2 text-xs">
      <span className="flex justify-between text-muted-foreground">{label}<span className={over ? "font-semibold text-destructive" : "text-foreground"}>{text}</span></span>
      <div className="mt-1.5 h-1.5 rounded-full bg-muted">
        <div className={`h-1.5 rounded-full ${over ? "bg-destructive" : pct >= 85 ? "bg-chart-4" : "bg-chart-2"}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

function Limits({ e }: { e: Entitlements }) {
  return (
    <p className="mt-1 text-xs text-muted-foreground">
      {formatLimit(e.maxOwnedGroups)} nhóm · {formatLimit(e.maxMembersPerGroup)} thành viên/nhóm · {formatBytes(e.maxStorageBytes)} · tệp{" "}
      {formatBytes(e.maxUploadBytes)} · {formatLimit(e.monthlyAiRequests)} lượt AI/tháng
    </p>
  );
}

const ENTITLEMENTS = [
  { value: "max_owned_groups", label: "Nhóm sở hữu", unit: "" },
  { value: "max_members_per_group", label: "Thành viên mỗi nhóm", unit: "" },
  { value: "max_storage_bytes", label: "Dung lượng", unit: "GB" },
  { value: "max_upload_bytes", label: "Tệp tối đa", unit: "MB" },
  { value: "monthly_ai_requests", label: "Lượt AI / tháng", unit: "" },
] as const;

function adjustmentText(entitlement: string, amount: string | number) {
  const kind = ENTITLEMENTS.find((x) => x.value === entitlement);
  const n = Number(amount);
  const value = kind?.unit ? formatBytes(n) : n.toLocaleString("vi-VN");
  return `+${value} ${kind?.label.toLowerCase() ?? entitlement}`;
}

/** Exceptional grants: added on top of the purchase, time-boxed, reasoned and audited. */
function Adjustments({ detail, userId, act }: { detail: SubscriberDetail; userId: string; act: (w: () => Promise<unknown>, done: string) => Promise<void> }) {
  const request = useAdminApi();
  const [entitlement, setEntitlement] = useState<(typeof ENTITLEMENTS)[number]["value"]>("max_storage_bytes");
  const [amount, setAmount] = useState("1");
  const [endsAt, setEndsAt] = useState("");
  const kind = ENTITLEMENTS.find((x) => x.value === entitlement)!;
  const value = kind.unit ? toBytes(Number(amount), kind.unit) : Number(amount);
  const valid = Number.isFinite(value) && value > 0 && !!endsAt;
  return (
    <Section title="Điều chỉnh ngoại lệ" hint="Cộng thêm vào hạn mức đã mua, có thời hạn và lý do. Gói đã mua không bị sửa.">
      <ul className="mb-3 space-y-1">
        {detail.adjustments.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2">
            <span className="font-medium">{adjustmentText(a.entitlement, a.amount)}</span>
            <span className="text-xs text-muted-foreground">
              {formatVnDate(a.starts_at)} – {formatVnDate(a.ends_at)} · {a.created_by_name}: {a.reason}
            </span>
            {a.revoked_at ? (
              <StatusBadge>Đã thu hồi</StatusBadge>
            ) : (
              <ReasonButton size="sm" variant="ghost" className="ml-auto" title="Thu hồi điều chỉnh?" description="Hạn mức cộng thêm sẽ không còn áp dụng."
                onConfirm={(reason) => act(() => plansApi.revokeAdjustment(request, a.id, reason), "Đã thu hồi")}>
                Thu hồi
              </ReasonButton>
            )}
          </li>
        ))}
        {detail.adjustments.length === 0 && <li className="text-muted-foreground">Chưa có điều chỉnh.</li>}
      </ul>
      <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-3">
        <Field label="Hạn mức" htmlFor="adj-kind">
          <select id="adj-kind" className={inputClassName} value={entitlement} onChange={(e) => setEntitlement(e.target.value as typeof entitlement)}>
            {ENTITLEMENTS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
          </select>
        </Field>
        <Field label={`Cộng thêm${kind.unit ? ` (${kind.unit})` : ""}`} htmlFor="adj-amount">
          <input id="adj-amount" className={inputClassName} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
        </Field>
        <Field label="Hết hiệu lực" htmlFor="adj-end">
          <input id="adj-end" type="date" className={inputClassName} value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </Field>
        <div className="sm:col-span-3">
          <ReasonButton size="sm" variant="outline" disabled={!valid} title="Thêm điều chỉnh?" description="Điều chỉnh cộng thêm vào hạn mức đã mua, có thời hạn, và được ghi vào nhật ký."
            onConfirm={(reason) => act(() => plansApi.addAdjustment(request, userId, { entitlement, amount: value, endsAt: new Date(`${endsAt}T23:59:59+07:00`).toISOString(), reason }), "Đã thêm điều chỉnh")}>
            Thêm điều chỉnh
          </ReasonButton>
        </div>
      </div>
    </Section>
  );
}
