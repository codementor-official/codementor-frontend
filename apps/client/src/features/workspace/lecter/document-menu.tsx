"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, Loader2, Plus } from "lucide-react";
import { useToast } from "@codementor/ui";
import { Pagination } from "@/components/ui/pagination";
import { api } from "@/lib/api";
import { messageOf } from "../exercise-authoring";
import type { WorkspaceContentPage, WorkspaceDocument } from "../types";

const EMPTY: WorkspaceContentPage<WorkspaceDocument> = {
  items: [],
  page: 1,
  limit: 6,
  total: 0,
  totalPages: 0,
};

/**
 * Menu import tài liệu của composer: nút `+` mở bảng chọn tài liệu ĐÃ DUYỆT của nhóm.
 *
 * Chỉ liệt kê, không tải tệp mới: tài liệu vừa tải lên còn chờ Chủ nhóm duyệt, mà Lecter chỉ đọc
 * được bản đã duyệt — một mục "Tải lên" ở đây sẽ sinh ra chip mà lượt gửi ngay sau đó không dùng
 * được. Tải tệp vẫn ở tab Tài liệu của nhóm.
 *
 * Portal ra `body` và định vị bằng `getBoundingClientRect`: ô nhập của CopilotKit nằm trong một
 * khung `pointer-events-none` + `absolute`, nên một bảng chọn đặt tại chỗ có thể bị cắt hoặc nằm
 * dưới lớp khác. Mở LÊN TRÊN vì ô nhập nằm sát đáy drawer.
 */
export function LecterDocumentMenu({
  slug,
  selected,
  onPick,
  onRemove,
}: {
  slug: string;
  selected: { id: string; title: string }[];
  onPick: (document: { id: string; title: string }) => void;
  onRemove: (id: string) => void;
}) {
  const toast = useToast();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [documents, setDocuments] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const open = rect !== null;

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
    const close = () => setRect(null);
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && close();
    window.addEventListener("keydown", onKeyDown);
    // `scroll` với `capture`: khung chat cuộn trong chính nó, sự kiện không nổi lên `window`.
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Đính kèm tài liệu đã duyệt"
        ref={buttonRef}
        onClick={() =>
          setRect((current) =>
            current ? null : (buttonRef.current?.getBoundingClientRect() ?? null),
          )
        }
        className="pointer-events-auto ml-1 flex size-9 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg hover:text-navy"
      >
        <Plus aria-hidden="true" className="size-5" />
      </button>

      {rect &&
        createPortal(
          <div
            role="menu"
            // `mousedown` ở ngoài không đóng menu ở đây: bảng chọn có ô tìm kiếm và phân trang,
            // đóng theo click ngoài sẽ cắt ngang giữa lúc người soạn đang gõ. Escape, cuộn và
            // đổi kích thước là ba lối đóng.
            className="fixed z-[60] w-80 rounded-lg border border-border bg-card p-2 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
            style={{ bottom: window.innerHeight - rect.top + 8, left: rect.left }}
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
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          checked
                            ? onRemove(document.id)
                            : onPick({ id: document.id, title: document.title })
                        }
                      />
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
          </div>,
          document.body,
        )}
    </>
  );
}
