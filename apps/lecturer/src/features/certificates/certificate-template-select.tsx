"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiErrorMessage } from "@codementor/api-client";
import { Select, useToast } from "@codementor/ui";
import { api, type CertificateTemplate } from "@/lib/api";

/**
 * Ô "Mẫu chứng chỉ" trong studio khóa học/lộ trình. Lưu ngay khi đổi, không đợi nút Lưu của
 * studio: việc gắn mẫu không qua duyệt nội dung và không làm thay đổi bài học.
 */
export function CertificateTemplateSelect({ subject, id }: { subject: "course" | "roadmap"; id: string }) {
  const toast = useToast();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [value, setValue] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const path = subject === "course" ? "courses" : "roadmaps";

  useEffect(() => {
    Promise.all([api.certificateTemplates.list(), api.certificateTemplates.attached(path, id)])
      .then(([list, attached]) => {
        setTemplates(list.filter((t) => t.subject === null || t.subject === subject));
        setValue(attached.templateId ?? "");
        setLoaded(true);
      })
      .catch((cause) => toast.error(apiErrorMessage(cause)));
  }, [id, path, subject, toast]);

  const change = async (next: string) => {
    const previous = value;
    setValue(next);
    try {
      await api.certificateTemplates.attach(path, id, next || null);
      toast.success("Đã đổi mẫu chứng chỉ");
    } catch (cause) {
      setValue(previous);
      toast.error(apiErrorMessage(cause));
    }
  };

  const options = templates.map((t) => ({ value: t.isDefault ? "" : t.id, label: t.isDefault ? `${t.name} (mặc định)` : t.name }));
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">Mẫu chứng chỉ</p>
      <Select label="Mẫu chứng chỉ" value={value} options={loaded ? options : [{ value: "", label: "Đang tải..." }]} onChange={(next) => void change(next)} />
      <Link href="/certificates" className="mt-1 inline-block text-xs text-muted-foreground hover:text-foreground">
        Quản lý mẫu chứng chỉ
      </Link>
    </div>
  );
}
