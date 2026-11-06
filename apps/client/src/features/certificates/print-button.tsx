"use client";

import { PrinterIcon as Printer } from "@phosphor-icons/react/ssr";

/** In đúng một trang A4 ngang — `CertificateView printable` ẩn mọi thứ khác khi in. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-on-ink hover:bg-primary-hover"
    >
      <Printer className="h-4 w-4" /> In / Lưu PDF
    </button>
  );
}
