"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import { NotePencilIcon as FilePenLine, ClockCounterClockwiseIcon as History, PencilSimpleIcon as Pencil, PlusIcon as Plus, RocketLaunchIcon as Rocket, ShieldCheckIcon as ShieldCheck, ProhibitIcon as Prohibit, StorefrontIcon as Storefront, EyeIcon as Eye, EyeSlashIcon as EyeSlash, StarIcon as Star, FloppyDiskIcon as FloppyDisk } from "@phosphor-icons/react/ssr";
import { apiErrorMessage } from "@codementor/api-client";
import { Button, Card, ConfirmButton, Field, InfoHint, Modal, SideDrawer, StatusBadge, useToast } from "@codementor/ui";
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
        const name = shown?.name ?? plan.code;
        const state = visibility(plan);
        return (
          <Card key={plan.id} className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold">{name}</h3>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{plan.code}</code>
                  {plan.isRecommended && <StatusBadge tone="warning">Phổ biến nhất</StatusBadge>}
                </div>
                <p className="flex items-center gap-2 text-sm">
                  <span className={`size-2 shrink-0 rounded-full ${DOT[state.tone]}`} aria-hidden />
                  <span className="font-medium">{state.label}</span>
                  <span className="text-muted-foreground">· {plan.openSubscriptions} gói đang mở</span>
                </p>
                {shown && <Offer version={shown} draft={!plan.onSale} />}
                <p className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                  <span>Phiên bản:</span>
                  {plan.onSale && <VersionPill tone="success">v{plan.onSale.version} đang bán</VersionPill>}
                  {plan.scheduled && (
                    <VersionPill tone="warning">
                      v{plan.scheduled.version} áp dụng {plan.scheduled.availableFrom ? formatVnDate(plan.scheduled.availableFrom, true) : "sắp tới"}
                    </VersionPill>
                  )}
                  {plan.draft && <VersionPill tone="neutral">v{plan.draft.version} bản nháp</VersionPill>}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setHistory(plan)}>
                  <History className="h-3.5 w-3.5" /> Lịch sử
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing({ plan, version: plan.draft ?? plan.onSale })}>
                  <Pencil className="h-3.5 w-3.5" /> {plan.draft ? `Sửa bản nháp v${plan.draft.version}` : "Sửa giá & hạn mức"}
                </Button>
                {plan.draft && (
                  <Button size="sm" onClick={() => setPublishing(plan)}>
                    <Rocket className="h-3.5 w-3.5" /> Xuất bản v{plan.draft.version}
                  </Button>
                )}
              </div>
            </div>

            {!plan.onSale && (
              <p className="mx-4 mb-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
                Khách chưa thấy gói này: chưa có phiên bản nào được xuất bản. Bấm <strong>Xuất bản v{plan.draft?.version ?? 1}</strong> để đưa gói lên bảng giá.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t bg-muted/30 px-4 py-2.5">
              {!plan.isDefault && (
                <Setting label="Bán mới" hint="Ngừng bán: khách không mua mới hay nâng cấp lên gói này. Người đang dùng vẫn gia hạn được.">
                  {plan.isPurchasable ? (
                    <ConfirmButton
                      size="sm"
                      variant="outline"
                      title={`Ngừng bán gói ${name}?`}
                      description={`Gói biến khỏi lựa chọn mua mới và nâng cấp. ${plan.openSubscriptions} gói đang mở vẫn dùng và gia hạn bình thường. Mở bán lại bất cứ lúc nào.`}
                      confirmLabel="Ngừng bán"
                      onConfirm={() => patch(plan, { isPurchasable: false }, "Đã ngừng bán gói")}
                    >
                      <Prohibit className="h-3.5 w-3.5" /> Ngừng bán
                    </ConfirmButton>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => patch(plan, { isPurchasable: true, status: "active" }, "Đã mở bán gói")}>
                      <Storefront className="h-3.5 w-3.5" /> Mở bán
                    </Button>
                  )}
                </Setting>
              )}
              {!plan.isDefault && (
                <Setting label="Bảng giá" hint="Ẩn: gói không còn hiện trên bảng giá và ngừng bán luôn. Người đang dùng không bị ảnh hưởng.">
                  {plan.status === "active" ? (
                    <ConfirmButton
                      size="sm"
                      variant="outline"
                      title={`Ẩn gói ${name} khỏi bảng giá?`}
                      description="Gói không còn hiện trên bảng giá và ngừng bán luôn. Người đang dùng không bị ảnh hưởng."
                      confirmLabel="Ẩn khỏi bảng giá"
                      onConfirm={() => patch(plan, { status: "hidden", isPurchasable: false }, "Đã ẩn gói khỏi bảng giá")}
                    >
                      <EyeSlash className="h-3.5 w-3.5" /> Ẩn
                    </ConfirmButton>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => patch(plan, { status: "active" }, "Đã hiện gói trên bảng giá")}>
                      <Eye className="h-3.5 w-3.5" /> Hiện
                    </Button>
                  )}
                </Setting>
              )}
              {!plan.isDefault && plan.onSale && plan.status === "active" && !plan.isRecommended && (
                <Setting label="Nhãn" hint="Gói gắn nhãn “Phổ biến nhất” được làm nổi trên bảng giá.">
                  <Button size="sm" variant="outline" onClick={() => patch(plan, { isRecommended: true }, "Đã đặt làm gói đề xuất")}>
                    <Star className="h-3.5 w-3.5" /> Đặt “Phổ biến nhất”
                  </Button>
                </Setting>
              )}
              <Setting label="Thứ tự" hint="Vị trí trên bảng giá: số nhỏ đứng trước.">
                <SortOrder plan={plan} onSave={(sortOrder) => patch(plan, { sortOrder }, "Đã đổi thứ tự")} />
              </Setting>
              {plan.draft && (
                <div className="ml-auto">
                  <ConfirmButton
                    size="sm"
                    variant="ghost"
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
                </div>
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

type Tone = "success" | "warning" | "neutral";
const DOT: Record<Tone, string> = { success: "bg-success", warning: "bg-warning", neutral: "bg-muted-foreground/50" };

/** What a customer sees of the plan right now, in one line. */
export function visibility(plan: Pick<AdminPlan, "isDefault" | "onSale" | "status" | "isPurchasable">): { label: string; tone: Tone } {
  if (!plan.onSale) return { label: "Chưa xuất bản — khách chưa thấy", tone: "warning" };
  if (plan.isDefault) return { label: "Gói mặc định của mọi tài khoản", tone: "success" };
  if (plan.status !== "active") return { label: "Đang ẩn khỏi bảng giá — không bán mới", tone: "neutral" };
  if (!plan.isPurchasable) return { label: "Hiện trên bảng giá — ngừng bán mới", tone: "neutral" };
  return { label: "Đang bán trên bảng giá", tone: "success" };
}

function Offer({ version, draft }: { version: PlanVersion; draft: boolean }) {
  const e = version.entitlements;
  return (
    <div>
      <p className="text-lg font-semibold">
        {version.monthlyPriceVnd ? <>{formatVnd(version.monthlyPriceVnd)}<span className="text-sm font-normal text-muted-foreground">/tháng</span></> : "Miễn phí"}
        {version.annualPriceVnd !== null && version.monthlyPriceVnd > 0 && (
          <span className="text-sm font-normal text-muted-foreground"> · {formatVnd(version.annualPriceVnd)}/năm</span>
        )}
        {draft && <span className="ml-2 text-xs font-normal text-warning">(giá ở bản nháp)</span>}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatLimit(e.maxOwnedGroups)} nhóm · {formatLimit(e.maxMembersPerGroup)} thành viên/nhóm · {formatBytes(e.maxStorageBytes)} · tệp tối đa{" "}
        {formatBytes(e.maxUploadBytes)} · {formatLimit(e.monthlyAiRequests)} lượt AI/tháng
        {e.features.length > 0 && ` · ${e.features.length} tính năng`}
      </p>
    </div>
  );
}

function VersionPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-foreground">
      <span className={`size-1.5 rounded-full ${DOT[tone]}`} aria-hidden />
      {children}
    </span>
  );
}

/** One plan setting in the footer row: a label with its explanation on hover, then the control. */
function Setting({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        {label}
        <InfoHint text={hint} />
      </span>
      {children}
    </div>
  );
}

function SortOrder({ plan, onSave }: { plan: AdminPlan; onSave: (n: number) => void }) {
  const [value, setValue] = useState(String(plan.sortOrder));
  const id = `sort-${plan.id}`;
  const n = Number(value);
  const changed = value !== "" && Number.isInteger(n) && n !== plan.sortOrder;
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (changed) onSave(n);
      }}
    >
      <input id={id} aria-label={`Thứ tự của gói ${plan.code}`} className={`${inputClassName} h-8 w-16! py-1`} inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))} />
      <Button size="sm" type="submit" variant={changed ? "default" : "outline"} disabled={!changed}>
        <FloppyDisk className="h-3.5 w-3.5" /> Lưu
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
