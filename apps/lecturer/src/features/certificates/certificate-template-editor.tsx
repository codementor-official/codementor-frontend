"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeftIcon as ArrowLeft } from "@phosphor-icons/react/ssr";
import { apiErrorMessage } from "@codementor/api-client";
import {
  Button,
  CertificateDesignForm,
  Field,
  Input,
  Select,
  validateCertificateDesign,
  useToast,
  type CertificateDesign,
} from "@codementor/ui";
import { api, uploadCertificateImage, type CertificateTemplate } from "@/lib/api";

const SUBJECT_OPTIONS = [
  { value: "", label: "Khóa học và lộ trình" },
  { value: "course", label: "Chỉ khóa học" },
  { value: "roadmap", label: "Chỉ lộ trình" },
];

/** Soạn một mẫu chứng chỉ. Mẫu mặc định mở ở chế độ chỉ xem với giảng viên. */
export function CertificateTemplateEditor({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState<"" | "course" | "roadmap">("");
  const [design, setDesign] = useState<CertificateDesign | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.certificateTemplates.get(id).then(
      (loaded) => {
        setTemplate(loaded);
        setName(loaded.name);
        setSubject(loaded.subject ?? "");
        setDesign(loaded.design);
      },
      (cause) => setError(apiErrorMessage(cause)),
    );
  }, [id]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!template || !design) return <p className="text-sm text-muted-foreground">Đang tải...</p>;

  const invalid = validateCertificateDesign(design).errors.length > 0 || name.trim().length < 2;

  const save = async () => {
    setSaving(true);
    try {
      const saved = await api.certificateTemplates.update(id, { name: name.trim(), subject: subject || null, design });
      setTemplate(saved);
      toast.success("Đã lưu mẫu chứng chỉ");
    } catch (cause) {
      toast.error(apiErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const archive = async () => {
    if (!window.confirm(`Xóa mẫu “${template.name}”? ${template.usage} nội dung đang gắn sẽ quay về mẫu mặc định.`)) return;
    try {
      await api.certificateTemplates.archive(id);
      router.push("/certificates");
    } catch (cause) {
      toast.error(apiErrorMessage(cause));
    }
  };

  return (
    <div>
      <Link href="/certificates" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Mẫu chứng chỉ
      </Link>
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <Field label="Tên mẫu" htmlFor="template-name" className="min-w-64 flex-1">
          <Input id="template-name" value={name} maxLength={80} disabled={!template.editable} onChange={(e) => setName(e.target.value)} />
        </Field>
        {!template.isDefault && (
          <Select
            label="Dùng cho"
            value={subject}
            options={SUBJECT_OPTIONS}
            onChange={(value) => setSubject(value as "" | "course" | "roadmap")}
          />
        )}
        {template.editable && (
          <div className="flex gap-2">
            {!template.isDefault && (
              <Button variant="danger" onClick={() => void archive()}>
                Xóa
              </Button>
            )}
            <Button onClick={() => void save()} disabled={saving || invalid}>
              {saving ? "Đang lưu..." : "Lưu mẫu"}
            </Button>
          </div>
        )}
      </div>
      {!template.editable && (
        <p className="mb-4 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Đây là mẫu mặc định của nền tảng, chỉ quản trị viên sửa được. Muốn tùy biến, hãy tạo mẫu mới.
        </p>
      )}
      <CertificateDesignForm
        value={design}
        onChange={setDesign}
        subject={subject || "course"}
        disabled={!template.editable}
        onUpload={template.editable ? (kind, file) => uploadCertificateImage(id, kind, file) : undefined}
      />
    </div>
  );
}
