/**
 * Numbered pagination for plain lists.
 *
 * Two hand-rolled copies existed — one inline in /practice, one inside RoadmapList — with
 * the same buttons and different markup. `TablePagination` in @codementor/ui does not
 * cover these: it is bound to a TanStack table instance, and neither of these lists is one.
 */
export function Pagination({
  page,
  pageCount,
  onChange,
  label,
  className = "",
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  /** Names the list for screen readers, e.g. "Phân trang bài tập". */
  label: string;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  const step = (delta: number) => onChange(Math.min(pageCount, Math.max(1, page + delta)));

  return (
    <nav
      aria-label={label}
      className={`flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <span className="text-xs text-text-faint">
        Trang {page} / {pageCount}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => step(-1)}
          className="rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
        >
          Trước
        </button>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            aria-current={value === page ? "page" : undefined}
            className={`h-8 min-w-8 rounded-md px-2 text-xs font-semibold transition-colors ${
              value === page ? "bg-navy text-on-ink" : "text-text-muted hover:bg-bg"
            }`}
          >
            {value}
          </button>
        ))}
        <button
          type="button"
          disabled={page === pageCount}
          onClick={() => step(1)}
          className="rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau
        </button>
      </div>
    </nav>
  );
}
