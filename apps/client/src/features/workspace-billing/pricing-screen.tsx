"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, CalendarClock, Check, CircleDashed, CreditCard, ShieldCheck, Wallet } from "lucide-react";
import { apiErrorMessage } from "@codementor/api-client";
import { InfoHint, useToast } from "@codementor/ui";
import { annualSaving, formatVnDate, formatVnd } from "@codementor/utils";
import type { BillingCycle, PlanCatalog, PlanOnSale, SubscriptionOverview } from "@codementor/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { billingApi } from "./api";
import { CYCLE_LABEL, EntitlementDiff, featureLabel, limitRows } from "./plan-presentation";

type Action =
  | { kind: "current"; label: string }
  | { kind: "checkout"; label: string; href: string }
  | { kind: "schedule"; label: string }
  | { kind: "none"; label: string };

export function PricingScreen() {
  const toast = useToast();
  const [catalog, setCatalog] = useState<PlanCatalog | null>(null);
  const [overview, setOverview] = useState<SubscriptionOverview | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("month");
  const [error, setError] = useState("");
  const [scheduling, setScheduling] = useState<PlanOnSale | null>(null);

  const load = useCallback(
    () =>
      Promise.all([billingApi.plans(), billingApi.subscription()])
        .then(([plans, sub]) => {
          setError("");
          setCatalog(plans);
          setOverview(sub);
          if (sub.subscription) setCycle(sub.subscription.billingCycle);
        })
        .catch((e) => setError(apiErrorMessage(e))),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);

  const plans = catalog?.plans ?? [];
  const hasAnnual = plans.some((p) => p.version.annualPriceVnd !== null);
  const current = plans.find((p) => p.id === overview?.plan.id) ?? null;

  function actionFor(plan: PlanOnSale): Action {
    const sub = overview?.subscription;
    const live = !!sub && ["ACTIVE", "CANCEL_SCHEDULED", "GRACE_PERIOD"].includes(overview!.state);
    const checkout = (label: string) => ({ kind: "checkout" as const, label, href: `/workspace/billing/checkout?plan=${plan.id}&cycle=${cycle}` });
    if (plan.isDefault) return live ? { kind: "schedule", label: "Chuyển về Free" } : { kind: "current", label: "Gói hiện tại" };
    if (!plan.isPurchasable) return { kind: "none", label: "Tạm ngừng bán" };
    if (cycle === "year" && plan.version.annualPriceVnd === null) return { kind: "none", label: "Chỉ bán theo tháng" };
    if (!live || !current) return checkout(`Chọn ${plan.version.name}`);
    if (plan.id === current.id) {
      if (sub!.billingCycle !== cycle) return { kind: "schedule", label: `Đổi sang thanh toán theo ${CYCLE_LABEL[cycle]}` };
      return sub!.renewable && !sub!.hasQueuedTerm ? checkout("Gia hạn") : { kind: "current", label: "Gói hiện tại" };
    }
    return plan.sortOrder > current.sortOrder
      ? checkout(`Nâng cấp lên ${plan.version.name}`)
      : { kind: "schedule", label: `Chuyển xuống ${plan.version.name}` };
  }

  async function confirmSchedule() {
    if (!scheduling) return;
    try {
      const result = await billingApi.scheduleChange(scheduling.id, cycle);
      toast.success(`Đã lên lịch. Thay đổi có hiệu lực từ ${formatVnDate(result.effectiveAt)}.`);
      setScheduling(null);
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  return (
    <>
      <PageHeader
        icon={Wallet}
        title="Chọn gói Workspace phù hợp với hành trình học của bạn"
        subtitle="Bắt đầu miễn phí, nâng cấp khi nhóm học lớn lên. Quyền lợi bạn đã mua luôn được giữ nguyên."
        actions={
          <Button href="/workspace/billing" variant="outline" size="sm">
            <CreditCard className="h-4 w-4" /> Gói của tôi
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

      {hasAnnual && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div role="radiogroup" aria-label="Chu kỳ thanh toán" className="inline-flex rounded-md border border-border bg-surface p-1">
            {(["month", "year"] as const).map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={cycle === c}
                onClick={() => setCycle(c)}
                className={`rounded px-4 py-1.5 text-sm font-semibold transition-colors duration-150 ${
                  cycle === c ? "bg-navy text-on-ink" : "text-text-muted hover:bg-border-soft"
                }`}
              >
                {c === "month" ? "Theo tháng" : "Theo năm"}
              </button>
            ))}
          </div>
          <span className="text-sm text-text-muted">Trả theo năm tiết kiệm khoảng 2 tháng.</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {catalog === null && !error
          ? Array.from({ length: 4 }, (_, i) => <PlanSkeleton key={i} />)
          : plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                cycle={cycle}
                catalog={catalog!}
                isCurrent={plan.id === overview?.plan.id}
                contractPriceVnd={
                  overview?.subscription?.planId === plan.id && overview.subscription.billingCycle === cycle
                    ? overview.subscription.priceVnd
                    : null
                }
                action={actionFor(plan)}
                onSchedule={() => setScheduling(plan)}
              />
            ))}
      </div>

      {catalog && <Comparison catalog={catalog} />}

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Explainer icon={ShieldCheck} title="Quyền lợi đã mua được bảo vệ">
          Khi CodeMentor thay đổi giá hoặc hạn mức của một gói, thay đổi chỉ áp dụng cho lượt mua mới. Gói bạn đang dùng
          giữ nguyên hạn mức và giá đã mua khi bạn gia hạn liên tục.
        </Explainer>
        <Explainer icon={CalendarClock} title="Gia hạn thủ công, không tự trừ tiền">
          Mỗi kỳ được thanh toán một lần qua VNPAY hoặc MoMo. Chúng tôi nhắc bạn trước ngày hết hạn và cho thêm thời gian ân
          hạn để gia hạn mà không mất hạn mức.
        </Explainer>
        <Explainer icon={BadgeCheck} title="Không bao giờ xoá dữ liệu của bạn">
          Hết hạn mà vẫn vượt hạn mức Free, nhóm vượt hạn mức được cảnh báo, rồi chuyển chỉ đọc, sau cùng tạm ẩn với thành
          viên. Dữ liệu luôn được giữ; gia hạn hoặc dọn dẹp là mở lại ngay.
        </Explainer>
      </div>

      <Faq />

      <ConfirmDialog
        open={!!scheduling}
        onClose={() => setScheduling(null)}
        onConfirm={confirmSchedule}
        tone="default"
        title={scheduling ? `Chuyển sang ${scheduling.version.name}?` : ""}
        confirmLabel="Lên lịch thay đổi"
        message={
          overview?.subscription?.paidThrough ? (
            <>
              Gói hiện tại vẫn giữ nguyên đến <strong>{formatVnDate(overview.subscription.paidThrough)}</strong>. Sau ngày
              này, hạn mức mới được áp dụng và không có khoản tiền nào bị trừ tự động
              {scheduling && !scheduling.isDefault ? "; bạn sẽ thanh toán gói mới khi kỳ hiện tại kết thúc" : ""}. Dữ liệu vượt
              hạn mức mới vẫn được giữ, nhưng bạn sẽ không thêm được nhóm, thành viên hay tài liệu cho đến khi dọn bớt.
            </>
          ) : (
            "Thay đổi sẽ áp dụng vào cuối kỳ thanh toán hiện tại."
          )
        }
      >
        {scheduling && overview && (
          <EntitlementDiff
            from={overview.entitlements}
            to={scheduling.version.entitlements}
            fromLabel={overview.plan.name}
            toLabel={scheduling.version.name}
          />
        )}
      </ConfirmDialog>
    </>
  );
}

function PlanCard({
  plan,
  cycle,
  catalog,
  isCurrent,
  contractPriceVnd,
  action,
  onSchedule,
}: {
  plan: PlanOnSale;
  cycle: BillingCycle;
  catalog: PlanCatalog;
  isCurrent: boolean;
  /** What this subscriber renews at; differs from the list price once a newer version is published. */
  contractPriceVnd: number | null;
  action: Action;
  onSchedule: () => void;
}) {
  const v = plan.version;
  const annual = cycle === "year" ? v.annualPriceVnd : null;
  const saving = annualSaving(v.monthlyPriceVnd, v.annualPriceVnd);
  const featured = plan.isRecommended;
  const listPrice = cycle === "year" ? v.annualPriceVnd : v.monthlyPriceVnd;
  return (
    <Card className={`flex flex-col p-5 ${featured ? "border-primary ring-1 ring-primary" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-navy">{v.name}</h2>
          <p className="text-sm text-text-muted">{v.tagline}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {featured && <Badge tone="primary">Phổ biến nhất</Badge>}
          {isCurrent && <Badge tone="success">Gói hiện tại</Badge>}
        </div>
      </div>

      <div className="mt-4 min-h-16">
        {v.monthlyPriceVnd === 0 ? (
          <p className="text-3xl font-bold text-navy">0 ₫</p>
        ) : annual !== null ? (
          <>
            <p className="text-3xl font-bold text-navy">
              {formatVnd(saving!.perMonth)}
              <span className="text-sm font-medium text-text-muted"> / tháng</span>
            </p>
            <p className="text-xs text-text-muted">
              {formatVnd(annual)} mỗi năm{saving!.percent > 0 ? ` · tiết kiệm ${saving!.percent}%` : ""}
            </p>
          </>
        ) : (
          <p className="text-3xl font-bold text-navy">
            {formatVnd(v.monthlyPriceVnd)}
            <span className="text-sm font-medium text-text-muted"> / tháng</span>
          </p>
        )}
        {contractPriceVnd !== null && contractPriceVnd !== listPrice && (
          <p className="mt-1 text-xs font-semibold text-success">
            Bạn gia hạn với giá đã mua: {formatVnd(contractPriceVnd)} / {CYCLE_LABEL[cycle]}
          </p>
        )}
      </div>

      {v.description && <p className="mt-2 text-sm text-text">{v.description}</p>}

      <div className="mt-4">
        {action.kind === "checkout" ? (
          <Button href={action.href} variant={featured ? "primary" : "outline"} className="w-full">
            {action.label}
          </Button>
        ) : action.kind === "schedule" ? (
          <Button variant="outline" className="w-full" onClick={onSchedule}>
            {action.label}
          </Button>
        ) : (
          <Button variant="outline" className="w-full" disabled>
            {action.label}
          </Button>
        )}
      </div>

      <ul className="mt-5 space-y-2.5 border-t border-border-soft pt-4 text-sm">
        {limitRows(v.entitlements).map((row) => (
          <li key={row.key} className="flex items-start gap-2.5">
            <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden />
            <span className="min-w-0 flex-1 text-text">
              <span className="font-semibold text-navy">{row.strong}</span> {row.rest}
            </span>
            <InfoHint text={row.hint} />
          </li>
        ))}
        {v.entitlements.features.map((key) => {
          const f = featureLabel(catalog.features, key);
          if (!f) return null;
          return (
            <li key={key} className="flex items-start gap-2.5">
              {f.status === "available" ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
              ) : (
                <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-text-faint" aria-hidden />
              )}
              <span className="min-w-0 flex-1 text-text">
                {f.label}
                {f.status === "planned" && <span className="ml-1 text-xs text-text-muted">(sắp ra mắt)</span>}
              </span>
              <InfoHint text={f.description} />
            </li>
          );
        })}
        {v.highlights.filter((h) => !catalog.features.some((f) => f.label === h)).map((h) => (
          <li key={h} className="flex items-start gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
            <span className="text-text">{h}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Comparison({ catalog }: { catalog: PlanCatalog }) {
  const rows = limitRows(catalog.plans[0]?.version.entitlements ?? emptyEntitlements);
  return (
    <details className="group mt-8 rounded-lg border border-border bg-surface">
      <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-navy transition-colors duration-150 hover:bg-bg">
        So sánh chi tiết các gói
        <span className="ml-2 text-sm font-normal text-text-muted group-open:hidden">Mở bảng</span>
      </summary>
      <div className="overflow-x-auto border-t border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th scope="col" className="px-5 py-3 font-semibold text-text-muted">Hạn mức</th>
              {catalog.plans.map((p) => (
                <th key={p.id} scope="col" className="px-5 py-3 font-bold text-navy">{p.version.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-border-soft">
                <th scope="row" className="px-5 py-3 text-left font-medium text-text">
                  <span className="inline-flex items-center gap-1.5">
                    {row.label} <InfoHint text={row.hint} />
                  </span>
                </th>
                {catalog.plans.map((p) => (
                  <td key={p.id} className="px-5 py-3 text-navy">
                    {limitRows(p.version.entitlements).find((r) => r.key === row.key)?.value}
                  </td>
                ))}
              </tr>
            ))}
            {catalog.features.map((f) => (
              <tr key={f.key} className="border-t border-border-soft">
                <th scope="row" className="px-5 py-3 text-left font-medium text-text">
                  {f.label}
                  {f.status === "planned" && <span className="ml-1 text-xs text-text-muted">(sắp ra mắt)</span>}
                  <span className="mt-0.5 block text-xs font-normal text-text-muted">{f.description}</span>
                </th>
                {catalog.plans.map((p) => (
                  <td key={p.id} className="px-5 py-3">
                    {p.version.entitlements.features.includes(f.key) ? (
                      <Check className="h-4 w-4 text-success" aria-label="Có" />
                    ) : (
                      <span className="text-text-faint" aria-label="Không">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-border-soft px-5 py-3 text-xs text-text-muted">
        Dung lượng là tổng của mọi nhóm bạn sở hữu; số thành viên được tính riêng cho từng nhóm. * Không giới hạn thành
        viên áp dụng theo chính sách sử dụng hợp lý để bảo vệ hạ tầng.
      </p>
    </details>
  );
}

const emptyEntitlements = { maxOwnedGroups: 0, maxMembersPerGroup: 0, maxStorageBytes: 0, maxUploadBytes: 1, monthlyAiRequests: 0, features: [] };

function Explainer({ icon: Icon, title, children }: { icon: typeof ShieldCheck; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <Icon className="h-5 w-5 text-primary" aria-hidden />
      <h3 className="mt-3 font-semibold text-navy">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{children}</p>
    </Card>
  );
}

const FAQ = [
  {
    q: "Ai cần mua gói Workspace?",
    a: "Chỉ Chủ nhóm. Thành viên tham gia nhóm của bạn không cần mua gì; hạn mức của nhóm lấy theo gói của Chủ nhóm.",
  },
  {
    q: "Lưu trữ nhóm có giải phóng lượt tạo nhóm không?",
    a: "Không. Nhóm đã lưu trữ vẫn tính vào số nhóm bạn sở hữu, để hạn mức không thể bị lách bằng cách lưu trữ rồi tạo lại.",
  },
  {
    q: "Nâng cấp giữa kỳ thì tính tiền thế nào?",
    a: "Phần chưa dùng của kỳ hiện tại được trừ vào giá gói mới theo tỷ lệ thời gian còn lại. Gói mới có hiệu lực ngay sau khi thanh toán được xác nhận.",
  },
  {
    q: "Không gia hạn thì nhóm 100 thành viên của tôi sẽ ra sao?",
    a: "Sau thời gian ân hạn, tài khoản về hạn mức Free. Nhóm vượt hạn mức (quá số thành viên, quá số nhóm, hoặc vượt dung lượng) được cảnh báo trước, rồi chuyển chỉ đọc: thành viên vẫn xem, tải tài liệu và làm bài đã giao nhưng không thêm nội dung mới. Nếu vẫn chưa xử lý, nhóm tạm ẩn với thành viên; bạn vẫn vào để dọn dẹp. Không có dữ liệu nào bị xoá, và nhóm mở lại ngay khi bạn gia hạn, nâng cấp hoặc giảm về trong hạn mức. Số ngày cụ thể hiển thị ở trang Gói của tôi.",
  },
  {
    q: "Gói Free khác gói trả phí ở tính năng nào?",
    a: "Free giao bài cho cả nhóm, xem số liệu tổng. Từ Plus trở lên có thêm Quản lý bài tập nâng cao (hạn nộp, giới hạn số lần nộp, giao cho từng thành viên, soạn bài bằng AI Lecter) và Thống kê nhóm chi tiết (tiến độ từng thành viên, xu hướng, xuất CSV). Tính năng tính theo gói của Chủ nhóm, áp dụng cho cả nhóm.",
  },
  {
    q: "Tôi có được hoàn tiền không?",
    a: "Huỷ gia hạn không hoàn tiền tự động; quyền lợi vẫn dùng đến hết kỳ đã trả. Trường hợp thanh toán lỗi hoặc trùng lặp được quản trị viên kiểm tra và xử lý.",
  },
];

function Faq() {
  return (
    <section className="mt-8" aria-labelledby="pricing-faq">
      <h2 id="pricing-faq" className="mb-3 text-lg font-bold text-navy">Câu hỏi thường gặp</h2>
      <div className="divide-y divide-border-soft rounded-lg border border-border bg-surface">
        {FAQ.map((item) => (
          <details key={item.q} className="group">
            <summary className="cursor-pointer list-none px-5 py-4 font-medium text-navy transition-colors duration-150 hover:bg-bg">
              {item.q}
            </summary>
            <p className="px-5 pb-4 text-sm leading-relaxed text-text-muted">{item.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-4 text-sm text-text-muted">
        Còn thắc mắc? Xem <Link href="/workspace/billing" className="font-semibold text-primary">gói và thanh toán của bạn</Link>{" "}
        hoặc liên hệ codementor.official@gmail.com.
      </p>
    </section>
  );
}

function PlanSkeleton() {
  return (
    <Card className="p-5" aria-hidden>
      <div className="h-5 w-24 animate-pulse rounded bg-border-soft" />
      <div className="mt-2 h-4 w-32 animate-pulse rounded bg-border-soft" />
      <div className="mt-6 h-8 w-36 animate-pulse rounded bg-border-soft" />
      <div className="mt-6 h-10 w-full animate-pulse rounded bg-border-soft" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-4 w-full animate-pulse rounded bg-border-soft" />
        ))}
      </div>
    </Card>
  );
}
