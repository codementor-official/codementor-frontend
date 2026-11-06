"use client";

import { useCallback, useEffect, useState } from "react";
import { CertificateIcon as Certificate } from "@phosphor-icons/react/ssr";
import { apiErrorMessage } from "@codementor/api-client";
import {
  Button,
  CertificateDesignForm,
  PageHeader,
  SegmentedTabs,
  useToast,
  validateCertificateDesign,
  type CertificateDesign,
} from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import { certificatesApi, type CertificateTemplate } from "@/lib/api";

const TABS = [{ value: "default", label: "Mẫu mặc định" }];

/**
 * Chứng chỉ của nền tảng. Mẫu mặc định áp cho mọi khóa học và lộ trình chưa gắn mẫu riêng,
 * nên mỗi lần lưu là đổi chứng chỉ cấp MỚI của cả nền tảng — chứng chỉ đã cấp giữ nguyên bản chụp.
 */
export function CertificatesPage() {
  const request = useAdminApi();
  const toast = useToast();
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [design, setDesign] = useState<CertificateDesign | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    certificatesApi.templates(request).then(
      (list) => {
        const fallback = list.find((t) => t.isDefault) ?? null;
        setTemplate(fallback);
        setDesign(fallback?.design ?? null);
      },
      (cause) => setError(apiErrorMessage(cause)),
    );
  }, [request]);

  const upload = useCallback(
    (kind: "logo" | "signature", file: File) => certificatesApi.uploadImage(request, template!.id, kind, file),
    [request, template],
  );

  const save = async () => {
    if (!template || !design) return;
    setSaving(true);
    try {
      setTemplate(await certificatesApi.updateTemplate(request, template.id, { name: template.name, subject: null, design }));
      toast.success("Đã lưu mẫu mặc định. Chứng chỉ cấp từ bây giờ dùng thiết kế mới.");
    } catch (cause) {
      toast.error(apiErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={Certificate}
        title="Chứng chỉ"
        description="Mẫu mặc định áp cho mọi khóa học và lộ trình chưa gắn mẫu riêng. Chứng chỉ đã cấp không đổi theo."
        center={<SegmentedTabs options={TABS} value="default" onChange={() => undefined} />}
        action={
          <Button onClick={() => void save()} disabled={saving || !design || validateCertificateDesign(design).errors.length > 0}>
            {saving ? "Đang lưu..." : "Lưu mẫu mặc định"}
          </Button>
        }
      />
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      {design && template && (
        <div className="mt-4">
          <CertificateDesignForm value={design} onChange={setDesign} onUpload={upload} />
        </div>
      )}
    </div>
  );
}
