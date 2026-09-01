"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bookmark,
  BookOpen,
  CalendarDays,
  Dumbbell,
  ExternalLink,
  FileText,
  Grid2X2,
  List,
  Loader2,
  Map,
  SearchX,
  Trash2,
} from "lucide-react";
import { FilterBar, SegmentedTabs, Select, useToast } from "@codementor/ui";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { api } from "@/lib/api";
import type { BookmarkSort, BookmarkTarget, UserBookmark } from "@/features/account/types";

type ContentFilter = "all" | BookmarkTarget;
type ViewMode = "cards" | "table";

const TYPE_OPTIONS: Array<{ value: ContentFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "COURSE", label: "Khóa học" },
  { value: "ROADMAP", label: "Lộ trình" },
  { value: "EXERCISE", label: "Bài tập" },
  { value: "POST", label: "Bài viết" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Lưu gần đây nhất" },
  { value: "oldest", label: "Lưu lâu nhất" },
  { value: "title", label: "Tên A–Z" },
];

const TYPE_META: Record<BookmarkTarget, {
  label: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}> = {
  COURSE: { label: "Khóa học", icon: BookOpen, accent: "bg-primary-tint text-primary" },
  ROADMAP: { label: "Lộ trình", icon: Map, accent: "bg-border-soft text-navy" },
  EXERCISE: { label: "Bài tập", icon: Dumbbell, accent: "bg-success-tint text-success" },
  POST: { label: "Bài viết", icon: FileText, accent: "bg-warning/10 text-warning" },
};

const savedDate = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default function SavedPage() {
  const toast = useToast();
  const [type, setType] = useState<ContentFilter>("all");
  const [sort, setSort] = useState<BookmarkSort>("newest");
  const [view, setView] = useState<ViewMode>("cards");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<UserBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestVersion = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const result = await api.account.bookmarks({
        type: type === "all" ? undefined : type,
        q: debouncedSearch || undefined,
        sort,
        page,
        limit: 12,
      });
      if (version !== requestVersion.current) return;
      setPageCount(Math.max(result.totalPages, 1));
      setTotal(result.total);
      setItems(result.items);
    } catch (cause) {
      if (version !== requestVersion.current) return;
      setError(cause instanceof Error ? cause.message : "Không tải được nội dung đã lưu.");
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [debouncedSearch, page, sort, type]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const remove = async (item: UserBookmark) => {
    setRemovingId(item.id);
    try {
      await api.account.removeBookmark(item.targetType, item.targetId);
      window.dispatchEvent(new CustomEvent("bookmark-changed", {
        detail: { targetType: item.targetType, targetId: item.targetId, saved: false },
      }));
      toast.success(`Đã bỏ “${titleOf(item)}” khỏi danh sách.`);
      if (items.length === 1 && page > 1) setPage((current) => current - 1);
      else await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Không thể bỏ lưu nội dung này.");
    } finally {
      setRemovingId(null);
    }
  };

  const tabs = useMemo(
    () => TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
    [],
  );

  return (
    <div>
      <PageHeader
        icon={Bookmark}
        title="Đã lưu"
        subtitle="Thư viện cá nhân để bạn quay lại khóa học, lộ trình, bài tập và bài viết quan trọng."
        actions={<ViewSwitch value={view} onChange={setView} />}
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedTabs
          value={type}
          options={tabs}
          onChange={(value) => {
            setType(value as ContentFilter);
            setPage(1);
          }}
        />
        <p className="text-xs text-text-faint">
          {loading ? "Đang cập nhật thư viện…" : `${total} nội dung phù hợp`}
        </p>
      </div>

      <FilterBar
        className="mb-5"
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Tìm theo tên, mô tả hoặc tác giả..."
        activeFilterCount={(type === "all" ? 0 : 1) + (sort === "newest" ? 0 : 1)}
        controls={
          <Select
            label="Sắp xếp"
            value={sort}
            options={SORT_OPTIONS}
            onChange={(value) => {
              setSort(value as BookmarkSort);
              setPage(1);
            }}
          />
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : loading ? (
        <SavedSkeleton view={view} />
      ) : items.length === 0 ? (
        <EmptyState filtered={Boolean(search.trim()) || type !== "all"} />
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <SavedCard
              key={item.id}
              item={item}
              removing={removingId === item.id}
              onRemove={() => void remove(item)}
            />
          ))}
        </div>
      ) : (
        <SavedTable
          items={items}
          removingId={removingId}
          onRemove={(item) => void remove(item)}
        />
      )}

      {!loading && !error && items.length > 0 && (
        <Pagination
          label="Phân trang nội dung đã lưu"
          page={page}
          pageCount={pageCount}
          onChange={setPage}
          className="mt-6 border-t border-border-soft pt-4"
        />
      )}
    </div>
  );
}

function ViewSwitch({ value, onChange }: { value: ViewMode; onChange: (value: ViewMode) => void }) {
  return (
    <div className="inline-flex rounded-md border border-border bg-card p-1" aria-label="Kiểu hiển thị">
      <button
        type="button"
        aria-label="Hiển thị dạng thẻ"
        aria-pressed={value === "cards"}
        onClick={() => onChange("cards")}
        className={`flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-semibold ${value === "cards" ? "bg-foreground text-primary-foreground" : "text-text-muted hover:bg-bg"}`}
      >
        <Grid2X2 className="h-3.5 w-3.5" /> Thẻ
      </button>
      <button
        type="button"
        aria-label="Hiển thị dạng bảng"
        aria-pressed={value === "table"}
        onClick={() => onChange("table")}
        className={`flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-semibold ${value === "table" ? "bg-foreground text-primary-foreground" : "text-text-muted hover:bg-bg"}`}
      >
        <List className="h-3.5 w-3.5" /> Bảng
      </button>
    </div>
  );
}

function SavedCard({ item, removing, onRemove }: {
  item: UserBookmark;
  removing: boolean;
  onRemove: () => void;
}) {
  const meta = TYPE_META[item.targetType];
  const Icon = meta.icon;
  const available = item.available !== false;
  return (
    <Card className="group flex min-h-[19rem] flex-col overflow-hidden transition-colors hover:border-primary/35">
      <div className="relative flex h-32 items-center justify-center overflow-hidden bg-bg">
        {item.coverImageUrl ? (
          <Image
            src={item.coverImageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${meta.accent}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-2xs font-bold ${meta.accent}`}>
          <Icon className="h-3 w-3" /> {meta.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="line-clamp-2 text-base font-bold leading-snug text-navy">{titleOf(item)}</h2>
          {!available && <span className="shrink-0 rounded bg-border-soft px-2 py-1 text-2xs font-semibold text-text-faint">Không khả dụng</span>}
        </div>
        <p className="line-clamp-2 text-xs leading-5 text-text-muted">{descriptionOf(item)}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-2xs text-text-faint">
          {metadataOf(item).map((entry) => <span key={entry} className="rounded-md bg-bg px-2 py-1">{entry}</span>)}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border-soft pt-3">
          <span className="inline-flex items-center gap-1 text-2xs text-text-faint">
            <CalendarDays className="h-3 w-3" /> Lưu {savedDate.format(new Date(item.createdAt))}
          </span>
          <div className="flex items-center gap-1.5">
            {available && (
              <Link href={hrefOf(item)} className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-semibold text-primary hover:bg-primary-tint">
                Mở <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
            <RemoveButton removing={removing} title={titleOf(item)} onClick={onRemove} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function SavedTable({ items, removingId, onRemove }: {
  items: UserBookmark[];
  removingId: string | null;
  onRemove: (item: UserBookmark) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="border-b border-border bg-bg text-2xs font-bold tracking-wide text-text-faint uppercase">
            <tr><th className="px-4 py-3">Nội dung</th><th className="px-4 py-3">Loại</th><th className="px-4 py-3">Thông tin</th><th className="px-4 py-3">Ngày lưu</th><th className="px-4 py-3 text-right">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {items.map((item) => {
              const meta = TYPE_META[item.targetType];
              const Icon = meta.icon;
              const available = item.available !== false;
              return (
                <tr key={item.id} className="transition-colors hover:bg-bg/70">
                  <td className="max-w-md px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${meta.accent}`}><Icon className="h-4 w-4" /></span>
                      <div className="min-w-0">
                        {available ? <Link href={hrefOf(item)} className="line-clamp-1 text-sm font-semibold text-navy hover:text-primary">{titleOf(item)}</Link> : <span className="line-clamp-1 text-sm font-semibold text-text-muted">{titleOf(item)}</span>}
                        <p className="mt-0.5 line-clamp-1 text-xs text-text-faint">{descriptionOf(item)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><span className={`rounded-md px-2 py-1 text-2xs font-bold ${meta.accent}`}>{meta.label}</span></td>
                  <td className="px-4 py-3.5 text-xs text-text-muted">{metadataOf(item).slice(0, 2).join(" · ") || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs text-text-faint">{savedDate.format(new Date(item.createdAt))}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      {available && <Button href={hrefOf(item)} size="sm" variant="outline"><ExternalLink className="h-3.5 w-3.5" /> Mở</Button>}
                      <RemoveButton removing={removingId === item.id} title={titleOf(item)} onClick={() => onRemove(item)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function RemoveButton({ removing, title, onClick }: { removing: boolean; title: string; onClick: () => void }) {
  return (
    <button type="button" disabled={removing} aria-label={`Bỏ lưu ${title}`} onClick={onClick} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-faint transition-colors hover:border-danger/30 hover:bg-danger-tint hover:text-danger disabled:opacity-50">
      {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <Card className="border-dashed px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint text-primary">{filtered ? <SearchX className="h-6 w-6" /> : <Bookmark className="h-6 w-6" />}</div>
      <h2 className="mt-4 text-base font-bold text-navy">{filtered ? "Không tìm thấy nội dung phù hợp" : "Thư viện của bạn đang trống"}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-text-muted">{filtered ? "Hãy thử từ khóa khác hoặc chuyển về tab Tất cả." : "Nhấn biểu tượng Lưu ở nội dung bạn quan tâm để có thể quay lại nhanh từ đây."}</p>
      {!filtered && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button href="/courses" size="sm" variant="outline"><BookOpen className="h-3.5 w-3.5" /> Khám phá khóa học</Button>
          <Button href="/roadmaps" size="sm" variant="outline"><Map className="h-3.5 w-3.5" /> Xem lộ trình</Button>
          <Button href="/practice" size="sm"><Dumbbell className="h-3.5 w-3.5" /> Luyện tập</Button>
        </div>
      )}
    </Card>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <Card className="border-danger/25 px-6 py-12 text-center"><p className="text-sm font-bold text-navy">Không tải được thư viện đã lưu</p><p className="mt-1 text-xs text-text-muted">{message}</p><Button size="sm" variant="outline" className="mt-4" onClick={onRetry}>Thử lại</Button></Card>;
}

function SavedSkeleton({ view }: { view: ViewMode }) {
  if (view === "table") return <Card className="h-80 animate-pulse bg-border-soft/40" />;
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Card key={index} className="h-80 animate-pulse bg-border-soft/40" />)}</div>;
}

function titleOf(item: UserBookmark) {
  return item.title?.trim() || "Nội dung không khả dụng";
}

function descriptionOf(item: UserBookmark) {
  return item.description?.trim() || (item.available === false ? "Nội dung đã bị gỡ hoặc chuyển sang trạng thái riêng tư." : "Nội dung học tập trên CodeMentor.");
}

function hrefOf(item: UserBookmark) {
  if (item.targetType === "POST") return `/articles/${item.contentSlug ?? item.targetRef ?? item.targetId}`;
  if (item.targetType === "COURSE") return `/courses/${item.targetId}`;
  if (item.targetType === "ROADMAP") return `/roadmaps/${item.targetId}`;
  return `/solve/${item.targetId}`;
}

function metadataOf(item: UserBookmark) {
  const values: string[] = [];
  if (item.authorName) values.push(item.authorName);
  if (item.targetType === "COURSE") {
    if (item.itemCount) values.push(`${item.itemCount} bài học`);
    if (item.durationMinutes) values.push(formatDuration(item.durationMinutes));
    if (item.popularity) values.push(`${item.popularity} học viên`);
  } else if (item.targetType === "ROADMAP") {
    if (item.itemCount) values.push(`${item.itemCount} khóa học`);
    if (item.durationMinutes) values.push(formatDuration(item.durationMinutes));
  } else if (item.targetType === "EXERCISE") {
    if (item.difficulty) values.push(difficultyLabel(item.difficulty));
    if (item.durationMinutes) values.push(`${item.durationMinutes} phút`);
    if (item.popularity) values.push(`${item.popularity} lượt giải`);
  } else if (item.durationMinutes) values.push(`${item.durationMinutes} phút đọc`);
  return values.slice(0, 3);
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} phút`;
  return `${Math.round(minutes / 60)} giờ`;
}

function difficultyLabel(value: string) {
  return value === "easy" ? "Cơ bản" : value === "medium" ? "Trung bình" : value === "hard" ? "Nâng cao" : value;
}
