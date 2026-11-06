import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SealCheckIcon as SealCheck, ProhibitIcon as Prohibit } from "@phosphor-icons/react/ssr";
import { CertificateView, type CertificateDesign, type CertificateRawData } from "@codementor/ui";
import { PrintButton } from "@/features/certificates/print-button";

type Verified =
  | {
      status: "valid";
      certificate: { code: string; recipientName: string; issuedAt: string; design: CertificateDesign; data: CertificateRawData };
    }
  | { status: "revoked"; code: string; revokedAt: string };

/**
 * Trang xác thực công khai (ADR 0005) — ai có mã cũng mở được, không cần đăng nhập. Nằm ngoài
 * nhóm `(app)` nên không qua `RequireAuth`, và gọi thẳng backend từ server (endpoint
 * `@Public()`), không qua BFF vì BFF đòi phiên.
 */
async function load(code: string): Promise<Verified | null> {
  const base = (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
  if (!base || !/^[0-9A-Za-z]{10}$/.test(code)) return null;
  const res = await fetch(`${base}/certificates/${encodeURIComponent(code)}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Không tải được chứng chỉ (${res.status})`);
  return ((await res.json()) as { data: Verified }).data;
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const result = await load(code).catch(() => null);
  if (result?.status !== "valid") return { title: "Chứng chỉ · CodeMentor", robots: { index: false } };
  const { recipientName, data } = result.certificate;
  return {
    title: `${recipientName} — ${data.subjectTitle} · CodeMentor`,
    description: `Chứng chỉ hoàn thành ${data.subjectKind === "course" ? "khóa học" : "lộ trình"} “${data.subjectTitle}” trên CodeMentor.`,
    robots: { index: false },
  };
}

export default async function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const result = await load(code);
  if (!result) notFound();

  return (
    <main className="min-h-dvh bg-bg px-4 py-8 sm:py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <Link href="/" className="text-sm font-bold text-navy">
          Code<span className="text-primary">Mentor</span>
        </Link>
        {result.status === "revoked" ? (
          <div className="rounded-lg border border-border bg-surface p-6">
            <p className="flex items-center gap-2 text-base font-bold text-navy">
              <Prohibit className="h-5 w-5 text-primary" /> Chứng chỉ {result.code} đã bị thu hồi
            </p>
            <p className="mt-2 text-sm text-text-muted">
              Chứng chỉ này không còn hiệu lực từ{" "}
              {new Date(result.revokedAt).toLocaleDateString("vi-VN")}. Học viên có thể đã được cấp lại với mã khác.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
              <p className="flex items-center gap-2 text-sm text-navy">
                <SealCheck weight="fill" className="h-5 w-5 text-primary" />
                Chứng chỉ hợp lệ, do CodeMentor cấp cho <strong>{result.certificate.recipientName}</strong> ngày{" "}
                {new Date(result.certificate.issuedAt).toLocaleDateString("vi-VN")}.
              </p>
              <PrintButton />
            </div>
            <CertificateView design={result.certificate.design} data={result.certificate.data} printable />
            <p className="text-xs text-text-faint">Mã xác thực: {result.certificate.code}</p>
          </>
        )}
      </div>
    </main>
  );
}
