"use client";

import { useEffect, useState } from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { RichTextEditor } from "@codementor/editor";
import { integer, maxLength } from "@codementor/utils";
import { api, type Tag } from "@/lib/api";
import type { ArticleCoverUploadConfig, Draft } from "./types";

/**
 * Form giữ toàn bộ metadata bài viết ở một nơi. Ảnh đi thẳng từ trình duyệt tới kho qua
 * URL ký sẵn; form chỉ đưa URL công khai vào bản nháp để lượt Lưu kế tiếp persist cùng bài.
 */
export function ArticleEditor({
  articleId,
  draft,
  onChange,
  onUploadingChange,
  tags,
}: {
  articleId: string;
  draft: Draft;
  onChange: (draft: Draft) => void;
  onUploadingChange?: (uploading: boolean) => void;
  tags: Tag[];
}) {
  const [uploadConfig, setUploadConfig] =
    useState<ArticleCoverUploadConfig | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    void api.articles
      .coverUploadConfig()
      .then(setUploadConfig)
      .catch(() => setUploadConfig(null));
  }, []);

  const uploadCover = async (file: File) => {
    setUploadError(null);
    const config = uploadConfig;
    if (!config?.enabled) {
      setUploadError(
        "Kho ảnh chưa sẵn sàng. Bạn vẫn có thể dán URL ảnh bên dưới.",
      );
      return;
    }
    if (
      !config.acceptedTypes.includes(file.type) ||
      file.size > config.maxBytes
    ) {
      setUploadError(
        `Chỉ nhận PNG, JPEG hoặc WebP tối đa ${Math.round(config.maxBytes / 1024 / 1024)} MB.`,
      );
      return;
    }
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const signed = await api.articles.coverUploadUrl(articleId, {
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      });
      const response = await fetch(signed.uploadUrl, {
        method: "PUT",
        headers: signed.headers,
        body: file,
      });
      if (!response.ok) throw new Error("Storage từ chối tệp ảnh.");
      // Persist ngay sau khi upload để ảnh không bị mất nếu người dùng gửi duyệt
      // hoặc rời trang trước khi bấm nút Lưu ở thanh công cụ.
      await api.articles.update(articleId, { coverImageUrl: signed.publicUrl });
      onChange({ ...draft, coverImageUrl: signed.publicUrl });
    } catch (cause) {
      setUploadError(
        cause instanceof Error ? cause.message : "Không tải được ảnh bìa.",
      );
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  const removeCover = async () => {
    setUploadError(null);
    setUploading(true);
    onUploadingChange?.(true);
    try {
      await api.articles.update(articleId, { coverImageUrl: null });
      onChange({ ...draft, coverImageUrl: "" });
    } catch (cause) {
      setUploadError(
        cause instanceof Error ? cause.message : "Không thể xóa ảnh bìa.",
      );
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Field label="Tiêu đề">
        <input
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:border-ring"
          onChange={(event) =>
            onChange({ ...draft, title: event.target.value })
          }
          placeholder="Nhập tiêu đề bài viết…"
          value={draft.title}
        />
      </Field>

      <Field
        error={maxLength(draft.excerpt, 500, "Tóm tắt")}
        hint="Bắt buộc mới đăng được. Câu này cũng chính là nội dung thông báo gửi tới người học."
        label="Tóm tắt"
      >
        <textarea
          className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:border-ring"
          onChange={(event) =>
            onChange({ ...draft, excerpt: event.target.value })
          }
          value={draft.excerpt}
        />
      </Field>

      <Field
        hint="Ảnh ngang 16:9 dùng tại danh sách bài viết, Khám phá và đầu trang chi tiết."
        label="Ảnh bìa"
      >
        <div className="grid gap-3 rounded-lg border bg-muted/10 p-3 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-center">
          <div className="relative aspect-video overflow-hidden rounded-md border bg-muted">
            {draft.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="Xem trước ảnh bìa bài viết"
                className="h-full w-full object-cover"
                src={draft.coverImageUrl}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
                <ImageIcon aria-hidden="true" className="size-6" />
                <span className="text-xs">Chưa có ảnh</span>
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-3">
            <div>
              <p className="text-sm font-medium">
                {draft.coverImageUrl
                  ? "Ảnh bìa đã được tải lên"
                  : "Chọn ảnh bìa cho bài viết"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                PNG, JPEG hoặc WebP. Ảnh được lưu trực tiếp vào kho lưu trữ của
                hệ thống.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium">
                {uploading ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Upload aria-hidden="true" className="size-4" />
                )}
                {uploading ? "Đang tải…" : "Tải ảnh lên"}
                <input
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  disabled={uploading || uploadConfig?.enabled === false}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadCover(file);
                    event.currentTarget.value = "";
                  }}
                  type="file"
                />
              </label>
              {draft.coverImageUrl && (
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium text-destructive disabled:opacity-50"
                  disabled={uploading}
                  onClick={() => void removeCover()}
                  type="button"
                >
                  <X aria-hidden="true" className="size-4" />
                  Xóa ảnh
                </button>
              )}
            </div>
          </div>
        </div>
        {uploadError && (
          <p className="mt-1.5 text-sm text-destructive" role="alert">
            {uploadError}
          </p>
        )}
      </Field>

      <Field
        error={maxLength(draft.takeaway, 500, "Điểm rút ra")}
        label="Điểm rút ra"
      >
        <textarea
          className="min-h-16 w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:border-ring"
          onChange={(event) =>
            onChange({ ...draft, takeaway: event.target.value })
          }
          value={draft.takeaway}
        />
      </Field>

      <Field
        hint="Chip lọc ở trang bài viết lấy từ đây. Bài không có chủ đề vẫn hiện trong danh sách nhưng không lọc ra được."
        label="Chủ đề"
      >
        <select
          aria-label="Chủ đề"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:border-ring"
          onChange={(event) =>
            onChange({ ...draft, tagId: event.target.value })
          }
          value={draft.tagId}
        >
          <option value="">— Chưa chọn —</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        error={integer(draft.readMinutes, "Thời gian đọc", {
          min: 1,
          max: 1000,
        })}
        label="Thời gian đọc (phút)"
      >
        <input
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:border-ring"
          inputMode="numeric"
          onChange={(event) =>
            onChange({
              ...draft,
              readMinutes: event.target.value.replace(/\D/g, ""),
            })
          }
          value={draft.readMinutes}
        />
      </Field>

      <Field label="Nội dung">
        <RichTextEditor
          onChange={(html) => onChange({ ...draft, contentHtml: html })}
          placeholder="Viết nội dung bài viết…"
          value={draft.contentHtml}
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-muted-foreground">{hint}</p>}
      {children}
      {error && (
        <p className="mt-1.5 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
