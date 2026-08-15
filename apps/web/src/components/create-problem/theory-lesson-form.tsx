"use client";

import { useState } from "react";
import { CircleCheck, Clock, Eye, Pencil, Plus, Save, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "./rich-text-editor";
import type { TheoryLessonDraft } from "@/types/problem-draft";

const EMPTY_DRAFT: TheoryLessonDraft = {
  title: "",
  chapter: "Chương 1",
  durationMinutes: 10,
  summary: "",
  objectives: [""],
  content: "",
};

export function TheoryLessonForm() {
  const [draft, setDraft] = useState<TheoryLessonDraft>(EMPTY_DRAFT);
  const [showPreview, setShowPreview] = useState(false);

  const patch = (values: Partial<TheoryLessonDraft>) => setDraft((d) => ({ ...d, ...values }));
  const filledObjectives = draft.objectives.filter((o) => o.trim());

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-end gap-4">
          <label className="min-w-64 flex-1 text-sm font-semibold text-navy">
            Tiêu đề bài học
            <Input
              className="mt-1.5"
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="Ví dụ: Giới thiệu tư duy thuật toán"
            />
          </label>
          <label className="w-40 text-sm font-semibold text-navy">
            Chương
            <Input
              className="mt-1.5"
              value={draft.chapter}
              onChange={(e) => patch({ chapter: e.target.value })}
              placeholder="Chương 1"
            />
          </label>
          <label className="w-40 text-sm font-semibold text-navy">
            Thời lượng (phút)
            <Input
              className="mt-1.5"
              type="number"
              min={1}
              value={draft.durationMinutes}
              onChange={(e) => patch({ durationMinutes: Number(e.target.value) })}
            />
          </label>
        </div>

        <label className="mt-4 block text-sm font-semibold text-navy">
          Mô tả ngắn
          <textarea
            value={draft.summary}
            onChange={(e) => patch({ summary: e.target.value })}
            rows={2}
            placeholder="Một câu tóm tắt hiển thị ngay dưới tiêu đề bài học."
            className="mt-1.5 w-full resize-y rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-navy outline-none placeholder:text-text-faint focus:border-navy"
          />
        </label>
      </Card>

      <Card className="p-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-navy">Sau bài này bạn có thể</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => patch({ objectives: [...draft.objectives, ""] })}
          >
            <Plus className="h-3.5 w-3.5" /> Thêm mục tiêu
          </Button>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-text-muted">
          Hiển thị thành danh sách gạch đầu dòng ở đầu bài học.
        </p>
        <div className="flex flex-col gap-2">
          {draft.objectives.map((objective, index) => (
            <div key={index} className="flex items-center gap-2">
              <CircleCheck className="h-4 w-4 shrink-0 text-text-faint" />
              <input
                value={objective}
                onChange={(e) =>
                  patch({
                    objectives: draft.objectives.map((o, i) => (i === index ? e.target.value : o)),
                  })
                }
                placeholder="Ví dụ: Nắm ý chính của bài học"
                className="h-9 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-navy outline-none placeholder:text-text-faint focus:border-navy"
              />
              <button
                type="button"
                onClick={() => patch({ objectives: draft.objectives.filter((_, i) => i !== index) })}
                aria-label="Xóa mục tiêu"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-faint transition-colors hover:bg-bg hover:text-navy"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-navy">Nội dung bài học</h2>
          <Button size="sm" variant="outline" onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPreview ? "Soạn thảo" : "Xem trước"}
          </Button>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-text-muted">
          Định dạng chữ, chèn ảnh, video YouTube và liên kết ngoài bằng thanh công cụ.
        </p>

        {showPreview ? (
          <LessonPreview draft={draft} objectives={filledObjectives} />
        ) : (
          <RichTextEditor value={draft.content} onChange={(content) => patch({ content })} />
        )}
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Lưu nháp</Button>
        <Button>
          <Save className="h-4 w-4" /> Đăng bài học
        </Button>
      </div>
    </div>
  );
}

/** Renders the draft exactly as a learner sees it — same `.rich-text` styles as the editor. */
function LessonPreview({
  draft,
  objectives,
}: {
  draft: TheoryLessonDraft;
  objectives: string[];
}) {
  return (
    <article className="rounded-md border border-border bg-bg p-5">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-primary-tint px-2.5 py-1 text-xs font-semibold text-primary">
          {draft.chapter || "Chưa đặt chương"}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <Clock className="h-3.5 w-3.5" /> {draft.durationMinutes} phút
        </span>
      </div>
      <h1 className="text-2xl font-bold text-navy">{draft.title || "Chưa có tiêu đề"}</h1>
      {draft.summary && <p className="mt-1.5 text-sm text-text-muted">{draft.summary}</p>}

      {objectives.length > 0 && (
        <div className="mt-4 rounded-md border border-primary/20 bg-primary-tint p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-navy">
            <Trophy className="h-4 w-4 text-primary" /> Sau bài này bạn có thể
          </p>
          <ul className="flex flex-col gap-1.5">
            {objectives.map((objective) => (
              <li key={objective} className="flex items-start gap-2 text-sm text-text">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {objective}
              </li>
            ))}
          </ul>
        </div>
      )}

      {draft.content.trim() ? (
        // The editor is the only writer of this HTML and it is never persisted or
        // fetched from elsewhere yet; revisit once lessons load from an API.
        <div className="rich-text mt-5" dangerouslySetInnerHTML={{ __html: draft.content }} />
      ) : (
        <p className="mt-5 text-sm text-text-faint">Chưa có nội dung để xem trước.</p>
      )}
    </article>
  );
}
