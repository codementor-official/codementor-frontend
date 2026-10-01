"use client";

import { useEffect, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { CourseCover } from "@codementor/ui";
import type { ArticleCoverUpload, ArticleCoverUploadConfig } from "@/features/articles/types";
import { Field, inputClassName } from "./field";

interface CoverImageFieldProps {
  contentId: string;
  title: string;
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  loadConfig: () => Promise<ArticleCoverUploadConfig>;
  createUpload: (
    id: string,
    body: { filename: string; contentType: string; sizeBytes: number },
  ) => Promise<ArticleCoverUpload>;
  persist: (value: string | null) => Promise<unknown>;
}

/**
 * Ảnh bìa dùng chung cho khóa học và lộ trình.
 *
 * Tệp đi thẳng lên object storage bằng URL ký sẵn, rồi URL công khai được lưu ngay để
 * không mất ảnh khi người soạn rời trang hoặc gửi duyệt trước khi bấm nút Lưu chung.
 */
export function CoverImageField({
  contentId,
  title,
  value,
  error,
  disabled = false,
  onChange,
  loadConfig,
  createUpload,
  persist,
}: CoverImageFieldProps) {
  const [config, setConfig] = useState<ArticleCoverUploadConfig | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadConfig()
      .then((loaded) => !cancelled && setConfig(loaded))
      .catch(() => !cancelled && setConfig(null));
    return () => {
      cancelled = true;
    };
  }, [loadConfig]);

  const upload = async (file: File) => {
    setUploadError(null);
    if (!config?.enabled) {
      setUploadError("Kho ảnh chưa sẵn sàng. Bạn vẫn có thể dán URL ảnh hợp lệ bên dưới.");
      return;
    }
    if (!config.acceptedTypes.includes(file.type) || file.size > config.maxBytes) {
      setUploadError(
        `Chỉ nhận PNG, JPEG hoặc WebP tối đa ${Math.round(config.maxBytes / 1024 / 1024)} MB.`,
      );
      return;
    }

    setUploading(true);
    try {
      const signed = await createUpload(contentId, {
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      });
      const response = await fetch(signed.uploadUrl, {
        method: "PUT",
        headers: signed.headers,
        body: file,
      });
      if (!response.ok) throw new Error("Kho lưu trữ từ chối tệp ảnh.");
      await persist(signed.publicUrl);
      onChange(signed.publicUrl);
    } catch (cause) {
      setUploadError(cause instanceof Error ? cause.message : "Không tải được ảnh bìa.");
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    setUploadError(null);
    setUploading(true);
    try {
      await persist(null);
      onChange("");
    } catch (cause) {
      setUploadError(cause instanceof Error ? cause.message : "Không thể xóa ảnh bìa.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Field
      error={error}
      hint="Ảnh ngang 16:9 xuất hiện ở danh sách, trang chi tiết và màn hình duyệt. Nếu bỏ trống, hệ thống dùng ảnh mặc định."
      htmlFor="coverImageUrl"
      label="Ảnh bìa"
      wide
    >
      <div className="grid gap-4 rounded-xl border bg-muted/10 p-3 sm:grid-cols-[15rem_minmax(0,1fr)] sm:items-center">
        <CourseCover
          className="aspect-video h-auto w-full rounded-lg"
          key={value || "default-cover"}
          src={value}
          title={title}
        />
        <div className="min-w-0 space-y-3">
          <div>
            <p className="text-sm font-medium">{value ? "Ảnh bìa hiện tại" : "Đang dùng ảnh mặc định"}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Nên dùng ảnh 16:9, định dạng PNG, JPEG hoặc WebP. Ảnh được lưu trong kho của hệ thống.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium disabled:pointer-events-none">
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {uploading ? "Đang tải…" : value ? "Thay ảnh" : "Tải ảnh lên"}
              <input
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={disabled || uploading || config?.enabled === false}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file);
                  event.currentTarget.value = "";
                }}
                type="file"
              />
            </label>
            {value && (
              <button
                className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium text-destructive disabled:opacity-50"
                disabled={disabled || uploading}
                onClick={() => void remove()}
                type="button"
              >
                <X className="size-4" />
                Dùng ảnh mặc định
              </button>
            )}
          </div>
          <input
            className={inputClassName}
            disabled={disabled || uploading}
            id="coverImageUrl"
            onChange={(event) => onChange(event.target.value)}
            placeholder="Hoặc dán URL ảnh https://…"
            value={value}
          />
          {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
        </div>
      </div>
    </Field>
  );
}
