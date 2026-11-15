"use client";

import { useEffect, useState } from "react";
import { Button } from "../button";
import { Card } from "../card";
import { CertificateDialog, type IssuedCertificate } from "./certificate-dialog";

export interface Completion {
  userId: string;
  name: string;
  email: string | null;
  startedAt: string | null;
  completedAt: string | null;
  certificate: IssuedCertificate | null;
}

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—";

/**
 * Learners who completed a course or roadmap, each with the certificate they claimed.
 * Same panel in the lecturer studio and the admin course page; `load` uses the app's API client.
 */
export function CompletionsPanel({ load, verifyBaseUrl }: { load: () => Promise<Completion[]>; verifyBaseUrl?: string }) {
  const [rows, setRows] = useState<Completion[] | null>(null);
  const [error, setError] = useState("");
  const [shown, setShown] = useState<IssuedCertificate | null>(null);
  useEffect(() => {
    let live = true;
    load()
      .then((r) => { if (live) setRows(r); })
      .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Không tải được danh sách."); });
    return () => { live = false; };
  }, [load]);

  const claimed = rows?.filter((r) => r.certificate).length ?? 0;
  return (
    <div className="space-y-3">
      {rows && (
        <p className="text-sm text-muted-foreground">
          {rows.length.toLocaleString("vi-VN")} học viên đã hoàn thành · {claimed.toLocaleString("vi-VN")} đã nhận chứng chỉ
        </p>
      )}
      {error && <Card className="p-4 text-sm text-destructive" role="alert">{error}</Card>}
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Học viên</th>
              <th className="px-3 py-2 font-medium">Bắt đầu</th>
              <th className="px-3 py-2 font-medium">Hoàn thành</th>
              <th className="px-3 py-2 font-medium">Chứng chỉ</th>
              <th className="px-3 py-2"><span className="sr-only">Xem</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!rows && !error && <tr><td colSpan={5} className="px-3 py-6"><div className="h-4 animate-pulse rounded bg-muted" /></td></tr>}
            {rows?.map((r) => (
              <tr key={r.userId} className="hover:bg-muted/30">
                <td className="px-3 py-2">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.email ?? "—"}</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{when(r.startedAt)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{when(r.completedAt)}</td>
                <td className="px-3 py-2">
                  {r.certificate ? <span className="font-mono text-xs">{r.certificate.code}</span> : <span className="text-xs text-muted-foreground">Chưa nhận</span>}
                </td>
                <td className="px-3 py-2 text-right">
                  {r.certificate && (
                    <Button size="sm" variant="outline" onClick={() => setShown(r.certificate)}>Xem chứng chỉ</Button>
                  )}
                </td>
              </tr>
            ))}
            {rows?.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Chưa có học viên nào hoàn thành.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
      <CertificateDialog certificate={shown} onClose={() => setShown(null)} verifyBaseUrl={verifyBaseUrl} />
    </div>
  );
}
