"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Code2,
  Lightbulb,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Send,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { useToast } from "@codementor/ui";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import type {
  ExerciseSolution,
  ExerciseSolutionComment,
  ExerciseSolutionsPage,
} from "@/types/exercise-solutions";

const when = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function DiscussionPanel({
  exerciseId,
  editorCode,
  editorLanguage,
}: {
  exerciseId: string;
  editorCode: string;
  editorLanguage: string;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"newest" | "popular">("newest");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [data, setData] = useState<ExerciseSolutionsPage | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comments, setComments] = useState<ExerciseSolutionComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [formMode, setFormMode] = useState<"new" | "edit" | null>(null);
  const [title, setTitle] = useState("");
  const [explanation, setExplanation] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [comment, setComment] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [commentToDelete, setCommentToDelete] =
    useState<ExerciseSolutionComment | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selected = data?.items.find((item) => item.id === selectedId) ?? null;

  const refresh = useCallback(async () => {
    try {
      const result = await api.exercises.solutions.list(exerciseId, {
        page,
        sort,
        q: search,
        language: languageFilter,
      });
      setData(result);
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không tải được lời giải",
      );
    } finally {
      setLoading(false);
    }
  }, [exerciseId, languageFilter, page, search, sort]);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  function openNew() {
    setSelectedId(null);
    setTitle("");
    setExplanation("");
    setCode("");
    setLanguage(editorLanguage);
    setError(null);
    setFormMode("new");
  }

  function openEdit(item: ExerciseSolution) {
    setTitle(item.title);
    setExplanation(item.explanation);
    setCode(item.code ?? "");
    setLanguage(item.language ?? editorLanguage);
    setError(null);
    setFormMode("edit");
  }

  async function openDetail(item: ExerciseSolution) {
    setSelectedId(item.id);
    setComments([]);
    setCommentsLoading(true);
    setCommentToDelete(null);
    setError(null);
    try {
      setComments(await api.exercises.solutions.comments(exerciseId, item.id));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không tải được bình luận",
      );
    } finally {
      setCommentsLoading(false);
    }
  }

  async function publish() {
    if (!title.trim() || !explanation.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const body = {
        title: title.trim(),
        explanation: explanation.trim(),
        code: code.trim() || undefined,
        language: language.trim() || undefined,
      };
      if (formMode === "edit" && selectedId) {
        await api.exercises.solutions.update(exerciseId, selectedId, body);
        toast.success("Đã cập nhật lời giải.");
      } else {
        await api.exercises.solutions.create(exerciseId, body);
        toast.success("Đã chia sẻ lời giải cho bài này.");
      }
      setFormMode(null);
      setSelectedId(null);
      setSearchDraft("");
      setSearch("");
      setLanguageFilter("");
      setPage(1);
      setSort("newest");
      setData(
        await api.exercises.solutions.list(exerciseId, {
          page: 1,
          sort: "newest",
        }),
      );
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Không lưu được lời giải",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeSolution() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await api.exercises.solutions.remove(exerciseId, selected.id);
      setSelectedId(null);
      setConfirmDelete(false);
      toast.success("Đã xóa lời giải của bạn.");
      await refresh();
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Không xóa được lời giải",
      );
    } finally {
      setBusy(false);
    }
  }

  async function vote(item: ExerciseSolution) {
    setBusy(true);
    try {
      await api.exercises.solutions.vote(exerciseId, item.id, item.votedByMe);
      await refresh();
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Không cập nhật được lượt thích",
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendComment() {
    if (!selected || !comment.trim()) return;
    setBusy(true);
    try {
      await api.exercises.solutions.comment(
        exerciseId,
        selected.id,
        comment.trim(),
      );
      setComment("");
      setComments(
        await api.exercises.solutions.comments(exerciseId, selected.id),
      );
      await refresh();
      toast.success("Đã gửi bình luận.");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Không gửi được bình luận",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeComment(entry: ExerciseSolutionComment) {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await api.exercises.solutions.removeComment(
        exerciseId,
        selected.id,
        entry.id,
      );
      setComments((current) => current.filter((item) => item.id !== entry.id));
      await refresh();
      setCommentToDelete(null);
      toast.success("Đã xóa bình luận.");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Không xóa được bình luận",
      );
    } finally {
      setBusy(false);
    }
  }

  async function copyCode(value: string) {
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(value);
      toast.success("Đã sao chép code.");
    } catch {
      const field = document.createElement("textarea");
      field.value = value;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      if (copied) {
        toast.success("Đã sao chép code.");
      } else
        toast.error("Không sao chép được code; hãy chọn và sao chép thủ công.");
    }
  }

  function back() {
    setFormMode(null);
    setSelectedId(null);
    setConfirmDelete(false);
    setCommentToDelete(null);
    setError(null);
  }
  const isOwn = selected?.authorId === user?.id;

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex shrink-0 items-center gap-2 border-b border-border-soft px-3 py-2.5">
        {(selectedId || formMode) && (
          <button
            type="button"
            onClick={back}
            aria-label="Quay lại danh sách lời giải"
            className="rounded-md p-1.5 text-text-muted hover:bg-bg hover:text-navy"
          >
            <ArrowLeft size={17} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-navy">
            {formMode === "new"
              ? "Chia sẻ lời giải"
              : formMode === "edit"
                ? "Sửa lời giải"
                : selected
                  ? selected.title
                  : "Lời giải cộng đồng"}
          </h2>
          <p className="text-2xs text-text-muted">
            {formMode
              ? "Giải thích cách nghĩ để người khác học cùng"
              : selected
                ? `${selected.authorName} · ${when(selected.createdAt)}`
                : search || languageFilter
                  ? `${data?.total ?? 0} kết quả phù hợp`
                  : `${data?.total ?? 0} lời giải cho bài công khai này`}
          </p>
        </div>
        {!selectedId && !formMode && (
          <button
            type="button"
            onClick={openNew}
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-on-ink"
          >
            <Plus size={14} /> Chia sẻ
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {error && (
          <div
            role="alert"
            className="mb-3 rounded-md border border-border px-3 py-2 text-xs text-primary"
          >
            {error}{" "}
            <button
              type="button"
              onClick={() => void refresh()}
              className="underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {formMode ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-bg p-3 text-xs leading-5 text-text-muted">
              <Lightbulb size={15} className="mr-1 inline text-primary" />
              Một lời giải hữu ích nên nêu ý tưởng, độ phức tạp và trường hợp
              biên. Chỉ chia sẻ code bạn muốn công khai.
            </div>
            <label className="block text-xs font-semibold text-navy">
              Tiêu đề
              <input
                aria-label="Tiêu đề lời giải"
                maxLength={160}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Duyệt một lần, O(n)"
                className="mt-1.5 w-full rounded-md border border-border bg-surface p-2 text-sm font-normal text-navy"
              />
            </label>
            <label className="block text-xs font-semibold text-navy">
              Giải thích
              <textarea
                aria-label="Giải thích cách giải"
                maxLength={20000}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Ý tưởng của bạn là gì? Vì sao đúng? Độ phức tạp ra sao?"
                className="mt-1.5 min-h-36 w-full rounded-md border border-border bg-surface p-2 text-sm font-normal leading-6 text-navy"
              />
            </label>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-navy">
                Code tham khảo
              </span>
              <button
                type="button"
                disabled={!editorCode.trim() || editorCode.length > 30000}
                onClick={() => {
                  setCode(editorCode);
                  setLanguage(editorLanguage);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-40"
              >
                <Code2 size={14} /> Dùng code đang viết
              </button>
            </div>
            <input
              aria-label="Ngôn ngữ lập trình"
              maxLength={40}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="Ngôn ngữ lập trình"
              className="w-full rounded-md border border-border bg-surface p-2 text-xs text-navy"
            />
            <textarea
              aria-label="Mã nguồn"
              maxLength={30000}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Dán code hoặc lấy từ editor bên phải (không bắt buộc)"
              className="min-h-40 w-full rounded-md border border-border bg-surface p-2 font-mono text-xs leading-5 text-navy"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={back}
                className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-navy"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={
                  busy ||
                  title.trim().length < 3 ||
                  explanation.trim().length < 10
                }
                onClick={() => void publish()}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-on-ink disabled:opacity-50"
              >
                <Send size={13} />
                {formMode === "edit" ? "Lưu thay đổi" : "Đăng lời giải"}
              </button>
            </div>
          </div>
        ) : selected ? (
          <article>
            <div className="flex flex-wrap items-center gap-2 text-2xs text-text-muted">
              <span className="font-semibold text-navy">
                {selected.authorName}
              </span>
              <time dateTime={selected.createdAt}>
                {when(selected.createdAt)}
              </time>
              {selected.updatedAt !== selected.createdAt && (
                <span>· Đã sửa</span>
              )}
              {selected.language && (
                <span className="rounded-full bg-primary-tint px-2 py-0.5 text-primary">
                  {selected.language}
                </span>
              )}
            </div>
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-text">
              {selected.explanation}
            </p>
            {selected.code && (
              <div className="mt-4 overflow-hidden rounded-lg border border-border">
                <div className="flex items-center justify-between bg-bg px-3 py-2 text-xs font-semibold text-navy">
                  <span>{selected.language ?? "Code"}</span>
                  <button
                    type="button"
                    onClick={() => void copyCode(selected.code!)}
                    className="inline-flex items-center gap-1 text-text-muted hover:text-primary"
                  >
                    <ClipboardCopy size={14} /> Sao chép
                  </button>
                </div>
                <pre className="max-h-[480px] overflow-auto bg-ink-fixed p-3 text-xs leading-5 text-on-ink-fixed">
                  <code>{selected.code}</code>
                </pre>
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-border-soft pb-3 text-xs">
              <button
                type="button"
                disabled={busy}
                onClick={() => void vote(selected)}
                className={`inline-flex items-center gap-1.5 ${selected.votedByMe ? "font-semibold text-primary" : "text-text-muted hover:text-navy"}`}
              >
                <ThumbsUp size={15} />
                {selected.voteCount} hữu ích
              </button>
              <span className="inline-flex items-center gap-1.5 text-text-muted">
                <MessageCircle size={15} />
                {selected.commentCount} bình luận
              </span>
              {isOwn && (
                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(selected)}
                    className="inline-flex items-center gap-1 text-text-muted hover:text-primary"
                  >
                    <Pencil size={14} /> Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1 text-text-muted hover:text-primary"
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                </div>
              )}
            </div>
            <section className="mt-4">
              <h3 className="text-sm font-semibold text-navy">
                Bình luận ({selected.commentCount})
              </h3>
              {commentsLoading ? (
                <Loader2 size={18} className="mt-4 animate-spin text-primary" />
              ) : comments.length ? (
                <div className="mt-3 space-y-2">
                  {comments.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-md border border-border-soft bg-bg p-3 text-xs"
                    >
                      <div className="flex items-center gap-2 text-text-muted">
                        <b className="text-navy">{entry.authorName}</b>
                        <time dateTime={entry.createdAt}>
                          {when(entry.createdAt)}
                        </time>
                        {entry.authorId === user?.id && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setCommentToDelete(entry)}
                            className="ml-auto text-text-muted hover:text-primary"
                            aria-label="Xóa bình luận của tôi"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words leading-5 text-text">
                        {entry.body}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-text-muted">
                  Chưa có bình luận. Hãy bắt đầu trao đổi về cách giải.
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <textarea
                  aria-label="Viết bình luận"
                  maxLength={5000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Hỏi về ý tưởng hoặc góp ý cho lời giải..."
                  className="min-h-16 min-w-0 flex-1 rounded-md border border-border bg-surface p-2 text-xs text-navy"
                />
                <button
                  type="button"
                  disabled={busy || !comment.trim()}
                  onClick={() => void sendComment()}
                  aria-label="Gửi bình luận"
                  className="self-end rounded-md bg-primary p-2 text-on-ink disabled:opacity-50"
                >
                  <Send size={15} />
                </button>
              </div>
            </section>
          </article>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setLoading(true);
                  setPage(1);
                  setSearch(searchDraft.trim());
                }}
                className="flex min-w-44 flex-1 items-center gap-1 rounded-md border border-border bg-surface px-2"
              >
                <Search size={14} className="shrink-0 text-text-muted" />
                <input
                  aria-label="Tìm lời giải"
                  maxLength={100}
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  placeholder="Tìm ý tưởng, lời giải..."
                  className="h-9 min-w-0 flex-1 bg-transparent text-xs text-navy"
                />
                <button
                  type="submit"
                  className="text-2xs font-semibold text-primary"
                >
                  Tìm
                </button>
              </form>
              <select
                aria-label="Lọc ngôn ngữ lời giải"
                value={languageFilter}
                onChange={(e) => {
                  setLoading(true);
                  setLanguageFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 max-w-36 rounded-md border border-border bg-surface px-2 text-xs text-navy"
              >
                <option value="">Mọi ngôn ngữ</option>
                {data?.languages.map((item) => (
                  <option key={item.language} value={item.language}>
                    {item.language} ({item.count})
                  </option>
                ))}
              </select>
              <select
                aria-label="Sắp xếp lời giải"
                value={sort}
                onChange={(e) => {
                  setLoading(true);
                  setSort(e.target.value as "newest" | "popular");
                  setPage(1);
                }}
                className="h-9 rounded-md border border-border bg-surface px-2 text-xs text-navy"
              >
                <option value="newest">Mới nhất</option>
                <option value="popular">Hữu ích nhất</option>
              </select>
            </div>
            <div className="mt-3 text-2xs text-text-muted">
              {data?.total ?? 0} kết quả{search && <> cho “{search}”</>}
            </div>
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-primary" size={20} />
              </div>
            ) : !data?.items.length ? (
              <div className="mt-4 rounded-lg border border-border bg-bg p-6 text-center">
                <MessageCircle className="mx-auto text-primary" size={26} />
                <h3 className="mt-3 text-sm font-semibold text-navy">
                  {search || languageFilter
                    ? "Không tìm thấy lời giải phù hợp"
                    : "Chưa có lời giải cho bài này"}
                </h3>
                <p className="mt-1 text-xs leading-5 text-text-muted">
                  {search || languageFilter
                    ? "Thử đổi từ khóa hoặc bộ lọc."
                    : "Chia sẻ cách bạn giải để người học khác cùng tham khảo."}
                </p>
                {search || languageFilter ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setSearchDraft("");
                      setLanguageFilter("");
                      setPage(1);
                    }}
                    className="mt-3 text-xs font-semibold text-primary"
                  >
                    Xóa bộ lọc
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={openNew}
                    className="mt-3 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-on-ink"
                  >
                    Chia sẻ lời giải đầu tiên
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {data.items.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => void openDetail(item)}
                    className="block w-full rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-bg"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-semibold text-navy">
                        {item.title}
                      </span>
                      {item.language && (
                        <span className="shrink-0 rounded-full bg-primary-tint px-2 py-0.5 text-2xs text-primary">
                          {item.language}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-text-muted">
                      {item.explanation}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-2xs text-text-muted">
                      <span className="font-medium text-navy">
                        {item.authorName}
                      </span>
                      <time dateTime={item.createdAt}>
                        {when(item.createdAt)}
                      </time>
                      <span className="ml-auto inline-flex items-center gap-1">
                        <ThumbsUp size={12} />
                        {item.voteCount}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle size={12} />
                        {item.commentCount}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {(data?.total ?? 0) > 10 && (
              <div className="mt-4 flex items-center justify-end gap-2 text-xs text-text-muted">
                <span>
                  Trang {page} / {Math.ceil(data!.total / 10)}
                </span>
                <button
                  type="button"
                  disabled={page === 1 || loading}
                  onClick={() => {
                    setLoading(true);
                    setPage(page - 1);
                  }}
                  aria-label="Trang trước"
                  className="rounded-md border border-border p-1.5 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  disabled={!data?.hasMore || loading}
                  onClick={() => {
                    setLoading(true);
                    setPage(page + 1);
                  }}
                  aria-label="Trang sau"
                  className="rounded-md border border-border p-1.5 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
            <div className="mt-4 rounded-lg border border-border-soft bg-bg p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-navy">
                <Lightbulb size={15} className="text-primary" /> Viết lời giải
                dễ hiểu
              </div>
              <p className="mt-1 text-xs leading-5 text-text-muted">
                Nêu ý tưởng trước code, giải thích độ phức tạp và lưu ý test
                case biên. Bạn có thể lấy code từ editor khi chia sẻ.
              </p>
            </div>
          </>
        )}
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void removeSolution()}
        title="Xóa lời giải"
        message={
          <>
            Lời giải “{selected?.title}” sẽ không còn hiển thị cùng các bình
            luận của nó.
          </>
        }
        confirmLabel="Xóa lời giải"
      />
      <ConfirmDialog
        open={Boolean(commentToDelete)}
        onClose={() => setCommentToDelete(null)}
        onConfirm={() => {
          if (commentToDelete) void removeComment(commentToDelete);
        }}
        title="Xóa bình luận"
        message="Bình luận của bạn sẽ không còn hiển thị trong lời giải này."
        confirmLabel="Xóa bình luận"
      />
    </div>
  );
}
