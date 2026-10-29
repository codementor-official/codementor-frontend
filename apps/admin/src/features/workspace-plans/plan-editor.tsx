"use client";

import { useState } from "react";
import { apiErrorMessage } from "@codementor/api-client";
import { Button, Field, Modal } from "@codementor/ui";
import { BYTE_UNITS, formatBytes, formatLimit, formatVnd, fromBytes, toBytes } from "@codementor/utils";
import type { DraftVersionInput, FeatureDefinition, FeatureKey, PlanVersion } from "@codementor/types";
import { inputClassName } from "@/features/commerce/form-style";

type Unit = keyof typeof BYTE_UNITS;

interface FormState {
  code: string;
  name: string;
  tagline: string;
  description: string;
  highlights: string;
  monthly: string;
  annual: string;
  offerAnnual: boolean;
  groups: string;
  members: string;
  unlimitedMembers: boolean;
  storage: string;
  storageUnit: Unit;
  upload: string;
  uploadUnit: Unit;
  ai: string;
  features: FeatureKey[];
}

function initial(v: PlanVersion | null): FormState {
  const e = v?.entitlements;
  const storage = fromBytes(e?.maxStorageBytes ?? 2 * BYTE_UNITS.GB);
  const upload = fromBytes(e?.maxUploadBytes ?? 100 * BYTE_UNITS.MB);
  return {
    code: "",
    name: v?.name ?? "",
    tagline: v?.tagline ?? "",
    description: v?.description ?? "",
    highlights: (v?.highlights ?? []).join("\n"),
    monthly: String(v?.monthlyPriceVnd ?? 99000),
    annual: v?.annualPriceVnd != null ? String(v.annualPriceVnd) : "",
    offerAnnual: v ? v.annualPriceVnd !== null : true,
    groups: String(e?.maxOwnedGroups ?? 5),
    members: e?.maxMembersPerGroup != null ? String(e.maxMembersPerGroup) : "50",
    unlimitedMembers: e ? e.maxMembersPerGroup === null : false,
    storage: String(storage.value),
    storageUnit: storage.unit,
    upload: String(upload.value),
    uploadUnit: upload.unit,
    ai: String(e?.monthlyAiRequests ?? 200),
    features: e?.features ?? [],
  };
}

function toInput(f: FormState): DraftVersionInput {
  const int = (s: string) => (s.trim() === "" ? NaN : Number(s));
  return {
    name: f.name.trim(),
    tagline: f.tagline.trim(),
    description: f.description.trim(),
    highlights: f.highlights.split("\n").map((h) => h.trim()).filter(Boolean),
    monthlyPriceVnd: int(f.monthly),
    annualPriceVnd: f.offerAnnual ? int(f.annual) : null,
    maxOwnedGroups: int(f.groups),
    maxMembersPerGroup: f.unlimitedMembers ? null : int(f.members),
    maxStorageBytes: toBytes(Number(f.storage), f.storageUnit),
    maxUploadBytes: toBytes(Number(f.upload), f.uploadUnit),
    monthlyAiRequests: int(f.ai),
    features: f.features,
  };
}

/** Problems the server would also report, shown beside the form before a round trip. */
function problems(i: DraftVersionInput, isDefault: boolean): string[] {
  const out: string[] = [];
  const whole = (n: number) => Number.isSafeInteger(n) && n >= 0;
  if (!i.name) out.push("Nhập tên gói.");
  if (isDefault ? i.monthlyPriceVnd !== 0 || i.annualPriceVnd !== null : !(i.monthlyPriceVnd >= 5000))
    out.push(isDefault ? "Gói mặc định phải miễn phí và không bán theo năm." : "Giá tháng tối thiểu 5.000 ₫.");
  if (i.annualPriceVnd !== null && !(i.annualPriceVnd >= 5000)) out.push("Giá năm tối thiểu 5.000 ₫.");
  if (!whole(i.maxOwnedGroups)) out.push("Số nhóm phải là số nguyên không âm.");
  if (i.maxMembersPerGroup !== null && !(Number.isSafeInteger(i.maxMembersPerGroup) && i.maxMembersPerGroup >= 2))
    out.push("Thành viên mỗi nhóm tối thiểu 2, hoặc chọn không giới hạn.");
  if (!whole(i.maxStorageBytes)) out.push("Dung lượng không hợp lệ.");
  if (!(i.maxUploadBytes > 0)) out.push("Kích thước tệp phải lớn hơn 0.");
  else if (i.maxUploadBytes > Math.max(i.maxStorageBytes, 1)) out.push("Tệp tối đa không được lớn hơn tổng dung lượng.");
  if (!whole(i.monthlyAiRequests)) out.push("Lượt AI phải là số nguyên không âm.");
  return out;
}

export function PlanEditor({
  open,
  mode,
  version,
  isDefault,
  features,
  onClose,
  onSubmit,
}: {
  open: boolean;
  /** `create` also asks for the permanent plan code. */
  mode: "create" | "edit";
  /** The draft, or the version on sale when starting a new draft from it. */
  version: PlanVersion | null;
  isDefault: boolean;
  features: FeatureDefinition[];
  onClose: () => void;
  onSubmit: (input: DraftVersionInput, code: string) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(() => initial(version));
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const input = toInput(form);
  const issues = problems(input, isDefault);
  const codeError = mode === "create" && !/^[a-z][a-z0-9-]{1,30}$/.test(form.code) ? "Mã gồm chữ thường, số, gạch ngang; bắt đầu bằng chữ." : "";
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function submit() {
    setAttempted(true);
    if (issues.length || codeError) return;
    setSaving(true);
    setServerError("");
    try {
      await onSubmit(input, form.code);
    } catch (e) {
      setServerError(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="lg"
      title={mode === "create" ? "Tạo gói mới" : `Bản nháp ${version?.status === "draft" ? `v${version.version}` : "mới"}`}
      description="Bản nháp chưa ảnh hưởng tới ai. Chỉ khi xuất bản, phiên bản mới mới áp dụng cho lượt mua mới."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Đang lưu…" : mode === "create" ? "Tạo gói (ẩn)" : "Lưu bản nháp"}
          </Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          {mode === "create" && (
            <Field label="Mã gói (không đổi được)" htmlFor="pe-code" error={attempted ? codeError : undefined}>
              <input id="pe-code" className={inputClassName} value={form.code} onChange={(e) => set("code", e.target.value.toLowerCase())} placeholder="vd. school" />
            </Field>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tên hiển thị" htmlFor="pe-name">
              <input id="pe-name" className={inputClassName} value={form.name} maxLength={60} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Khẩu hiệu" htmlFor="pe-tagline">
              <input id="pe-tagline" className={inputClassName} value={form.tagline} maxLength={120} onChange={(e) => set("tagline", e.target.value)} />
            </Field>
          </div>
          <Field label="Mô tả" htmlFor="pe-description">
            <textarea id="pe-description" className={inputClassName} rows={2} maxLength={600} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field label="Điểm nổi bật (mỗi dòng một ý, tối đa 8)" htmlFor="pe-highlights">
            <textarea id="pe-highlights" className={inputClassName} rows={3} value={form.highlights} onChange={(e) => set("highlights", e.target.value)} />
          </Field>

          <fieldset className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
            <legend className="px-1 text-xs font-medium text-muted-foreground">Giá (VND, số nguyên)</legend>
            <Field label="Theo tháng" htmlFor="pe-monthly">
              <input id="pe-monthly" className={inputClassName} inputMode="numeric" value={form.monthly} disabled={isDefault} onChange={(e) => set("monthly", e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label="Theo năm" htmlFor="pe-annual">
              <div className="flex items-center gap-2">
                <input
                  id="pe-annual"
                  className={inputClassName}
                  inputMode="numeric"
                  value={form.offerAnnual ? form.annual : ""}
                  disabled={!form.offerAnnual || isDefault}
                  placeholder={form.offerAnnual ? "vd. 990000" : "Không bán theo năm"}
                  onChange={(e) => set("annual", e.target.value.replace(/\D/g, ""))}
                />
                <label className="flex shrink-0 items-center gap-1.5 text-xs">
                  <input type="checkbox" checked={form.offerAnnual} disabled={isDefault} onChange={(e) => set("offerAnnual", e.target.checked)} /> Bán
                </label>
              </div>
            </Field>
          </fieldset>

          <fieldset className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
            <legend className="px-1 text-xs font-medium text-muted-foreground">Hạn mức</legend>
            <Field label="Nhóm sở hữu" htmlFor="pe-groups" hint="Tính cả nhóm đã lưu trữ.">
              <input id="pe-groups" className={inputClassName} inputMode="numeric" value={form.groups} onChange={(e) => set("groups", e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label="Thành viên mỗi nhóm" htmlFor="pe-members" hint="Tính cả chủ nhóm.">
              <div className="flex items-center gap-2">
                <input id="pe-members" className={inputClassName} inputMode="numeric" value={form.unlimitedMembers ? "" : form.members} disabled={form.unlimitedMembers} placeholder={form.unlimitedMembers ? "Không giới hạn" : ""} onChange={(e) => set("members", e.target.value.replace(/\D/g, ""))} />
                <label className="flex shrink-0 items-center gap-1.5 text-xs">
                  <input type="checkbox" checked={form.unlimitedMembers} onChange={(e) => set("unlimitedMembers", e.target.checked)} /> Không giới hạn
                </label>
              </div>
            </Field>
            <ByteField id="pe-storage" label="Tổng dung lượng" value={form.storage} unit={form.storageUnit} onValue={(v) => set("storage", v)} onUnit={(u) => set("storageUnit", u)} />
            <ByteField id="pe-upload" label="Tệp tối đa" value={form.upload} unit={form.uploadUnit} onValue={(v) => set("upload", v)} onUnit={(u) => set("uploadUnit", u)} />
            <Field label="Lượt hỏi AI tài liệu / tháng" htmlFor="pe-ai" hint="Chung cho mọi nhóm của chủ nhóm, theo tháng dương lịch.">
              <input id="pe-ai" className={inputClassName} inputMode="numeric" value={form.ai} onChange={(e) => set("ai", e.target.value.replace(/\D/g, ""))} />
            </Field>
          </fieldset>

          <fieldset className="rounded-md border p-3">
            <legend className="px-1 text-xs font-medium text-muted-foreground">Tính năng</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {features.map((f) => (
                <label key={f.key} className="flex items-start gap-2 rounded-md border p-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={form.features.includes(f.key)}
                    onChange={(e) => set("features", e.target.checked ? [...form.features, f.key] : form.features.filter((k) => k !== f.key))}
                  />
                  <span>
                    <span className="block font-medium">
                      {f.label}
                      {f.status === "planned" && <span className="font-normal text-muted-foreground"> (sắp ra mắt)</span>}
                    </span>
                    <span className="block text-xs text-muted-foreground">{f.description}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Tính năng thêm vào gói cũng áp dụng cho người đã mua gói này; giá và hạn mức của họ giữ nguyên.</p>
          </fieldset>

          {attempted && issues.length > 0 && (
            <ul className="list-disc space-y-1 rounded-md bg-destructive/10 py-2 pl-7 pr-3 text-sm text-destructive" role="alert">
              {issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
          {serverError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {serverError}
            </p>
          )}
        </div>

        <aside aria-label="Xem trước" className="h-fit rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Xem trước trên bảng giá</p>
          <p className="mt-2 text-lg font-semibold">{input.name || "Tên gói"}</p>
          <p className="text-xs text-muted-foreground">{input.tagline}</p>
          <p className="mt-3 text-2xl font-semibold">
            {input.monthlyPriceVnd > 0 ? formatVnd(input.monthlyPriceVnd) : "0 ₫"}
            <span className="text-xs font-normal text-muted-foreground"> / tháng</span>
          </p>
          {input.annualPriceVnd !== null && Number.isFinite(input.annualPriceVnd) && (
            <p className="text-xs text-muted-foreground">{formatVnd(input.annualPriceVnd)} / năm</p>
          )}
          <ul className="mt-3 space-y-1 text-sm">
            <li>{formatLimit(input.maxOwnedGroups)} nhóm</li>
            <li>{input.maxMembersPerGroup === null ? "Không giới hạn" : formatLimit(input.maxMembersPerGroup)} thành viên / nhóm</li>
            <li>{Number.isFinite(input.maxStorageBytes) ? formatBytes(input.maxStorageBytes) : "—"} dung lượng</li>
            <li>Tệp tới {Number.isFinite(input.maxUploadBytes) ? formatBytes(input.maxUploadBytes) : "—"}</li>
            {input.highlights.map((h) => (
              <li key={h}>✓ {h}</li>
            ))}
          </ul>
        </aside>
      </div>
    </Modal>
  );
}

function ByteField({ id, label, value, unit, onValue, onUnit }: { id: string; label: string; value: string; unit: Unit; onValue: (v: string) => void; onUnit: (u: Unit) => void }) {
  return (
    <Field label={label} htmlFor={id}>
      <div className="flex gap-2">
        <input id={id} className={inputClassName} inputMode="decimal" value={value} onChange={(e) => onValue(e.target.value.replace(/[^\d.]/g, ""))} />
        <select className={`${inputClassName} w-20`} value={unit} onChange={(e) => onUnit(e.target.value as Unit)} aria-label={`Đơn vị ${label.toLowerCase()}`}>
          <option value="MB">MB</option>
          <option value="GB">GB</option>
        </select>
      </div>
    </Field>
  );
}
