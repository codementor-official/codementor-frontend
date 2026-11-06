"use client";

import { useEffect, useState } from "react";
import { CertificateIcon as Certificate, LinkIcon, LockSimpleIcon as Lock } from "@phosphor-icons/react/ssr";
import { apiErrorMessage } from "@codementor/api-client";
import { CertificateView, Modal, useToast } from "@codementor/ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, type CertificateStatus, type CertificateSubject } from "@/lib/api";

/** Cùng luật với backend `normalizeRecipientName` — chặn trước để khỏi một vòng gọi API. */
const NAME = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;
const normalize = (value: string) => value.normalize("NFC").trim().replace(/\s+/g, " ");
const nameError = (value: string) => {
  const name = normalize(value);
  if (name.length < 2 || name.length > 80) return "Tên dài 2–80 ký tự.";
  if (!NAME.test(name)) return "Chỉ dùng chữ cái, khoảng trắng và . ' -";
  return null;
};

const issuedDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

/**
 * Mục "Chứng chỉ" (`#certificate`) trên trang chi tiết khóa học và lộ trình (ADR 0005).
 *
 * Ba trạng thái: chưa hoàn thành (mẫu mờ + tiến độ), nhận được (nhập tên → xem trước → xác
 * nhận), đã nhận (chứng chỉ + mã + liên kết xác thực). Nhận chỉ một lần, nên bước xác nhận nói
 * thẳng tên sẽ không sửa được.
 */
export function CertificateSection({ subject, subjectId }: { subject: CertificateSubject; subjectId: string }) {
  const toast = useToast();
  const [state, setState] = useState<CertificateStatus | null>(null);
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const kind = subject === "course" ? "khóa học" : "lộ trình";

  useEffect(() => {
    let active = true;
    api.certificates.status(subject, subjectId).then(
      (next) => {
        if (!active) return;
        setState(next);
        if (next.status !== "issued") setName(next.preview.data.learnerName);
      },
      // Lỗi tải chứng chỉ không được làm hỏng cả trang khóa học: chỉ ẩn mục này.
      () => active && setState(null),
    );
    return () => {
      active = false;
    };
  }, [subject, subjectId]);

  if (!state) return null;

  const claim = async () => {
    setClaiming(true);
    try {
      setState(await api.certificates.claim(subject, subjectId, normalize(name)));
      setConfirming(false);
      toast.success("Chúc mừng! Chứng chỉ đã được cấp.");
    } catch (cause) {
      toast.error(apiErrorMessage(cause));
    } finally {
      setClaiming(false);
    }
  };

  const copyLink = async (code: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/certificates/${code}`);
      toast.success("Đã sao chép liên kết xác thực");
    } catch {
      toast.error("Không sao chép được — hãy mở trang chứng chỉ và sao chép địa chỉ.");
    }
  };

  const error = touched ? nameError(name) : null;

  return (
    <section id="certificate" className="mt-8 scroll-mt-20">
      <h2 className="mb-3 flex items-center gap-1.5 text-base font-bold text-navy">
        <Certificate className="h-4 w-4 text-primary" /> Chứng chỉ
      </h2>
      <Card className="p-4">
        {state.status === "issued" ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center">
            <CertificateView design={state.certificate.design} data={state.certificate.data} />
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-navy">Bạn đã nhận chứng chỉ {kind} này.</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-text-faint">Người nhận</dt>
                <dd className="font-semibold text-navy">{state.certificate.recipientName}</dd>
                <dt className="text-text-faint">Mã chứng chỉ</dt>
                <dd className="font-mono font-semibold text-navy">{state.certificate.code}</dd>
                <dt className="text-text-faint">Ngày cấp</dt>
                <dd className="text-navy">{issuedDate(state.certificate.issuedAt)}</dd>
              </dl>
              <div className="flex flex-wrap gap-2">
                <Button href={`/certificates/${state.certificate.code}`} size="sm">
                  Xem và in chứng chỉ
                </Button>
                <Button size="sm" variant="outline" onClick={() => void copyLink(state.certificate.code)}>
                  <LinkIcon className="h-4 w-4" /> Sao chép liên kết
                </Button>
              </div>
            </div>
          </div>
        ) : state.status === "locked" ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center">
            <div className="relative">
              <div className="pointer-events-none opacity-40 blur-[2px] select-none" aria-hidden="true">
                <CertificateView design={state.preview.design} data={state.preview.data} />
              </div>
              <span className="absolute inset-0 m-auto flex h-11 w-11 items-center justify-center rounded-full bg-surface shadow-card">
                <Lock className="h-5 w-5 text-navy" />
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-navy">Hoàn thành {kind} để nhận chứng chỉ</p>
              <p className="mt-1 text-sm text-text-muted">
                Bạn đang ở {Math.round(state.progressPercent)}%. Chứng chỉ ghi tên bạn, {kind}, ngày hoàn thành và một mã
                để người khác xác thực.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
            <CertificateView design={state.preview.design} data={{ ...state.preview.data, learnerName: normalize(name) || "—" }} />
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-navy">Bạn đã hoàn thành {kind} — nhận chứng chỉ ngay.</p>
              <label className="text-sm font-medium text-navy" htmlFor="certificate-name">
                Tên in trên chứng chỉ
              </label>
              <input
                id="certificate-name"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-navy"
                value={name}
                maxLength={80}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "certificate-name-error" : undefined}
                onBlur={() => setTouched(true)}
                onChange={(event) => setName(event.target.value)}
              />
              {error && (
                <p id="certificate-name-error" className="text-xs text-primary">
                  {error}
                </p>
              )}
              <p className="text-xs text-text-muted">Bản xem trước bên cạnh là đúng thứ sẽ được cấp. Mã chứng chỉ sinh khi xác nhận.</p>
              <Button
                onClick={() => {
                  setTouched(true);
                  if (!nameError(name)) setConfirming(true);
                }}
              >
                Nhận chứng chỉ
              </Button>
            </div>
          </div>
        )}
      </Card>

      {confirming && (
        <Modal
          open
          onClose={() => !claiming && setConfirming(false)}
          title="Xác nhận nhận chứng chỉ"
          width="sm"
          footer={
            <>
              <Button size="sm" variant="outline" disabled={claiming} onClick={() => setConfirming(false)}>
                Sửa lại tên
              </Button>
              <Button size="sm" disabled={claiming} onClick={() => void claim()}>
                {claiming ? "Đang cấp..." : "Xác nhận"}
              </Button>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-text">
            Chứng chỉ sẽ được cấp cho <strong>{normalize(name)}</strong>. Mỗi {kind} chỉ nhận chứng chỉ{" "}
            <strong>một lần</strong> và tên không sửa được sau khi xác nhận.
          </p>
        </Modal>
      )}
    </section>
  );
}
