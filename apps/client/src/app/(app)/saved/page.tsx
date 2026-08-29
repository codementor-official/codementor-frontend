"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Loader2, Trash2 } from "lucide-react";
import { Select } from "@codementor/ui";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { api } from "@/lib/api";
import type { BookmarkTarget, UserBookmark } from "@/features/account/types";

const OPTIONS = [
  { value: "all", label: "Tất cả nội dung" },
  { value: "COURSE", label: "Khóa học" },
  { value: "ROADMAP", label: "Lộ trình" },
  { value: "EXERCISE", label: "Bài luyện tập" },
  { value: "POST", label: "Bài viết" },
];

interface SavedItem extends UserBookmark {
  title: string;
  description: string;
  href: string;
  available: boolean;
}

export default function SavedPage() {
  const [type, setType] = useState<"all" | BookmarkTarget>("all");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.account.bookmarks({ type: type === "all" ? undefined : type, page, limit: 12 });
      setPageCount(Math.max(result.totalPages, 1));
      setItems(await Promise.all(result.items.map(resolveBookmark)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải được nội dung đã lưu.");
    } finally {
      setLoading(false);
    }
  }, [page, type]);

  useEffect(() => { void load(); }, [load]);

  const remove = async (item: SavedItem) => {
    await api.account.removeBookmark(item.targetType, item.targetId);
    await load();
  };

  return (
    <div>
      <PageHeader icon={Bookmark} title="Đã lưu" subtitle="Khóa học, lộ trình, bài tập và bài viết bạn muốn xem lại." actions={
        <Select label="Loại nội dung" value={type} options={OPTIONS} onChange={(value) => { setType(value as typeof type); setPage(1); }} />
      } />
      {error && <Card className="mb-4 border-danger/30 p-4 text-sm text-danger">{error}</Card>}
      {loading ? (
        <Card className="flex items-center justify-center gap-2 p-16 text-sm text-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải nội dung đã lưu...</Card>
      ) : items.length === 0 ? (
        <Card className="p-16 text-center"><Bookmark className="mx-auto h-8 w-8 text-border" /><p className="mt-3 text-sm font-semibold text-navy">Chưa có nội dung đã lưu</p><p className="mt-1 text-xs text-text-muted">Dùng nút Lưu ở khóa học, lộ trình, bài tập hoặc bài viết.</p></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="flex min-h-40 flex-col p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-md bg-primary-tint px-2 py-1 text-2xs font-bold text-primary">{labelOf(item.targetType)}</span>
                <button type="button" aria-label="Bỏ lưu" onClick={() => void remove(item)} className="rounded-md p-1.5 text-text-faint hover:bg-danger-tint hover:text-danger"><Trash2 className="h-4 w-4" /></button>
              </div>
              <h2 className="mt-4 line-clamp-2 text-base font-bold text-navy">{item.title}</h2>
              <p className="mt-2 line-clamp-2 flex-1 text-xs leading-5 text-text-muted">{item.description}</p>
              {item.available ? <Link href={item.href} className="mt-4 text-xs font-semibold text-primary hover:underline">Mở nội dung →</Link> : <span className="mt-4 text-xs text-text-faint">Nội dung không còn công khai.</span>}
            </Card>
          ))}
        </div>
      )}
      <Pagination label="Phân trang nội dung đã lưu" page={page} pageCount={pageCount} onChange={setPage} className="mt-5" />
    </div>
  );
}

async function resolveBookmark(bookmark: UserBookmark): Promise<SavedItem> {
  try {
    if (bookmark.targetType === "COURSE") {
      const item = await api.courses.detail(bookmark.targetId);
      return { ...bookmark, title: item.title, description: item.description ?? "Khóa học CodeMentor", href: `/courses/${item.id}`, available: true };
    }
    if (bookmark.targetType === "ROADMAP") {
      const item = await api.roadmaps.detail(bookmark.targetId);
      return { ...bookmark, title: item.title, description: item.shortDescription ?? item.description ?? "Lộ trình CodeMentor", href: `/roadmaps/${item.id}`, available: true };
    }
    if (bookmark.targetType === "EXERCISE") {
      const item = await api.exercises.detail(bookmark.targetId);
      return { ...bookmark, title: item.title, description: item.summary ?? "Bài luyện tập CodeMentor", href: `/solve/${item.id}`, available: true };
    }
    if (!bookmark.targetRef) throw new Error("missing article slug");
    const item = await api.articles.read(bookmark.targetRef);
    return { ...bookmark, title: item.title, description: item.excerpt ?? "Bài viết CodeMentor", href: `/articles/${item.slug}`, available: true };
  } catch {
    return { ...bookmark, title: "Nội dung không khả dụng", description: "Nội dung có thể đã bị gỡ hoặc chuyển sang riêng tư.", href: "#", available: false };
  }
}

function labelOf(type: BookmarkTarget) {
  return type === "COURSE" ? "Khóa học" : type === "ROADMAP" ? "Lộ trình" : type === "EXERCISE" ? "Bài tập" : "Bài viết";
}
