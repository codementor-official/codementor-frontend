"use client";

import { useCallback, useEffect, useState } from "react";
import { FilePenLine, History, Pencil, Plus, Rocket, ShieldCheck } from "lucide-react";
import { apiErrorMessage } from "@codementor/api-client";
import { Button, Card, ConfirmButton, Field, Modal, SideDrawer, StatusBadge, useToast } from "@codementor/ui";
import { formatBytes, formatLimit, formatVnDate, formatVnd } from "@codementor/utils";
import type { AdminPlan, FeatureDefinition, PlanVersion } from "@codementor/types";
import { useAdminApi } from "@/features/auth/admin-api";
import { inputClassName } from "@/features/commerce/form-style";
import { plansApi } from "./api";
import { PlanEditor } from "./plan-editor";

type Editing = { plan: AdminPlan | null; version: PlanVersion | null };

export function PlansTab() {
  const request = useAdminApi();
  const toast = useToast();
  const [plans, setPlans] = useState<AdminPlan[] | null>(null);
  const [features, setFeatures] = useState<FeatureDefinition[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [publishing, setPublishing] = useState<AdminPlan | null>(null);
  const [history, setHistory] = useState<AdminPlan | null>(null);

  const load = useCallback(
    () =>
      Promise.all([plansApi.plans(request), plansApi.catalog(request)])
        .then(([p, c]) => {
          setError("");
          setPlans(p);
          setFeatures(c.features);
        })
        .catch((e) => setError(apiErrorMessage(e))),
    [request],
  );
  useEffect(() => {
    void load();
  }, [load]);

  async function patch(plan: AdminPlan, change: Parameters<typeof plansApi.updatePlan>[2], done: string) {
    try {
      await plansApi.updatePlan(request, plan.id, change);
      toast.success(done);
      await load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  return (
    <div className="space-y-3">
      <Card className="flex flex-wrap items-center gap-4 p-4">
        <ol className="grid flex-1 gap-3 text-sm sm:grid-cols-3">
          {[
            { icon: FilePenLine, title: "1. Sửa bản nháp", body: "Đổi giá, hạn mức, tính năng. Chưa ảnh hưởng ai." },
            { icon: Rocket, title: "2. Xuất bản", body: "Ngay hoặc hẹn giờ. Có bảng so sánh với bản đang bán." },
            { icon: ShieldCheck, title: "3. Người đã mua được giữ", body: "Giá và hạn mức họ đã mua không đổi khi gia hạn." },
          ].map((step) => (
            <li key={step.title} className="flex gap-2">
              <step.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span><span className="block font-medium">{step.title}</span><span className="block text-xs text-muted-foreground">{step.body}</span></span>
            </li>
          ))}
        </ol>
        <Button onClick={() => setEditing({ plan: null, version: null })}>
          <Plus className="h-4 w-4" /> Tạo gói
        </Button>
      </Card>

      {error && (
        <Card className="p-4 text-sm text-destructive" role="alert">
          {error}
        </Card>
      )}
      {!plans && !error && <Card className="h-40 animate-pulse" aria-hidden />}

      {plans?.map((plan) => {
        const shown = plan.onSale ?? plan.draft;
        return (
          <Card key={plan.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold">{shown?.name ?? plan.code}</h3>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{plan.code}</code>
                  <StatusBadge tone={plan.status === "active" ? "success" : "neutral"}>{STATUS[plan.status]}</StatusBadge>
                  {plan.isDefault && <StatusBadge>Mặc định</StatusBadge>}
                  {plan.isRecommended && <StatusBadge tone="warning">Đề xuất</StatusBadge>}
                  {!plan.isDefault && <StatusBadge tone={plan.isPurchasable ? "success" : "neutral"}>{plan.isPurchasable ? "Đang bán" : "Ngừng bán"}</StatusBadge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {plan.openSubscriptions} gói đang mở · thứ tự {plan.sortOrder}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setHistory(plan)}>
                  <History className="h-3.5 w-3.5" /> Phiên bản
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing({ plan, version: plan.draft ?? plan.onSale })}>
                  <Pencil className="h-3.5 w-3.5" /> {plan.draft ? `Sửa tiếp bản nháp v${plan.draft.version}` : "Chỉnh sửa giá & hạn mức"}
                </Button>
                {plan.draft && (
                  <Button size="sm" onClick={() => setPublishing(plan)}>
                    <Rocket className="h-3.5 w-3.5" /> Xuất bản v{plan.draft.version}
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <VersionSummary label="Đang bán" version={plan.onSale} empty="Chưa có phiên bản xuất bản" />
              <VersionSummary label="Đã lên lịch" version={plan.scheduled} empty="Không có" />
              <VersionSummary label="Bản nháp" version={plan.draft} empty="Không có bản nháp" />
            </div>

            <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
              {!plan.isDefault && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => patch(plan, { isPurchasable: !plan.isPurchasable, ...(!plan.isPurchasable ? { status: "active" } : {}) }, plan.isPurchasable ? "Đã ngừng bán gói" : "Đã mở bán gói")}>
                    {plan.isPurchasable ? "Ngừng bán" : "Mở bán"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => patch(plan, { status: plan.status === "active" ? "hidden" : "active", ...(plan.status === "active" ? { isPurchasable: false } : {}) }, "Đã cập nhật hiển thị")}>
                    {plan.status === "active" ? "Ẩn khỏi bảng giá" : "Hiện trên bảng giá"}
                  </Button>
                </>
              )}
              {!plan.isDefault && !plan.isRecommended && plan.status === "active" && (
                <Button size="sm" variant="ghost" onClick={() => patch(plan, { isRecommended: true }, "Đã đặt làm gói đề xuất")}>
                  Đặt làm “Phổ biến nhất”
                </Button>
              )}
              <SortOrder plan={plan} onSave={(sortOrder) => patch(plan, { sortOrder }, "Đã đổi thứ tự")} />
              {plan.draft && (
                <ConfirmButton
                  size="sm"
                  title="Bỏ bản nháp?"
                  description={`Bản nháp v${plan.draft.version} của ${plan.draft.name} sẽ bị xoá. Phiên bản đang bán không đổi.`}
                  onConfirm={async () => {
                    try {
                      await plansApi.discardDraft(request, plan.id);
                      toast.success("Đã bỏ bản nháp");
                      await load();
                    } catch (e) {
                      toast.error(apiErrorMessage(e));
                    }
                  }}
                >
                  Bỏ bản nháp
                </ConfirmButton>
              )}
            </div>
          </Card>
        );
      })}

      {editing && (
        <PlanEditor
          open
          mode={editing.plan ? "edit" : "create"}
          version={editing.version}
          isDefault={!!editing.plan?.isDefault}
          features={features}
          onClose={() => setEditing(null)}
          onSubmit={async (input, code) => {
            if (editing.plan) await plansApi.saveDraft(request, editing.plan.id, input);
            else await plansApi.createPlan(request, code, input);
            toast.success(editing.plan ? "Đã lưu bản nháp" : "Đã tạo gói ở trạng thái ẩn");
            setEditing(null);
            await load();
          }}
        />
      )}

      {publishing?.draft && (
        <PublishDialog
          plan={publishing}
          onClose={() => setPublishing(null)}
          onPublished={async () => {
            setPublishing(null);
            await load();
          }}
        />
      )}

      {history && <VersionHistory plan={history} onClose={() => setHistory(null)} />}
    </div>
  );
}

const STATUS: Record<AdminPlan["status"], string> = { active: "Hiển thị", hidden: "Đang ẩn", archived: "Lưu trữ" };

function VersionSummary({ label, version, empty }: { label: string; version: PlanVersion | null; empty: string }) {
  return (
    <div className="rounded-md border p-3 text-sm">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
        {version && ` · v${version.version}`}
      </p>
      {version ? (
        <>
          <p className="mt-1 font-semibold">
            {version.monthlyPriceVnd ? formatVnd(version.monthlyPriceVnd) : "Miễn phí"}
            {version.annualPriceVnd !== null && <span className="font-normal text-muted-foreground"> · {formatVnd(version.annualPriceVnd)}/năm</span>}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatLimit(version.entitlements.maxOwnedGroups)} nhóm · {version.entitlements.maxMembersPerGroup === null ? "∞" : version.entitlements.maxMembersPerGroup} TV/nhóm ·{" "}
            {formatBytes(version.entitlements.maxStorageBytes)} · tệp {formatBytes(version.entitlements.maxUploadBytes)} ·{" "}
            {version.entitlements.monthlyAiRequests} lượt AI/tháng
          </p>
          {version.entitlements.features.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">+ {version.entitlements.features.length} tính năng</p>
          )}
          {version.availableFrom && version.status === "published" && (
            <p className="mt-1 text-xs text-muted-foreground">Áp dụng từ {formatVnDate(version.availableFrom, true)}</p>
          )}
        </>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}

function SortOrder({ plan, onSave }: { plan: AdminPlan; onSave: (n: number) => void }) {
  const [value, setValue] = useState(String(plan.sortOrder));
  const id = `sort-${plan.id}`;
  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(value);
        if (Number.isInteger(n) && n >= 0 && n !== plan.sortOrder) onSave(n);
      }}
    >
      <label htmlFor={id} className="text-xs text-muted-foreground">
        Thứ tự
      </label>
      <input id={id} className={`${inputClassName} h-8 w-16! py-1`} inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))} />
      <Button size="sm" variant="ghost" type="submit">
        Lưu
      </Button>
    </form>
  );
}

function PublishDialog({ plan, onClose, onPublished }: { plan: AdminPlan; onClose: () => void; onPublished: () => Promise<void> }) {
  const request = useAdminApi();
  const toast = useToast();
  const draft = plan.draft!;
  const [when, setWhen] = useState<"now" | "later">("now");
  const [at, setAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function publish() {
    if (when === "later" && !at) return setError("Chọn thời điểm áp dụng.");
    setBusy(true);
    setError("");
    try {
      await plansApi.publish(request, plan.id, draft.updatedAt, when === "later" ? new Date(at).toISOString() : undefined);
      toast.success(`Đã xuất bản ${draft.name} v${draft.version}`);
      await onPublished();
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Xuất bản ${draft.name} v${draft.version}?`}
      width="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={publish} disabled={busy}>
            {busy ? "Đang xuất bản…" : "Xuất bản"}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <p className="rounded-md border border-warning/40 bg-warning/10 p-3">
          Xuất bản phiên bản này chỉ ảnh hưởng tới lượt mua mới và thoả thuận mới đủ điều kiện. {plan.openSubscriptions} gói đang
          mở giữ nguyên quyền lợi và giá đã mua. Phiên bản đã xuất bản không sửa được nữa.
        </p>
        {plan.onSale && <VersionCompare before={plan.onSale} after={draft} />}
        <fieldset className="space-y-2">
          <legend className="font-medium">Thời điểm áp dụng</legend>
          <label className="flex items-center gap-2">
            <input type="radio" checked={when === "now"} onChange={() => setWhen("now")} /> Ngay bây giờ
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={when === "later"} onChange={() => setWhen("later")} /> Lên lịch
          </label>
          {when === "later" && (
            <Field label="Áp dụng từ (giờ máy của bạn)" htmlFor="publish-at">
              <input id="publish-at" type="datetime-local" className={inputClassName} value={at} onChange={(e) => setAt(e.target.value)} />
            </Field>
          )}
        </fieldset>
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

function rows(v: PlanVersion): [string, string][] {
  const e = v.entitlements;
  return [
    ["Tên", v.name],
    ["Giá tháng", v.monthlyPriceVnd ? formatVnd(v.monthlyPriceVnd) : "Miễn phí"],
    ["Giá năm", v.annualPriceVnd === null ? "Không bán" : formatVnd(v.annualPriceVnd)],
    ["Nhóm sở hữu", formatLimit(e.maxOwnedGroups)],
    ["Thành viên / nhóm", formatLimit(e.maxMembersPerGroup)],
    ["Dung lượng", formatBytes(e.maxStorageBytes)],
    ["Tệp tối đa", formatBytes(e.maxUploadBytes)],
    ["Lượt AI / tháng", formatLimit(e.monthlyAiRequests)],
    ["Tính năng", e.features.join(", ") || "—"],
  ];
}

export function VersionCompare({ before, after }: { before: PlanVersion; after: PlanVersion }) {
  const a = rows(before);
  const b = rows(after);
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs text-muted-foreground">
        <tr>
          <th className="py-1.5 font-medium">Mục</th>
          <th className="py-1.5 font-medium">v{before.version}</th>
          <th className="py-1.5 font-medium">v{after.version}</th>
        </tr>
      </thead>
      <tbody>
        {a.map(([label, value], i) => {
          const changed = value !== b[i][1];
          return (
            <tr key={label} className="border-t">
              <td className="py-1.5 text-muted-foreground">{label}</td>
              <td className="py-1.5">{value}</td>
              <td className={`py-1.5 ${changed ? "font-semibold" : ""}`}>
                {b[i][1]}
                {changed && <span className="ml-1 text-xs text-warning">đổi</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function VersionHistory({ plan, onClose }: { plan: AdminPlan; onClose: () => void }) {
  const request = useAdminApi();
  const [versions, setVersions] = useState<(PlanVersion & { subscriptions: number })[] | null>(null);
  const [compare, setCompare] = useState<[number, number] | null>(null);
  useEffect(() => {
    plansApi.versions(request, plan.id).then((v) => {
      setVersions(v);
      if (v.length > 1) setCompare([1, 0]);
    });
  }, [request, plan.id]);
  return (
    <SideDrawer open onClose={onClose} title={`Lịch sử phiên bản · ${plan.code}`} width="wide">
      {!versions ? (
        <div className="h-32 animate-pulse rounded-md bg-muted" aria-hidden />
      ) : (
        <div className="space-y-4">
          <ol className="divide-y rounded-md border">
            {versions.map((v, i) => (
              <li key={v.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                <span className="font-semibold">v{v.version}</span>
                <StatusBadge tone={v.status === "published" ? "success" : "neutral"}>{v.status === "published" ? "Đã xuất bản" : "Nháp"}</StatusBadge>
                <span className="text-muted-foreground">{v.publishedAt ? formatVnDate(v.publishedAt, true) : formatVnDate(v.updatedAt, true)}</span>
                <span className="ml-auto text-xs text-muted-foreground">{v.subscriptions} gói đã mua</span>
                {i > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => setCompare([i, 0])}>
                    So với v{versions[0].version}
                  </Button>
                )}
              </li>
            ))}
          </ol>
          {compare && versions[compare[0]] && versions[compare[1]] && (
            <VersionCompare before={versions[compare[0]]} after={versions[compare[1]]} />
          )}
        </div>
      )}
    </SideDrawer>
  );
}
