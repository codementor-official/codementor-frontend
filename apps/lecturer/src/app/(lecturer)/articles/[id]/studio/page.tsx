"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Archive,
  Check,
  Eye,
  RotateCcw,
  Save,
  Send,
  Undo2,
} from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import {
  BreadcrumbTitle,
  Button,
  Modal,
  ReasonButton,
  StatusBadge,
  buttonClassName,
  useToast,
} from "@codementor/ui";
import { StudioScroll, StudioShell } from "@/components/page/studio-shell";
import { useUnsavedGuard } from "@/components/page/unsaved-guard";
import {
  clearDraft,
  draftStorageKey,
  readDraft,
  useDraftAutosave,
  type StoredDraft,
} from "@/hooks/use-studio-draft";
import { ArticleEditor } from "@/features/articles/article-editor";
import {
  ARTICLE_STATUS_LABELS,
  ARTICLE_STATUS_TONES,
  type Article,
  type Draft,
} from "@/features/articles/types";
import { api, type Tag } from "@/lib/api";

/** Ứng dụng người học, để mở xem trước bài. */
const CLIENT_URL =
  process.env.NEXT_PUBLIC_CLIENT_URL ?? "http://localhost:3000";

function toDraft(article: Article): Draft {
  return {
    title: article.title,
    excerpt: article.excerpt ?? "",
    coverImageUrl: article.coverImageUrl ?? "",
    takeaway: article.takeaway ?? "",
    readMinutes: article.readMinutes ? String(article.readMinutes) : "",
    tagId: article.tagId ?? "",
    contentHtml: article.contentHtml ?? "",
  };
}

function signature(draft: Draft): string {
  return JSON.stringify(draft);
}

export default function ArticleStudioPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [article, setArticle] = useState<Article | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [savedSignature, setSavedSignature] = useState("");
  const [pendingDraft, setPendingDraft] = useState<StoredDraft<Draft> | null>(
    null,
  );

  useEffect(() => {
    void api.tags
      .list()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.articles
      .detail(id)
      .then((loaded) => {
        if (cancelled) return;
        const nextDraft = toDraft(loaded);
        setArticle(loaded);
        setDraft(nextDraft);
        setSavedSignature(signature(nextDraft));

        const stored = readDraft<Draft>(draftStorageKey("article", id));
        if (!stored) return;
        if (signature(stored.value) === signature(nextDraft)) {
          clearDraft(draftStorageKey("article", id));
        } else {
          setPendingDraft(stored);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(describe(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const dirty = Boolean(draft) && signature(draft as Draft) !== savedSignature;
  useDraftAutosave(draftStorageKey("article", id), draft as Draft, {
    ready: draft !== null,
    dirty,
  });
  const unsavedDialog = useUnsavedGuard(dirty);

  if (error && !article) {
    return (
      <div className="px-4 py-4 sm:px-5">
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      </div>
    );
  }

  if (!article || !draft) {
    return (
      <p className="px-4 py-4 text-sm text-muted-foreground sm:px-5">
        Đang tải…
      </p>
    );
  }

  const act = async (action: () => Promise<unknown>, done: string) => {
    setSaving(true);
    try {
      await action();
      const loaded = await api.articles.detail(id);
      const nextDraft = toDraft(loaded);
      setArticle(loaded);
      setDraft(nextDraft);
      setSavedSignature(signature(nextDraft));
      toast.success(done);
    } catch (cause) {
      toast.error(describe(cause));
    } finally {
      setSaving(false);
    }
  };

  const persistDraft = async () => {
    await api.articles.update(id, {
      title: draft.title.trim() || undefined,
      excerpt: draft.excerpt.trim() || undefined,
      takeaway: draft.takeaway.trim() || undefined,
      coverImageUrl: draft.coverImageUrl.trim() || null,
      readMinutes: draft.readMinutes ? Number(draft.readMinutes) : undefined,
      tagId: draft.tagId || undefined,
    });
    // Tiptap trả "<p></p>" cho tài liệu rỗng; ghi nó sẽ gắn content_ref cho một bài
    // trống — publish() cho qua, còn người đọc mở ra thấy trắng.
    if (draft.contentHtml.replace(/<[^>]*>/g, "").trim().length > 0) {
      await api.articles.saveContent(id, draft.contentHtml);
    }
    setSavedAt(new Date());
  };

  const save = () => act(persistDraft, "Đã lưu");
  const busy = saving || coverUploading;

  return (
    <>
      {unsavedDialog}
      <BreadcrumbTitle
        href={`/articles?open=${id}`}
        slug={id}
        title={draft.title || "Bài viết chưa đặt tên"}
      />

      <Modal
        description={
          pendingDraft
            ? `Bản nháp từ ${new Date(pendingDraft.savedAt).toLocaleString("vi-VN")}, chưa kịp lưu vào hệ thống.`
            : undefined
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                clearDraft(draftStorageKey("article", id));
                setPendingDraft(null);
              }}
              type="button"
              variant="outline"
            >
              Bỏ qua
            </Button>
            <Button
              onClick={() => {
                if (!pendingDraft) return;
                setDraft(pendingDraft.value);
                setPendingDraft(null);
              }}
              type="button"
            >
              Khôi phục thay đổi
            </Button>
          </div>
        }
        onClose={() => {
          clearDraft(draftStorageKey("article", id));
          setPendingDraft(null);
        }}
        open={pendingDraft !== null}
        title="Phát hiện thay đổi chưa lưu"
        width="sm"
      >
        <p className="text-sm text-muted-foreground">
          Trang có vẻ đã bị tải lại hoặc mất mạng trước khi kịp lưu. Khôi phục
          để tiếp tục từ chỗ đang dở, hoặc bỏ qua để dùng đúng bản đã lưu trên
          hệ thống.
        </p>
      </Modal>

      {/* Cùng class `.rich-text` mà trình soạn thảo dùng, nên bản xem trước và bản người
          học đọc được dựng từ đúng một bộ luật trình bày. */}
      <Modal
        onClose={() => setPreviewing(false)}
        open={previewing}
        title="Xem trước bài viết"
        width="lg"
      >
        <article>
          <h1 className="text-2xl leading-snug font-bold">{draft.title}</h1>
          {draft.excerpt ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {draft.excerpt}
            </p>
          ) : null}
          <div
            className="rich-text mt-6"
            dangerouslySetInnerHTML={{ __html: draft.contentHtml }}
          />
        </article>
      </Modal>

      <StudioShell
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {savedAt !== null && (
              <span
                aria-live="polite"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <Check aria-hidden="true" className="size-3.5 text-success" />
                Đã lưu lúc {savedAt.toLocaleTimeString("vi-VN")}
              </span>
            )}
            <Button
              onClick={() => setPreviewing(true)}
              type="button"
              variant="outline"
            >
              <Eye aria-hidden="true" className="size-4" />
              Xem trước
            </Button>
            {article.status === "published" && (
              <a
                className={buttonClassName("outline")}
                href={`${CLIENT_URL}/articles/${article.slug}`}
                rel="noreferrer"
                target="_blank"
              >
                Xem trên client
              </a>
            )}
            <Button
              disabled={busy}
              onClick={() => void save()}
              type="button"
              variant="outline"
            >
              <Save aria-hidden="true" className="size-4" />
              {saving ? "Đang lưu…" : "Lưu"}
            </Button>
            {article.status === "pending_review" ? (
              <Button
                disabled={busy}
                onClick={() =>
                  void act(() => api.articles.withdraw(id), "Đã hủy gửi duyệt")
                }
                type="button"
                variant="outline"
              >
                <Undo2 aria-hidden="true" className="size-4" />
                Hủy gửi duyệt
              </Button>
            ) : article.status === "archived" ? (
              <Button
                disabled={busy}
                onClick={() =>
                  void act(() => api.articles.restore(id), "Đã khôi phục")
                }
                type="button"
                variant="outline"
              >
                <RotateCcw aria-hidden="true" className="size-4" />
                Khôi phục
              </Button>
            ) : (
              <>
                <Button
                  disabled={busy}
                  onClick={() =>
                    void act(async () => {
                      await persistDraft();
                      await api.articles.submit(id);
                    }, "Đã gửi duyệt")
                  }
                  type="button"
                >
                  <Send aria-hidden="true" className="size-4" />
                  {article.status === "published"
                    ? "Gửi duyệt lại"
                    : "Gửi duyệt"}
                </Button>
                {article.status === "published" && (
                  <ReasonButton
                    confirmLabel="Gửi yêu cầu"
                    description="Bài viết vẫn công khai cho tới khi quản trị viên duyệt yêu cầu này. Quản trị viên sẽ đọc được đúng lý do bạn nêu."
                    disabled={busy}
                    onConfirm={(reason) =>
                      act(
                        () => api.articles.requestRemoval(id, reason),
                        "Đã gửi yêu cầu",
                      )
                    }
                    placeholder="Vì sao bạn muốn gỡ bài viết này xuống?"
                    title="Xin gỡ bài viết đang công khai?"
                  >
                    <Archive aria-hidden="true" className="size-4" />
                    Xin gỡ xuống
                  </ReasonButton>
                )}
              </>
            )}
          </div>
        }
        backHref="/articles"
        backLabel="Bài viết"
        rejectionReason={article.rejectionReason}
        slug={article.slug}
        status={
          <StatusBadge tone={ARTICLE_STATUS_TONES[article.status] ?? "neutral"}>
            {ARTICLE_STATUS_LABELS[article.status] ?? article.status}
          </StatusBadge>
        }
        title={draft.title || "Bài viết chưa đặt tên"}
      >
        <StudioScroll>
          <ArticleEditor
            articleId={id}
            draft={draft}
            onChange={setDraft}
            onUploadingChange={setCoverUploading}
            tags={tags}
          />
        </StudioScroll>
      </StudioShell>
    </>
  );
}

function describe(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "Thao tác thất bại";
}
