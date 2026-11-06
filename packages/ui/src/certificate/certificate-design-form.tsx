"use client";

import { useRef, useState } from "react";
import { PlusIcon as Plus, TrashIcon as Trash, UploadSimpleIcon as Upload, XIcon as X } from "@phosphor-icons/react/ssr";
import { Field } from "../field";
import { Input } from "../input";
import { SegmentedTabs } from "../segmented-tabs";
import { CertificateView } from "./certificate-view";
import {
  CERTIFICATE_ACCENTS,
  CERTIFICATE_PLACEHOLDERS,
  MAX_FIELDS,
  PLACEHOLDER_LABELS,
  sampleCertificateData,
  validateDesign,
  type CertificateDesign,
} from "./design";

const LAYOUT_OPTIONS = [
  { value: "classic", label: "Cổ điển" },
  { value: "modern", label: "Hiện đại" },
  { value: "minimal", label: "Tối giản" },
];

const ACCENT_SWATCH: Record<CertificateDesign["accent"], { hex: string; label: string }> = {
  orange: { hex: "#ea580c", label: "Cam" },
  ink: { hex: "#1f2937", label: "Than" },
  emerald: { hex: "#047857", label: "Lục bảo" },
  blue: { hex: "#1d4ed8", label: "Xanh dương" },
  violet: { hex: "#6d28d9", label: "Tím" },
};

const TEXTAREA =
  "w-full rounded-md border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground";

/** Ô văn bản đang được chèn ô điền khi bấm chip. */
type Target = "heading" | "body" | "signerName" | "signerTitle" | `field-${number}`;

/**
 * Form soạn mẫu chứng chỉ, kèm bản xem trước vẽ bằng đúng `CertificateView` mà học viên sẽ
 * thấy. Dùng chung cho studio giảng viên và trang mẫu mặc định của admin.
 *
 * `onUpload` trả về URL công khai của ảnh đã tải lên (presign → PUT). Không truyền thì ẩn nút
 * tải ảnh — ví dụ khi mẫu chưa được lưu lần đầu nên chưa có id để presign.
 */
export function CertificateDesignForm({
  value,
  onChange,
  subject = "course",
  onUpload,
  disabled = false,
}: {
  value: CertificateDesign;
  onChange: (next: CertificateDesign) => void;
  subject?: "course" | "roadmap";
  onUpload?: (kind: "logo" | "signature", file: File) => Promise<string>;
  disabled?: boolean;
}) {
  const [target, setTarget] = useState<Target>("body");
  const [uploading, setUploading] = useState<"logo" | "signature" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { errors } = validateDesign(value);
  const patch = (next: Partial<CertificateDesign>) => onChange({ ...value, ...next });

  const insert = (name: string) => {
    const token = `{{${name}}}`;
    if (target.startsWith("field-")) {
      const index = Number(target.slice(6));
      patch({
        fields: value.fields.map((field, i) => (i === index ? { ...field, value: `${field.value}${token}` } : field)),
      });
      return;
    }
    const key = target as "heading" | "body" | "signerName" | "signerTitle";
    patch({ [key]: `${value[key] ?? ""}${token}` });
  };

  const upload = async (kind: "logo" | "signature", file: File | undefined) => {
    if (!file || !onUpload) return;
    setUploading(kind);
    setUploadError(null);
    try {
      const url = await onUpload(kind, file);
      patch(kind === "logo" ? { logoUrl: url } : { signatureUrl: url });
    } catch (cause) {
      setUploadError(cause instanceof Error ? cause.message : "Không tải được ảnh");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-4">
        <Field label="Bố cục" htmlFor="certificate-layout">
          <SegmentedTabs
            options={LAYOUT_OPTIONS}
            value={value.layout}
            onChange={(layout) => patch({ layout: layout as CertificateDesign["layout"] })}
          />
        </Field>

        <Field label="Màu nhấn" htmlFor="certificate-accent">
          <div id="certificate-accent" role="radiogroup" className="flex flex-wrap gap-2">
            {CERTIFICATE_ACCENTS.map((accent) => (
              <button
                key={accent}
                type="button"
                role="radio"
                aria-checked={value.accent === accent}
                aria-label={ACCENT_SWATCH[accent].label}
                title={ACCENT_SWATCH[accent].label}
                onClick={() => patch({ accent })}
                className={`h-8 w-8 rounded-full ring-offset-2 ring-offset-card ${value.accent === accent ? "ring-2 ring-foreground" : ""}`}
                style={{ background: ACCENT_SWATCH[accent].hex }}
              />
            ))}
          </div>
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-medium">Ô điền tự động</p>
          <p className="mb-2 text-xs text-muted-foreground">
            Bấm để chèn vào ô đang chọn. Tên học viên luôn được in cỡ lớn, không cần chèn vào nội dung.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {CERTIFICATE_PLACEHOLDERS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => insert(name)}
                className="rounded-full border border-border px-2.5 py-1 text-xs hover:border-foreground"
              >
                {PLACEHOLDER_LABELS[name]}
              </button>
            ))}
          </div>
        </div>

        <Field label="Tiêu đề" htmlFor="certificate-heading">
          <Input
            id="certificate-heading"
            value={value.heading}
            maxLength={80}
            onFocus={() => setTarget("heading")}
            onChange={(event) => patch({ heading: event.target.value })}
          />
        </Field>

        <Field label="Nội dung" htmlFor="certificate-body">
          <textarea
            id="certificate-body"
            rows={3}
            maxLength={400}
            className={TEXTAREA}
            value={value.body}
            onFocus={() => setTarget("body")}
            onChange={(event) => patch({ body: event.target.value })}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Người ký" htmlFor="certificate-signer">
            <Input
              id="certificate-signer"
              value={value.signerName}
              maxLength={80}
              onFocus={() => setTarget("signerName")}
              onChange={(event) => patch({ signerName: event.target.value })}
            />
          </Field>
          <Field label="Chức danh" htmlFor="certificate-signer-title">
            <Input
              id="certificate-signer-title"
              value={value.signerTitle ?? ""}
              maxLength={80}
              onFocus={() => setTarget("signerTitle")}
              onChange={(event) => patch({ signerTitle: event.target.value })}
            />
          </Field>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-sm font-medium">Thông tin thêm</p>
            <button
              type="button"
              disabled={value.fields.length >= MAX_FIELDS}
              onClick={() => patch({ fields: [...value.fields, { label: "", value: "" }] })}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm dòng ({value.fields.length}/{MAX_FIELDS})
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {value.fields.map((field, index) => (
              <div key={index} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] gap-2">
                <Input
                  aria-label={`Nhãn dòng ${index + 1}`}
                  placeholder="Nhãn"
                  maxLength={40}
                  value={field.label}
                  onChange={(event) =>
                    patch({ fields: value.fields.map((f, i) => (i === index ? { ...f, label: event.target.value } : f)) })
                  }
                />
                <Input
                  aria-label={`Giá trị dòng ${index + 1}`}
                  placeholder="Giá trị"
                  maxLength={120}
                  value={field.value}
                  onFocus={() => setTarget(`field-${index}`)}
                  onChange={(event) =>
                    patch({ fields: value.fields.map((f, i) => (i === index ? { ...f, value: event.target.value } : f)) })
                  }
                />
                <button
                  type="button"
                  aria-label={`Xóa dòng ${index + 1}`}
                  onClick={() => patch({ fields: value.fields.filter((_, i) => i !== index) })}
                  className="rounded-md px-2 text-muted-foreground hover:text-foreground"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {onUpload && (
          <div className="grid gap-4 sm:grid-cols-2">
            {(["logo", "signature"] as const).map((kind) => (
              <ImageSlot
                key={kind}
                label={kind === "logo" ? "Logo" : "Chữ ký"}
                url={kind === "logo" ? value.logoUrl : value.signatureUrl}
                busy={uploading === kind}
                onPick={(file) => void upload(kind, file)}
                onClear={() => patch(kind === "logo" ? { logoUrl: undefined } : { signatureUrl: undefined })}
              />
            ))}
          </div>
        )}
        {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}

        {errors.length > 0 && (
          <ul className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
      </fieldset>

      <div className="min-w-0 xl:sticky xl:top-4 xl:self-start">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Xem trước với dữ liệu mẫu</p>
        <CertificateView design={value} data={sampleCertificateData(subject)} />
      </div>
    </div>
  );
}

function ImageSlot({
  label,
  url,
  busy,
  onPick,
  onClear,
}: {
  label: string;
  url?: string;
  busy: boolean;
  onPick: (file: File | undefined) => void;
  onClear: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <div className="flex h-12 w-24 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-2xs text-muted-foreground">Chưa có</span>
          )}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold hover:border-foreground disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" /> {busy ? "Đang tải..." : "Tải ảnh"}
        </button>
        {url && (
          <button type="button" aria-label={`Bỏ ${label.toLowerCase()}`} onClick={onClear} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            onPick(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
