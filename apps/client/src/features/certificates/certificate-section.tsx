"use client";

import { useEffect, useState } from "react";
import { LinkIcon, LockSimpleIcon as Lock, MedalIcon as Medal, SealCheckIcon as SealCheck } from "@phosphor-icons/react/ssr";
import { apiErrorMessage } from "@codementor/api-client";
import { CertificateView, Modal, useToast } from "@codementor/ui";
import { Button } from "@/components/ui/button";
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
 * Trên trang chỉ là một dòng huy hiệu; bấm vào mở modal. Ba trạng thái: chưa hoàn thành (mẫu mờ
 * + tiến độ), nhận được (nhập tên → xem trước → xác nhận), đã nhận (chứng chỉ + mã + liên kết
 * xác thực). Nhận chỉ một lần, nên bước xác nhận nói thẳng tên sẽ không sửa được.
 */
export function CertificateSection({ subject, subjectId }: { subject: CertificateSubject; subjectId: string }) {
  const toast = useToast();
  const [state, setState] = useState<CertificateStatus | null>(null);
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [open, setOpen] = useState(false);
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
        // The "claim your certificate" email links to `#certificate`.
        if (next.status !== "locked" && window.location.hash === "#certificate") setOpen(true);
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
  const close = () => {
    if (claiming) return;
    setOpen(false);
    setConfirming(false);
  };
  const percent = state.status === "locked" ? Math.round(state.progressPercent) : 100;
  const reward =
    state.status === "issued"
      ? {
          title: `Đã nhận chứng chỉ ${kind}`,
          detail: `${state.certificate.recipientName} · Mã ${state.certificate.code} · ${issuedDate(state.certificate.issuedAt)}`,
          action: "Xem chứng chỉ",
        }
      : state.status === "claimable"
        ? { title: "Bạn đã đủ điều kiện nhận chứng chỉ", detail: `Đã hoàn thành ${kind} này. Nhập tên để nhận.`, action: "Nhận chứng chỉ" }
        : { title: `Chứng chỉ hoàn thành ${kind}`, detail: `Đang ở ${percent}% · hoàn thành để mở khóa`, action: "Xem mẫu" };

  return (
    <section id="certificate" className="mt-8 scroll-mt-20">
      <button
        aria-haspopup="dialog"
        className={`flex w-full items-center gap-3 rounded-lg border bg-surface p-3 text-left transition-colors hover:bg-bg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
          state.status === "claimable" ? "border-primary" : "border-border hover:border-primary/50"
        }`}
        onClick={() => setOpen(true)}
        type="button"
      >
        <RewardBadge percent={percent} status={state.status} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-navy">{reward.title}</span>
          <span className="block truncate text-xs text-text-muted">{reward.detail}</span>
        </span>
        <span
          className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold ${
            state.status === "claimable" ? "bg-primary-fixed text-on-ink-fixed" : "border border-border text-navy"
          }`}
        >
          {reward.action}
        </span>
      </button>

      <Modal
        open={open}
        onClose={close}
        title={state.status === "issued" ? `Chứng chỉ ${state.certificate.code}` : `Chứng chỉ ${kind}`}
        description={(state.status === "issued" ? state.certificate.data : state.preview.data).subjectTitle}
        width="lg"
        footer={
          state.status === "issued" ? (
            <>
              <Button size="sm" variant="outline" onClick={() => void copyLink(state.certificate.code)}>
                <LinkIcon className="h-4 w-4" /> Sao chép liên kết
              </Button>
              <Button href={`/certificates/${state.certificate.code}`} size="sm">
                Xem và in chứng chỉ
              </Button>
            </>
          ) : state.status === "locked" ? (
            <Button size="sm" variant="outline" onClick={close}>
              Đóng
            </Button>
          ) : confirming ? (
            <>
              <Button size="sm" variant="outline" disabled={claiming} onClick={() => setConfirming(false)}>
                Sửa lại tên
              </Button>
              <Button size="sm" disabled={claiming} onClick={() => void claim()}>
                {claiming ? "Đang cấp..." : "Xác nhận"}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                setTouched(true);
                if (!nameError(name)) setConfirming(true);
              }}
            >
              Nhận chứng chỉ
            </Button>
          )
        }
      >
        {state.status === "issued" ? (
          <div className="space-y-4">
            <CertificateView design={state.certificate.design} data={state.certificate.data} />
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-text-faint">Người nhận</dt>
                <dd className="font-semibold text-navy">{state.certificate.recipientName}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-faint">Mã chứng chỉ</dt>
                <dd className="font-mono font-semibold text-navy">{state.certificate.code}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-faint">Ngày cấp</dt>
                <dd className="text-navy">{issuedDate(state.certificate.issuedAt)}</dd>
              </div>
            </dl>
          </div>
        ) : state.status === "locked" ? (
          <div className="space-y-3">
            <div className="relative">
              <div className="pointer-events-none opacity-40 blur-[2px] select-none" aria-hidden="true">
                <CertificateView design={state.preview.design} data={state.preview.data} />
              </div>
              <span className="absolute inset-0 m-auto flex h-11 w-11 items-center justify-center rounded-full bg-surface shadow-card">
                <Lock className="h-5 w-5 text-navy" />
              </span>
            </div>
            <p className="text-sm text-text-muted">
              Bạn đang ở {percent}%. Chứng chỉ ghi tên bạn, {kind}, ngày hoàn thành và một mã để người khác xác thực.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <CertificateView design={state.preview.design} data={{ ...state.preview.data, learnerName: normalize(name) || "—" }} />
            {confirming ? (
              <p className="rounded-md border border-border bg-bg px-3 py-2 text-sm leading-relaxed text-text" role="alert">
                Chứng chỉ sẽ được cấp cho <strong>{normalize(name)}</strong>. Mỗi {kind} chỉ nhận chứng chỉ{" "}
                <strong>một lần</strong> và tên không sửa được sau khi xác nhận.
              </p>
            ) : (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy" htmlFor="certificate-name">
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
                  <p id="certificate-name-error" className="mt-1 text-xs text-primary">
                    {error}
                  </p>
                )}
                <p className="mt-1 text-xs text-text-muted">Bản xem trước là đúng thứ sẽ được cấp. Mã chứng chỉ sinh khi xác nhận.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </section>
  );
}

/** The reward icon: a progress ring until it is earned, then a solid medal or seal. */
function RewardBadge({ status, percent }: { status: CertificateStatus["status"]; percent: number }) {
  const radius = 21;
  const circumference = 2 * Math.PI * radius;
  const Icon = status === "issued" ? SealCheck : Medal;
  const tone = status === "issued" ? "text-success" : status === "claimable" ? "text-primary" : "text-text-muted";
  return (
    <span className="relative size-12 shrink-0">
      <svg aria-hidden="true" className="size-12 -rotate-90" viewBox="0 0 48 48">
        <circle className="fill-bg stroke-border-soft" cx="24" cy="24" r={radius} strokeWidth="3" />
        <circle
          className={`fill-none ${status === "issued" ? "stroke-success" : "stroke-primary"}`}
          cx="24"
          cy="24"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.max(0, Math.min(100, percent)) / 100)}
          strokeLinecap="round"
          strokeWidth="3"
        />
      </svg>
      <Icon aria-hidden="true" className={`absolute inset-0 m-auto size-6 ${tone}`} weight={status === "locked" ? "regular" : "fill"} />
      {status === "locked" && (
        <span className="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full border border-border bg-surface">
          <Lock aria-hidden="true" className="size-3 text-text-muted" />
        </span>
      )}
    </span>
  );
}
