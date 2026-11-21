"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CertificateIcon as Certificate,
  CopyIcon as Copy,
  MagnifyingGlassIcon as Search,
  SealCheckIcon as SealCheck,
} from "@phosphor-icons/react/ssr";
import { apiErrorMessage } from "@codementor/api-client";
import { CertificateView, Input, Select, StatStrip, ViewToggle, useToast, useUrlState, type ViewMode } from "@codementor/ui";
import { formatVnDate } from "@codementor/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { CatalogueEmpty, CatalogueError, CatalogueSkeleton } from "@/components/ui/catalogue-state";
import { Pagination } from "@/components/ui/pagination";
import { api, type IssuedCertificate } from "@/lib/api";
import { certificateYears, filterCertificates, type CertificateFilter, type CertificateSort } from "./certificate-list";

const PAGE_SIZE = 12;
const SUBJECT = { course: "Khóa học", roadmap: "Lộ trình" } as const;
const day = (iso: string | null) => (iso ? formatVnDate(iso) : "—");
const hours = (value: number | null) => (value ? `${value} giờ` : "—");

/** "Chứng chỉ của tôi": every valid certificate, searchable, as cards or as a table. */
export function MyCertificatesScreen() {
  const toast = useToast();
  const [items, setItems] = useState<IssuedCertificate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useUrlState("q", "");
  const [subject, setSubject] = useUrlState<CertificateFilter["subject"]>("type", "");
  const [year, setYear] = useUrlState("year", "");
  const [sort, setSort] = useUrlState<CertificateSort>("sort", "newest");
  const [view, setView] = useUrlState<ViewMode>("view", "grid");
  const [page, setPage] = useUrlState("page", 1);

  useEffect(() => {
    api.certificates.mine().then(setItems, (cause) => setError(apiErrorMessage(cause)));
  }, []);

  const shown = useMemo(() => filterCertificates(items ?? [], { q, subject, year, sort }), [items, q, subject, year, sort]);
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filtered = Boolean(q || subject || year);

  const copyLink = async (code: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/certificates/${code}`);
      toast.success("Đã sao chép liên kết xác thực");
    } catch {
      toast.error("Không sao chép được liên kết");
    }
  };

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
        <div className="space-y-4">
          <StatStrip
            stats={[
              { label: "Chứng chỉ", value: items.length },
              { label: "Khóa học", value: items.filter((c) => c.subject === "course").length },
              { label: "Lộ trình", value: items.filter((c) => c.subject === "roadmap").length },
              { label: "Tổng giờ học", value: `${items.reduce((sum, c) => sum + (c.data.durationHours ?? 0), 0)} giờ` },
            ]}
          />

          <div className="flex flex-wrap items-center gap-2" role="search">
            <Input
              aria-label="Tìm chứng chỉ"
              containerClassName="min-w-56 flex-1"
              icon={<Search />}
              maxLength={100}
              onChange={(event) => { setQ(event.target.value); setPage(1); }}
              placeholder="Tìm theo tên khóa học, lộ trình, giảng viên hoặc mã"
              type="search"
              value={q}
            />
            <Select
              label="Lọc theo loại"
              value={subject}
              onChange={(value) => { setSubject(value as CertificateFilter["subject"]); setPage(1); }}
              options={[{ value: "", label: "Mọi loại" }, { value: "course", label: "Khóa học" }, { value: "roadmap", label: "Lộ trình" }]}
            />
            <Select
              label="Lọc theo năm cấp"
              value={year}
              onChange={(value) => { setYear(value); setPage(1); }}
              options={[{ value: "", label: "Mọi năm" }, ...certificateYears(items).map((y) => ({ value: y, label: `Năm ${y}` }))]}
            />
            <Select
              label="Sắp xếp"
              value={sort}
              onChange={(value) => { setSort(value as CertificateSort); setPage(1); }}
              options={[{ value: "newest", label: "Mới nhất" }, { value: "oldest", label: "Cũ nhất" }, { value: "title", label: "Tên A–Z" }]}
            />
            {filtered && (
              <Button size="sm" variant="ghost" onClick={() => { setQ(""); setSubject(""); setYear(""); setPage(1); }}>
                Xoá bộ lọc
              </Button>
            )}
            <div className="ml-auto"><ViewToggle mode={view} onChange={setView} /></div>
          </div>

          {shown.length === 0 ? (
            <CatalogueEmpty icon={Search} title="Không có chứng chỉ phù hợp" description="Thử từ khóa khác hoặc bỏ bớt bộ lọc." />
          ) : view === "grid" ? (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((item) => <li key={item.id}><CertificateCard item={item} onCopy={copyLink} /></li>)}
            </ul>
          ) : (
            <CertificateTable items={rows} onCopy={copyLink} />
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-text-faint">
              {shown.length === 0 ? "" : `${(current - 1) * PAGE_SIZE + 1}–${Math.min(current * PAGE_SIZE, shown.length)} trên ${shown.length} chứng chỉ`}
            </p>
            <Pagination label="Phân trang chứng chỉ" onChange={setPage} page={current} pageCount={pageCount} />
          </div>
        </div>
      )}
    </div>
  );
}

/** The real certificate, scaled down. Decorative here: the text beside it says the same. */
function Thumbnail({ item }: { item: IssuedCertificate }) {
  return (
    <div aria-hidden="true" className="pointer-events-none overflow-hidden rounded-sm shadow-md ring-1 ring-border">
      <CertificateView data={item.data} design={item.design} />
    </div>
  );
}

function SubjectBadge({ subject }: { subject: IssuedCertificate["subject"] }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
      {SUBJECT[subject]}
    </span>
  );
}

function CopyButton({ code, onCopy }: { code: string; onCopy: (code: string) => void }) {
  return (
    <button
      aria-label={`Sao chép liên kết xác thực của chứng chỉ ${code}`}
      className="rounded-md border border-border p-1.5 text-text-muted transition-colors hover:bg-bg hover:text-navy"
      onClick={() => onCopy(code)}
      title="Sao chép liên kết xác thực"
      type="button"
    >
      <Copy aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}

function CertificateCard({ item, onCopy }: { item: IssuedCertificate; onCopy: (code: string) => void }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-primary/50">
      <Link aria-label={`Xem chứng chỉ ${item.data.subjectTitle}`} className="block border-b border-border-soft bg-bg p-4" href={`/certificates/${item.code}`}>
        <Thumbnail item={item} />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <SubjectBadge subject={item.subject} />
          <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
            <SealCheck aria-hidden="true" className="h-4 w-4" weight="fill" /> Hợp lệ
          </span>
        </div>
        <h2 className="mt-2 line-clamp-2 min-h-10 text-sm font-bold text-navy" title={item.data.subjectTitle}>{item.data.subjectTitle}</h2>
        <p className="mt-0.5 truncate text-xs text-text-muted">Giảng viên: {item.data.instructorName}</p>
        <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-border-soft pt-3 text-xs">
          <div><dt className="text-text-faint">Hoàn thành</dt><dd className="mt-0.5 font-semibold text-navy">{day(item.data.completedAt)}</dd></div>
          <div><dt className="text-text-faint">Thời lượng</dt><dd className="mt-0.5 font-semibold text-navy">{hours(item.data.durationHours)}</dd></div>
          <div><dt className="text-text-faint">Ngày cấp</dt><dd className="mt-0.5 font-semibold text-navy">{day(item.issuedAt)}</dd></div>
        </dl>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="truncate font-mono text-xs text-text-muted">{item.code}</span>
          <div className="flex shrink-0 items-center gap-1.5">
            <CopyButton code={item.code} onCopy={onCopy} />
            <Button href={`/certificates/${item.code}`} size="sm" variant="outline">Xem</Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function CertificateTable({ items, onCopy }: { items: IssuedCertificate[]; onCopy: (code: string) => void }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="bg-bg text-left text-xs text-text-muted">
          <tr>
            <th className="px-3 py-2.5 font-medium" scope="col">Chứng chỉ</th>
            <th className="px-3 py-2.5 font-medium" scope="col">Giảng viên</th>
            <th className="px-3 py-2.5 font-medium" scope="col">Hoàn thành</th>
            <th className="px-3 py-2.5 font-medium" scope="col">Thời lượng</th>
            <th className="px-3 py-2.5 font-medium" scope="col">Ngày cấp</th>
            <th className="px-3 py-2.5 font-medium" scope="col">Mã</th>
            <th className="px-3 py-2.5" scope="col"><span className="sr-only">Thao tác</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-soft">
          {items.map((item) => (
            <tr className="transition-colors hover:bg-bg" key={item.id}>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-20 shrink-0"><Thumbnail item={item} /></div>
                  <div className="min-w-0">
                    <Link className="line-clamp-2 max-w-72 font-semibold text-navy hover:text-primary" href={`/certificates/${item.code}`}>{item.data.subjectTitle}</Link>
                    <div className="mt-1"><SubjectBadge subject={item.subject} /></div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2.5 text-text-muted">{item.data.instructorName}</td>
              <td className="px-3 py-2.5 whitespace-nowrap text-text-muted">{day(item.data.completedAt)}</td>
              <td className="px-3 py-2.5 whitespace-nowrap text-text-muted">{hours(item.data.durationHours)}</td>
              <td className="px-3 py-2.5 whitespace-nowrap text-text-muted">{day(item.issuedAt)}</td>
              <td className="px-3 py-2.5 font-mono text-xs text-text-muted">{item.code}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center justify-end gap-1.5">
                  <CopyButton code={item.code} onCopy={onCopy} />
                  <Button href={`/certificates/${item.code}`} size="sm" variant="outline">Xem</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
