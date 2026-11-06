"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CertificateIcon as Certificate, PlusIcon as Plus } from "@phosphor-icons/react/ssr";
import { apiErrorMessage } from "@codementor/api-client";
import {
  Button,
  CertificateView,
  DEFAULT_CERTIFICATE_DESIGN,
  PageHeader,
  sampleCertificateData,
  useToast,
} from "@codementor/ui";
import { api, type CertificateTemplate } from "@/lib/api";

const SUBJECT_LABEL = { course: "Khóa học", roadmap: "Lộ trình" } as const;

/** Danh sách mẫu chứng chỉ: mẫu mặc định của nền tảng (chỉ đọc) và mẫu của giảng viên. */
export function CertificateTemplatesScreen() {
  const router = useRouter();
  const toast = useToast();
  const [templates, setTemplates] = useState<CertificateTemplate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.certificateTemplates.list().then(setTemplates, (cause) => setError(apiErrorMessage(cause)));
  }, []);

  const create = async () => {
    setCreating(true);
    try {
      const created = await api.certificateTemplates.create({
        name: "Mẫu chứng chỉ mới",
        subject: null,
        design: DEFAULT_CERTIFICATE_DESIGN,
      });
      router.push(`/certificates/${created.id}`);
    } catch (cause) {
      toast.error(apiErrorMessage(cause));
      setCreating(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={Certificate}
        title="Chứng chỉ"
        description="Học viên hoàn thành khóa học hoặc lộ trình được nhận chứng chỉ theo mẫu gắn với nội dung đó. Chưa gắn mẫu nào thì dùng mẫu mặc định của nền tảng."
        action={
          <Button onClick={() => void create()} disabled={creating}>
            <Plus className="h-4 w-4" /> {creating ? "Đang tạo..." : "Tạo mẫu"}
          </Button>
        }
      />
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      {!templates && !error && <p className="mt-4 text-sm text-muted-foreground">Đang tải...</p>}
      {templates && (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <li key={template.id}>
              <Link
                href={`/certificates/${template.id}`}
                className="block rounded-lg border border-border bg-card p-3 transition-colors hover:border-foreground"
              >
                <CertificateView design={template.design} data={sampleCertificateData(template.subject ?? "course")} />
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{template.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {template.subject ? SUBJECT_LABEL[template.subject] : "Khóa học và lộ trình"}
                      {template.isDefault ? "" : ` · đang gắn ${template.usage} nội dung`}
                    </p>
                  </div>
                  {template.isDefault && (
                    <span className="shrink-0 rounded-sm bg-muted px-2 py-0.5 text-2xs font-semibold">Mặc định</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
