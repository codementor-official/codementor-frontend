"use client";

import { useCallback, useEffect, useState } from "react";
import { apiErrorMessage } from "@codementor/api-client";
import { FileXlsIcon as FileXls } from "@phosphor-icons/react/ssr";
import { Button, Input, ReasonButton, downloadIssuedCertificatesXlsx, useToast } from "@codementor/ui";
import { collectAllPages } from "@codementor/utils";
import { useAdminApi } from "@/features/auth/admin-api";
import { certificatesApi, type AdminCertificate } from "@/lib/api";

const PAGE_SIZE = 20;
const day = (iso: string) => new Date(iso).toLocaleDateString("vi-VN");

/**
 * Chứng chỉ đã cấp. Thu hồi là cách sửa tên in sai: học viên nhận lại được ngay sau đó (unique
 * index chỉ tính chứng chỉ chưa thu hồi). Lý do lưu trên chính chứng chỉ.
 */
export function IssuedCertificates() {
  const request = useAdminApi();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: AdminCertificate[]; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    certificatesApi.issued(request, { q: query, page }).then(setData, (cause) => setError(apiErrorMessage(cause)));
  }, [request, query, page]);
  useEffect(load, [load]);

  const revoke = async (row: AdminCertificate, reason: string) => {
    try {
      await certificatesApi.revoke(request, row.id, reason);
      toast.success(`Đã thu hồi ${row.code}. Học viên có thể nhận lại chứng chỉ.`);
      load();
    } catch (cause) {
      toast.error(apiErrorMessage(cause));
    }
  };

  // Xuất theo bộ lọc đang áp dụng (không phải chữ đang gõ dở), tối đa 5000 dòng.
  const [exporting, setExporting] = useState(false);
  const exportXlsx = async () => {
    setExporting(true);
    try {
      const all = await collectAllPages(async (next) => ({
        ...(await certificatesApi.issued(request, { q: query, page: next, limit: 100 })),
        limit: 100,
      }));
      await downloadIssuedCertificatesXlsx({ rows: all.items, query, total: all.total });
      if (all.truncated) toast.error(`Chỉ xuất ${all.items.length}/${all.total} chứng chỉ — hãy thu hẹp bộ lọc.`);
    } catch (cause) {
      toast.error(apiErrorMessage(cause));
    } finally {
      setExporting(false);
    }
  };

  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));
  return (
    <div className="mt-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <form
          className="flex max-w-xl flex-1 gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setQuery(q.trim());
          }}
        >
          <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Mã, tên in, email hoặc tên khóa/lộ trình" containerClassName="flex-1" />
          <Button type="submit" variant="outline">
            Tìm
          </Button>
        </form>
        <Button type="button" variant="outline" className="ml-auto" disabled={!data?.total || exporting} onClick={() => void exportXlsx()}>
          <FileXls className="size-4" aria-hidden /> {exporting ? "Đang tạo file…" : "Xuất Excel"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Mã</th>
              <th className="px-3 py-2 font-medium">Người nhận</th>
              <th className="px-3 py-2 font-medium">Nội dung</th>
              <th className="px-3 py-2 font-medium">Ngày cấp</th>
              <th className="px-3 py-2 font-medium">Trạng thái</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data?.items.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2 font-mono text-xs">{row.code}</td>
                <td className="px-3 py-2">
                  <div className="font-medium">{row.recipientName}</div>
                  <div className="text-xs text-muted-foreground">{row.email ?? "—"}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="max-w-64 truncate">{row.data.subjectTitle}</div>
                  <div className="text-xs text-muted-foreground">{row.subject === "course" ? "Khóa học" : "Lộ trình"}</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{day(row.issuedAt)}</td>
                <td className="px-3 py-2">
                  {row.revokedAt ? (
                    <span title={row.revokeReason ?? undefined} className="text-xs text-muted-foreground">
                      Đã thu hồi {day(row.revokedAt)}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-success">Hiệu lực</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {!row.revokedAt && (
                    <ReasonButton
                      confirmLabel="Thu hồi"
                      title={`Thu hồi chứng chỉ ${row.code}?`}
                      description={`Chứng chỉ của ${row.recipientName} sẽ hết hiệu lực và trang xác thực báo “đã thu hồi”. Học viên có thể nhận lại ngay sau đó.`}
                      placeholder="Ví dụ: in sai tên, học viên yêu cầu cấp lại"
                      onConfirm={(reason) => revoke(row, reason)}
                      variant="ghost"
                    >
                      Thu hồi
                    </ReasonButton>
                  )}
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Chưa có chứng chỉ nào{query ? " khớp" : ""}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{data ? `${data.total} chứng chỉ` : "Đang tải..."}</span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Trước
          </Button>
          <span>
            {page}/{pages}
          </span>
          <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
