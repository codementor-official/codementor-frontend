"use client";

import { useState } from "react";

// Bank logos from https://api.vietqr.io/v2/banks. Keep our persisted bank codes.
const LOGOS: Record<string, string> = {
  VCB: "https://cdn.vietqr.io/img/VCB.png",
  BIDV: "https://cdn.vietqr.io/img/BIDV.png",
  CTG: "https://cdn.vietqr.io/img/ICB.png",
  TCB: "https://cdn.vietqr.io/img/TCB.png",
  MBB: "https://cdn.vietqr.io/img/MB.png",
  ACB: "https://cdn.vietqr.io/img/ACB.png",
  VPB: "https://cdn.vietqr.io/img/VPB.png",
  TPB: "https://cdn.vietqr.io/img/TPB.png",
  STB: "https://cdn.vietqr.io/img/STB.png",
  // Ví: file cục bộ do scripts/convert-payment-logos.sh sinh ra.
  momo: "/payments/momo.webp",
  vnpay: "/payments/vnpay.webp",
};

export function BankLogo({ code, fallback }: { code: string; fallback: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = LOGOS[code];
  return <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg border bg-background p-1 text-xs font-semibold">
    {source && failedSource !== source
      // Verified fixed CDN addresses, with a text fallback if the CDN is unavailable.
      // eslint-disable-next-line @next/next/no-img-element
      ? <img alt={code} src={source} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" onError={() => setFailedSource(source)} />
      : fallback}
  </span>;
}
