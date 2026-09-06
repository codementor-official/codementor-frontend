"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Loader2, Plus } from "lucide-react";
import { useToast } from "@codementor/ui";
import { Pagination } from "@/components/ui/pagination";
import { api } from "@/lib/api";
import { messageOf } from "../exercise-authoring";
import type { WorkspaceContentPage, WorkspaceDocument } from "../types";
import type { LecterAttachment } from "./sessions";

const EMPTY: WorkspaceContentPage<WorkspaceDocument> = {
  items: [],
  page: 1,
  limit: 6,
  total: 0,
  totalPages: 0,
};

/**
 * Menu import tài liệu của composer: nút `+` mở bảng chọn tài liệu ĐÃ DUYỆT của workspace.
 *
 * Chỉ liệt kê, không tải tệp mới: tài liệu vừa tải lên còn chờ Chủ nhóm duyệt (`status`
 * khác `published`), mà Lecter chỉ đọc được bản đã duyệt — một mục "Tải lên" ở đây sẽ sinh ra
 * chip mà lượt gửi ngay sau đó không dùng được. Tải tệp vẫn ở tab Tài liệu của nhóm.
 *
 * Bảng chọn mở LÊN TRÊN vì composer nằm sát đáy drawer. Không cần portal như bên app giảng
 * viên: chân drawer không cắt nội dung tràn ra.
 */
export function LecterDocumentMenu({
  slug,
  selected,
  onChange,
}: {
  slug: string;
  selected: LecterAttachment[];
  onChange: (next: LecterAttachment[]) => void;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [documents, setDocuments] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDocuments(
        await api.workspaces.documents(slug, {
          page,
          limit: EMPTY.limit,
          q: query.trim() || undefined,
          status: "published",
        }),
      );
    } catch (error) {
      toast.error(messageOf(error, "Không thể tải tài liệu đã duyệt."));
    } finally {
      setLoading(false);
    }
  }, [page, query, slug, toast]);

  // Gõ tới đâu tìm tới đó, chờ 200ms cho khỏi bắn một request mỗi ký tự.
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timer);
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onDown = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const toggle = (document: WorkspaceDocument) => {
    onChange(
      selected.some((item) => item.id === document.id)
        ? selected.filter((item) => item.id !== document.id)
        : [...selected, { id: document.id, title: document.title }],
    );
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Đính kèm tài liệu đã duyệt"
        onClick={() => setOpen((value) => !value)}
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg hover:text-navy"
      >
        <Plus aria-hidden="true" className="size-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-30 mb-2 w-80 rounded-lg border border-border bg-card p-2 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
        >
          <div className="flex items-center gap-2 px-1 pb-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Tìm tài liệu đã duyệt</span>
              <input
                autoFocus
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Tìm tài liệu đã duyệt…"
                className="h-8 w-full rounded-md border border-border bg-surface px-2 text-xs text-navy"
              />
            </label>
            <span className="shrink-0 text-xs text-text-faint">{selected.length} đã chọn</span>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <p className="flex items-center justify-center gap-2 py-6 text-xs text-text-faint">
                <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                Đang tải tài liệu…
              </p>
            ) : documents.items.length === 0 ? (
              <p className="py-6 text-center text-xs text-text-faint">
                Không có tài liệu đã duyệt nào.
              </p>
            ) : (
              documents.items.map((document) => {
                const checked = selected.some((item) => item.id === document.id);
                return (
                  <label
                    key={document.id}
                    role="menuitemcheckbox"
                    aria-checked={checked}
                    className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-xs hover:bg-bg ${checked ? "bg-primary/5" : ""}`}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggle(document)} />
                    <FileText aria-hidden="true" className="size-3.5 shrink-0 text-text-muted" />
                    <span className="min-w-0 flex-1 truncate font-medium text-navy">
                      {document.title}
                    </span>
                    <span className="shrink-0 text-text-faint">{document.docType}</span>
                  </label>
                );
              })
            )}
          </div>

          {documents.totalPages > 1 && (
            <div className="pt-2">
              <Pagination
                page={page}
                pageCount={documents.totalPages}
                onChange={setPage}
                label="Phân trang tài liệu đã duyệt"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
