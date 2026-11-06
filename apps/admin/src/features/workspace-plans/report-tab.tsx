"use client";

import { useEffect, useMemo, useState } from "react";
import { FileXlsIcon as FileXls } from "@phosphor-icons/react/ssr";
import { apiErrorMessage } from "@codementor/api-client";
import { Button, Card, InfoHint, StatusBadge, bucketLabel, downloadWorkspaceReportXlsx, useToast, useUrlState } from "@codementor/ui";
import { formatVnDate, formatVnd } from "@codementor/utils";
import type { ReportBucket, WorkspaceRevenueReport } from "@codementor/types";
import { useAdminApi } from "@/features/auth/admin-api";
import { inputClassName } from "@/features/commerce/form-style";
import { plansApi } from "./api";
import { KIND, ORDER_LABEL, ORDER_TONE } from "./operations-tabs";
import { PRESETS, presetRange, vietnamToday, type Preset } from "./report-period";
import { TraceLink, useTrace } from "./trace";
import { usePaged } from "./paged";

const BUCKETS: { value: ReportBucket; label: string }[] = [
  { value: "day", label: "Ngày" },
  { value: "month", label: "Tháng" },
  { value: "quarter", label: "Quý" },
  { value: "year", label: "Năm" },
];
const PRICING = {
  paid: { label: "Tính phí", tone: "success" },
  free: { label: "Miễn phí", tone: "neutral" },
  unpublished: { label: "Chưa xuất bản", tone: "warning" },
} as const;

/** Revenue of workspace plans for any period, by plan and by day / month / quarter / year, exportable to Excel. */
export function ReportTab() {
  const request = useAdminApi();
  const trace = useTrace();
  const toast = useToast();
  const [preset, setPreset] = useUrlState<Preset>("rPeriod", "this-month");
  const [bucket, setBucket] = useUrlState<ReportBucket>("rBucket", "day");
  const [custom, setCustom] = useState(() => presetRange("this-month", vietnamToday()));
  const range = useMemo(() => (preset === "custom" ? custom : presetRange(preset, vietnamToday())), [preset, custom]);
  const [data, setData] = useState<WorkspaceRevenueReport | null>(null);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const orders = usePaged(data?.orders, 10);

  useEffect(() => {
    if (!range.from || !range.to) return;
    let live = true;
    plansApi
      .revenueReport(request, { ...range, bucket })
      .then((r) => live && (setError(""), setData(r)))
      .catch((e) => live && (setData(null), setError(apiErrorMessage(e))));
    return () => {
      live = false;
    };
  }, [request, range, bucket]);

  const exportXlsx = async () => {
    if (!data) return;
    setExporting(true);
    try {
      await downloadWorkspaceReportXlsx(data);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const t = data?.totals;
  const maxNet = Math.max(1, ...(data?.series.map((s) => Math.abs(s.netVnd)) ?? []));

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-end gap-3 p-3">
        <div>
          <label htmlFor="r-period" className="text-xs text-muted-foreground">Kỳ báo cáo</label>
          <select
            id="r-period"
            className={inputClassName}
            value={preset}
            onChange={(e) => {
              const next = PRESETS.find((p) => p.value === e.target.value)!;
              if (next.value === "custom") setCustom(range);
              setPreset(next.value);
              setBucket(next.bucket);
            }}
          >
            {PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        {preset === "custom" &&
          (["from", "to"] as const).map((key) => (
            <div key={key}>
              <label htmlFor={`r-${key}`} className="text-xs text-muted-foreground">{key === "from" ? "Từ ngày" : "Đến ngày"}</label>
              <input
                id={`r-${key}`}
                type="date"
                className={inputClassName}
                value={custom[key]}
                min={key === "to" ? custom.from : undefined}
                max={key === "from" ? custom.to : undefined}
                onChange={(e) => setCustom({ ...custom, [key]: e.target.value })}
              />
            </div>
          ))}
        <div>
          <label htmlFor="r-bucket" className="text-xs text-muted-foreground">Gộp theo</label>
          <select id="r-bucket" className={inputClassName} value={bucket} onChange={(e) => setBucket(e.target.value as ReportBucket)}>
            {BUCKETS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>
        <p className="text-xs text-muted-foreground sm:self-center">
          {formatVnDate(range.from)} – {formatVnDate(range.to)} · giờ Việt Nam
        </p>
        <Button type="button" className="ml-auto" disabled={!data || exporting} onClick={exportXlsx}>
          <FileXls className="size-4" aria-hidden /> {exporting ? "Đang tạo file…" : "Xuất Excel"}
        </Button>
      </Card>

      {error && <Card className="p-4 text-sm text-destructive" role="alert">{error}</Card>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Doanh thu thuần", value: t && formatVnd(t.netVnd), hint: "Tiền thu trừ tiền đã hoàn trong kỳ", strong: true },
          { label: "Tiền thu", value: t && formatVnd(t.grossVnd), hint: `${t?.payments ?? 0} lần thanh toán` },
          { label: "Đã hoàn", value: t && formatVnd(t.refundedVnd), hint: `${t?.refunds ?? 0} lần hoàn tiền` },
          { label: "Giảm giá đã cấp", value: t && formatVnd(t.discountVnd), hint: t?.creditVnd ? `Trừ gói cũ ${formatVnd(t.creditVnd)}` : "Từ mã giảm giá" },
          { label: "Đơn trong kỳ", value: t && String(t.newSubscriptions + t.renewals + t.upgrades), hint: t ? `${t.newSubscriptions} mới · ${t.renewals} gia hạn · ${t.upgrades} nâng cấp` : "" },
          { label: "Đang trả phí / Free", value: t && `${t.payingAccounts.toLocaleString("vi-VN")} / ${t.freeAccounts.toLocaleString("vi-VN")}`, hint: "Số tài khoản hiện tại" },
        ].map((k) => (
          <Card key={k.label} className="p-3">
            <span className="text-xs text-muted-foreground">{k.label}</span>
            <span className={`mt-1 block truncate text-xl font-semibold ${k.strong ? "text-primary" : ""}`}>{k.value ?? "—"}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{k.hint}</span>
          </Card>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <h3 className="flex items-center gap-1.5 border-b px-4 py-3 text-sm font-semibold">
          Theo gói
          <InfoHint text="Loại gói và giá theo phiên bản đang bán. “Đang dùng” là số tài khoản hiện tại; Free gồm mọi tài khoản chưa có gói trả phí." />
        </h3>
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Gói</th>
              <th className="px-3 py-2 font-medium">Loại</th>
              <th className="px-3 py-2 text-right whitespace-nowrap font-medium">Giá tháng</th>
              <th className="px-3 py-2 text-right whitespace-nowrap font-medium">Đang dùng</th>
              <th className="px-3 py-2 text-right whitespace-nowrap font-medium">Mới / Gia hạn / Nâng cấp</th>
              <th className="px-3 py-2 text-right whitespace-nowrap font-medium">Tiền thu</th>
              <th className="px-3 py-2 text-right whitespace-nowrap font-medium">Đã hoàn</th>
              <th className="px-3 py-2 text-right whitespace-nowrap font-medium">Thuần</th>
              <th className="px-3 py-2 text-right whitespace-nowrap font-medium">Tỷ trọng</th>
            </tr>
          </thead>
          <tbody>
            {!data && !error && <tr><td colSpan={9} className="px-3 py-6"><div className="h-4 animate-pulse rounded bg-muted" /></td></tr>}
            {data?.plans.map((p) => (
              <tr key={p.planId} className="border-t">
                <td className="px-3 py-2">
                  <TraceLink onClick={() => trace.goTab("subscribers", { sPlan: p.planId })}>{p.name}</TraceLink>
                  <span className="block text-xs text-muted-foreground">
                    {p.code}{p.status === "hidden" ? " · đang ẩn" : p.status === "archived" ? " · lưu trữ" : ""}
                  </span>
                </td>
                <td className="px-3 py-2"><StatusBadge tone={PRICING[p.pricing].tone}>{PRICING[p.pricing].label}</StatusBadge></td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{p.monthlyPriceVnd === null ? "—" : formatVnd(p.monthlyPriceVnd)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{p.activeAccounts.toLocaleString("vi-VN")}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap text-muted-foreground">{p.newSubscriptions} / {p.renewals} / {p.upgrades}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{formatVnd(p.grossVnd)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap text-muted-foreground">{p.refundedVnd ? formatVnd(p.refundedVnd) : "—"}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap font-medium">{formatVnd(p.netVnd)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap text-muted-foreground">{t?.netVnd ? `${Math.round((p.netVnd / t.netVnd) * 100)}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="overflow-x-auto">
        <h3 className="border-b px-4 py-3 text-sm font-semibold">Theo {BUCKETS.find((b) => b.value === bucket)?.label.toLowerCase()}</h3>
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Kỳ</th>
              <th className="px-3 py-2 text-right whitespace-nowrap font-medium">Thanh toán</th>
              <th className="px-3 py-2 text-right whitespace-nowrap font-medium">Tiền thu</th>
              <th className="px-3 py-2 text-right whitespace-nowrap font-medium">Đã hoàn</th>
              <th className="px-3 py-2 text-right whitespace-nowrap font-medium">Thuần</th>
              <th className="w-1/4 px-3 py-2 font-medium"><span className="sr-only">Biểu đồ</span></th>
            </tr>
          </thead>
          <tbody>
            {data?.series.map((s) => (
              <tr key={s.bucket} className="border-t">
                <td className="px-3 py-1.5">{bucketLabel(data.bucket, s.bucket)}</td>
                <td className="px-3 py-1.5 text-right whitespace-nowrap text-muted-foreground">{s.payments}{s.refunds ? ` · ${s.refunds} hoàn` : ""}</td>
                <td className="px-3 py-1.5 text-right whitespace-nowrap">{s.grossVnd ? formatVnd(s.grossVnd) : "—"}</td>
                <td className="px-3 py-1.5 text-right whitespace-nowrap text-muted-foreground">{s.refundedVnd ? formatVnd(s.refundedVnd) : "—"}</td>
                <td className={`px-3 py-1.5 text-right font-medium ${s.netVnd < 0 ? "text-destructive" : ""}`}>{s.netVnd ? formatVnd(s.netVnd) : "—"}</td>
                <td className="px-3 py-1.5" aria-hidden>
                  <div className="h-2 rounded-full bg-muted">
                    <div className={`h-2 rounded-full ${s.netVnd < 0 ? "bg-destructive/60" : "bg-primary"}`} style={{ width: `${(Math.abs(s.netVnd) / maxNet) * 100}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="overflow-x-auto">
        <h3 className="flex items-center gap-1.5 border-b px-4 py-3 text-sm font-semibold">
          Đơn có thu hoặc hoàn trong kỳ {data && <span className="font-normal text-muted-foreground">· {data.orders.length.toLocaleString("vi-VN")}{data.ordersTruncated ? "+" : ""}</span>}
        </h3>
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Thanh toán lúc</th>
              <th className="px-3 py-2 font-medium">Người mua</th>
              <th className="px-3 py-2 font-medium">Nội dung</th>
              <th className="px-3 py-2 text-right whitespace-nowrap font-medium">Thu trong kỳ</th>
              <th className="px-3 py-2 text-right whitespace-nowrap font-medium">Hoàn trong kỳ</th>
              <th className="px-3 py-2 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {orders.rows.map((o) => (
              <tr key={o.id} className="cursor-pointer border-t transition-colors hover:bg-muted/50" onClick={() => trace.openOrder(o.id)}>
                <td className="px-3 py-2 text-muted-foreground">{o.paidAt ? formatVnDate(o.paidAt, true) : "—"}</td>
                <td className="px-3 py-2">{o.buyer.name}<span className="block text-xs text-muted-foreground">{o.buyer.email}</span></td>
                <td className="px-3 py-2">
                  {KIND[o.kind]} {o.planName} · {o.billingCycle === "year" ? "năm" : "tháng"}
                  {o.coupon && <span className="block text-xs text-muted-foreground">Mã {o.coupon} · giảm {formatVnd(o.discountVnd)}</span>}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{o.collectedInPeriodVnd ? formatVnd(o.collectedInPeriodVnd) : "—"}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap text-muted-foreground">{o.refundedInPeriodVnd ? formatVnd(o.refundedInPeriodVnd) : "—"}</td>
                <td className="px-3 py-2"><StatusBadge tone={ORDER_TONE[o.status]}>{ORDER_LABEL[o.status]}</StatusBadge></td>
              </tr>
            ))}
            {data?.orders.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Không có giao dịch trong kỳ.</td></tr>}
          </tbody>
        </table>
        {orders.footer && <div className="border-t px-3 py-2">{orders.footer}</div>}
      </Card>
    </div>
  );
}
