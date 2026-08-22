"use client";

import { RichTextEditor } from "@codementor/editor";
import { integer, maxLength } from "@codementor/utils";
import type { Tag } from "@/lib/api";
import type { Draft } from "./types";

/**
 * Form thuần, không tự tải gì cả — trang studio nạp bài viết và truyền `draft` xuống, y hệt
 * cách `ExerciseBriefForm`/`ExerciseCodeForm` làm việc với `exercises/[id]/studio`.
 */
export function ArticleEditor({
  draft,
  onChange,
  tags,
}: {
  draft: Draft;
  onChange: (draft: Draft) => void;
  tags: Tag[];
}) {
  return (
    <div className="grid gap-4">
      <Field label="Tiêu đề">
        <input
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          onChange={(event) => onChange({ ...draft, title: event.target.value })}
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
          className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          onChange={(event) => onChange({ ...draft, excerpt: event.target.value })}
          value={draft.excerpt}
        />
      </Field>

      <Field error={maxLength(draft.takeaway, 500, "Điểm rút ra")} label="Điểm rút ra">
        <textarea
          className="min-h-16 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          onChange={(event) => onChange({ ...draft, takeaway: event.target.value })}
          value={draft.takeaway}
        />
      </Field>

      <Field
        hint="Chip lọc ở trang bài viết lấy từ đây. Bài không có chủ đề vẫn hiện trong danh sách nhưng không lọc ra được."
        label="Chủ đề"
      >
        <select
          aria-label="Chủ đề"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          onChange={(event) => onChange({ ...draft, tagId: event.target.value })}
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
        error={integer(draft.readMinutes, "Thời gian đọc", { min: 1, max: 1000 })}
        label="Thời gian đọc (phút)"
      >
        <input
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          inputMode="numeric"
          onChange={(event) =>
            onChange({ ...draft, readMinutes: event.target.value.replace(/\D/g, "") })
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
