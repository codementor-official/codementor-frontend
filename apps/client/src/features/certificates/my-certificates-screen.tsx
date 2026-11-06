"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CertificateIcon as Certificate } from "@phosphor-icons/react/ssr";
import { apiErrorMessage } from "@codementor/api-client";
import { CertificateView } from "@codementor/ui";
import { PageHeader } from "@/components/page-header";
import { CatalogueEmpty, CatalogueError, CatalogueSkeleton } from "@/components/ui/catalogue-state";
import { api, type IssuedCertificate } from "@/lib/api";

/** "Chứng chỉ của tôi" — mọi chứng chỉ đang hiệu lực, mới cấp trước. */
export function MyCertificatesScreen() {
  const [items, setItems] = useState<IssuedCertificate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.certificates.mine().then(setItems, (cause) => setError(apiErrorMessage(cause)));
  }, []);

  return (
    <div>
      <PageHeader icon={Certificate} title="Chứng chỉ" subtitle="Chứng chỉ bạn đã nhận khi hoàn thành khóa học và lộ trình." />
      {error ? (
        <CatalogueError message={error} />
      ) : !items ? (
        <CatalogueSkeleton />
      ) : items.length === 0 ? (
        <CatalogueEmpty
          icon={Certificate}
          title="Bạn chưa có chứng chỉ nào"
          description="Hoàn thành một khóa học hoặc lộ trình, rồi nhận chứng chỉ ở cuối trang chi tiết của nó."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/certificates/${item.code}`} className="block rounded-lg border border-border bg-surface p-3 transition-colors hover:border-text-faint">
                <CertificateView design={item.design} data={item.data} />
                <p className="mt-3 truncate text-sm font-semibold text-navy">{item.data.subjectTitle}</p>
                <p className="text-xs text-text-faint">
                  {item.subject === "course" ? "Khóa học" : "Lộ trình"} · {new Date(item.issuedAt).toLocaleDateString("vi-VN")} · {item.code}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
