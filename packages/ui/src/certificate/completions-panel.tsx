"use client";

import { useEffect, useState } from "react";
import { Button } from "../button";
import { Card } from "../card";
import { Input } from "../input";
import { Select } from "../select";
import { ServerPagination } from "../server-pagination";
import { CertificateDialog, type IssuedCertificate } from "./certificate-dialog";

export interface Completion {
  userId: string;
  name: string;
  email: string | null;
  startedAt: string | null;
  completedAt: string | null;
  certificate: IssuedCertificate | null;
}

export interface CompletionsQuery {
  q?: string;
  certificate?: "claimed" | "unclaimed";
  sort: "newest" | "oldest" | "name";
  page: number;
  limit: number;
}

/** `GET /certificates/completions/:subject/:id` — one page plus unfiltered totals. */
export interface CompletionsPage {
  items: Completion[];
  total: number;
  completed: number;
  claimed: number;
  page: number;
  limit: number;
}

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—";

/**
 * Learners who completed a course or roadmap, each with the certificate they claimed: search,
 * certificate filter, sort and server paging. Same panel in the lecturer studio and admin
 * pages; `load` uses the app's API client and must be stable (useCallback).
 */
export function CompletionsPanel({
  load,
  verifyBaseUrl,
}: {
  load: (query: CompletionsQuery) => Promise<CompletionsPage>;
  verifyBaseUrl?: string;
}) {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [certificate, setCertificate] = useState<"" | "claimed" | "unclaimed">("");
  const [sort, setSort] = useState<CompletionsQuery["sort"]>("newest");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CompletionsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shown, setShown] = useState<IssuedCertificate | null>(null);

  useEffect(() => {
    let live = true;
    load({ q: q || undefined, certificate: certificate || undefined, sort, page, limit })
      .then((r) => { if (live) { setData(r); setError(""); } })
      .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Không tải được danh sách."); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [load, q, certificate, sort, page, limit]);

  const filtered = Boolean(q || certificate);
  const reset = (apply: () => void) => { apply(); setPage(1); setLoading(true); };

  return (
    <div className="space-y-3">
      {data && (
        <p className="text-sm text-muted-foreground">
          {data.completed.toLocaleString("vi-VN")} học viên đã hoàn thành · {data.claimed.toLocaleString("vi-VN")} đã nhận chứng chỉ
          {filtered && ` · ${data.total.toLocaleString("vi-VN")} khớp bộ lọc`}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <form
          className="flex min-w-0 flex-1 gap-2 sm:max-w-md"
          role="search"
          onSubmit={(e) => { e.preventDefault(); reset(() => setQ(search.trim())); }}
        >
          <Input
            aria-label="Tìm học viên"
            containerClassName="flex-1"
            maxLength={100}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tên, email hoặc mã chứng chỉ"
            type="search"
            value={search}
          />
          <Button type="submit" variant="outline">Tìm</Button>
        </form>
        <Select
          label="Lọc theo chứng chỉ"
          value={certificate}
          onChange={(v) => reset(() => setCertificate(v as typeof certificate))}
          options={[
            { value: "", label: "Mọi học viên" },
            { value: "claimed", label: "Đã nhận chứng chỉ" },
            { value: "unclaimed", label: "Chưa nhận chứng chỉ" },
          ]}
        />
        <Select
          label="Sắp xếp"
          value={sort}
          onChange={(v) => reset(() => setSort(v as CompletionsQuery["sort"]))}
          options={[
            { value: "newest", label: "Hoàn thành gần nhất" },
            { value: "oldest", label: "Hoàn thành sớm nhất" },
            { value: "name", label: "Tên A–Z" },
          ]}
        />
        <Select
          label="Số dòng mỗi trang"
          value={String(limit)}
          onChange={(v) => reset(() => setLimit(Number(v)))}
          options={[10, 20, 50].map((n) => ({ value: String(n), label: `${n} / trang` }))}
        />
        {filtered && (
          <Button type="button" variant="ghost" onClick={() => reset(() => { setQ(""); setSearch(""); setCertificate(""); })}>
            Xoá bộ lọc
          </Button>
        )}
      </div>
      {error && <Card className="p-4 text-sm text-destructive" role="alert">{error}</Card>}
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm" aria-busy={loading}>
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Học viên</th>
              <th className="px-3 py-2 font-medium">Bắt đầu</th>
              <th className="px-3 py-2 font-medium">Hoàn thành</th>
              <th className="px-3 py-2 font-medium">Chứng chỉ</th>
              <th className="px-3 py-2"><span className="sr-only">Xem</span></th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-border ${loading && data ? "opacity-60" : ""}`}>
            {!data && !error && <tr><td colSpan={5} className="px-3 py-6"><div className="h-4 animate-pulse rounded bg-muted" /></td></tr>}
            {data?.items.map((r) => (
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
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  {filtered ? "Không có học viên nào khớp bộ lọc." : "Chưa có học viên nào hoàn thành."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {data && data.total > data.limit && (
          <div className="border-t px-3 py-2">
            <ServerPagination page={data.page} total={data.total} pageSize={data.limit} disabled={loading} onPageChange={(p) => { setPage(p); setLoading(true); }} />
          </div>
        )}
      </Card>
      <CertificateDialog certificate={shown} onClose={() => setShown(null)} verifyBaseUrl={verifyBaseUrl} />
    </div>
  );
}
