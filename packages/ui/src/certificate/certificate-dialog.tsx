"use client";

import { Modal } from "../modal";
import { CertificateView } from "./certificate-view";
import type { CertificateDesign, CertificateRawData } from "./design";

export interface IssuedCertificate {
  id: string;
  code: string;
  recipientName: string;
  design: CertificateDesign;
  data: CertificateRawData;
  issuedAt: string;
  revokedAt?: string | null;
  revokeReason?: string | null;
}

const day = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

/** A certificate as the learner received it, with its code, dates and the public check link. */
export function CertificateDialog({
  certificate,
  onClose,
  verifyBaseUrl,
}: {
  certificate: IssuedCertificate | null;
  onClose: () => void;
  /** Client origin; the public check page is `${verifyBaseUrl}/certificates/${code}`. */
  verifyBaseUrl?: string;
}) {
  const c = certificate;
  const verify = c && verifyBaseUrl ? `${verifyBaseUrl.replace(/\/+$/, "")}/certificates/${c.code}` : null;
  return (
    <Modal
      open={c !== null}
      onClose={onClose}
      title={c ? `Chứng chỉ ${c.code}` : "Chứng chỉ"}
      description={c ? `${c.recipientName} · ${c.data.subjectTitle}` : undefined}
      width="lg"
    >
      {c && (
        <div className="space-y-4">
          <CertificateView design={c.design} data={c.data} />
          <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            <div><dt className="text-xs text-muted-foreground">Mã</dt><dd className="font-mono">{c.code}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Ngày cấp</dt><dd>{day(c.issuedAt)}</dd></div>
            <div>
              <dt className="text-xs text-muted-foreground">Trạng thái</dt>
              <dd>{c.revokedAt ? <span title={c.revokeReason ?? undefined}>Đã thu hồi {day(c.revokedAt)}</span> : <span className="font-medium text-success">Hiệu lực</span>}</dd>
            </div>
            {c.revokeReason && <div className="sm:col-span-3"><dt className="text-xs text-muted-foreground">Lý do thu hồi</dt><dd>{c.revokeReason}</dd></div>}
          </dl>
          {verify && (
            <p className="text-xs text-muted-foreground">
              Trang xác thực công khai:{" "}
              <a className="text-primary underline underline-offset-4" href={verify} rel="noreferrer" target="_blank">{verify}</a>
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
