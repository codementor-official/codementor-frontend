"use client";

import { useEffect, useState } from "react";
import { CalendarClock, FileCode2, Lightbulb, ListChecks, Play, Sparkles, Upload, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EXERCISE_STATUS_META, formatDueDate } from "@/lib/study-group/group-detail-meta";
import type { ExerciseDifficulty, GroupDocument, GroupExercise } from "@/types/study-group-detail";

const DIFFICULTIES: ExerciseDifficulty[] = ["Cơ bản", "Trung bình", "Nâng cao"];

/* ---------- Preview ---------- */

export function ExercisePreviewModal({
  exercise,
  onClose,
}: {
  exercise: GroupExercise | null;
  onClose: () => void;
}) {
  if (!exercise) return null;
  return (
    <Modal
      open
      onClose={onClose}
      title={exercise.title}
      description={`Coding · ${exercise.estTime} · ${exercise.xp} XP`}
      width="lg"
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button size="sm" href={`/solve/${exercise.id}`}>
            <Play className="h-3.5 w-3.5" /> Làm bài
          </Button>
        </>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-text-muted">
        <span className="font-semibold text-navy">{exercise.difficulty}</span>
        <span>·</span>
        <span>{exercise.source === "ai" ? "AI đề xuất" : "Tự soạn"}</span>
        <span>·</span>
        <span>{exercise.topic}</span>
        <span>·</span>
        <span>{EXERCISE_STATUS_META[exercise.status].label}</span>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-md bg-bg px-3 py-2 text-xs"><span className="text-text-faint">Tác giả</span><div className="mt-1 flex items-center gap-1 font-semibold text-navy"><UserRound className="h-3.5 w-3.5 text-primary" />{exercise.authorName ?? "Nhóm học tập"}</div></div>
        <div className="rounded-md bg-bg px-3 py-2 text-xs"><span className="text-text-faint">Ngày tạo</span><div className="mt-1 font-semibold text-navy">{exercise.createdAt ?? "Chưa cập nhật"}</div></div>
        <div className="rounded-md bg-bg px-3 py-2 text-xs"><span className="text-text-faint">Hạn hoàn thành</span><div className="mt-1 flex items-center gap-1 font-semibold text-navy"><CalendarClock className="h-3.5 w-3.5 text-primary" />{formatDueDate(exercise.dueAt)}</div></div>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-text">{exercise.objective}</p>

      <h3 className="mb-2 text-xs font-bold tracking-wide text-text-faint uppercase">
        Ví dụ input / output
      </h3>
      <pre className="overflow-x-auto rounded-md bg-bg p-3 font-mono text-xs leading-relaxed text-text">
        <span className="font-semibold text-navy">Input:</span> {exercise.sampleInput}
        {"\n"}
        <span className="font-semibold text-navy">Output:</span> {exercise.sampleOutput}
      </pre>

      {exercise.criteria && (
        <>
          <h3 className="mt-4 mb-1.5 text-xs font-bold tracking-wide text-text-faint uppercase">
            Tiêu chí đánh giá
          </h3>
          <p className="text-sm text-text">{exercise.criteria}</p>
        </>
      )}

      {(exercise.constraints?.length ?? 0) > 0 && (
        <section className="mt-4">
          <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold tracking-wide text-text-faint uppercase"><ListChecks className="h-3.5 w-3.5" /> Ràng buộc</h3>
          <ul className="list-disc space-y-1 pl-4 text-sm text-text">{exercise.constraints?.map((constraint) => <li key={constraint}>{constraint}</li>)}</ul>
        </section>
      )}

      {(exercise.hints?.length ?? 0) > 0 && (
        <section className="mt-4 rounded-md border border-primary/20 bg-primary-tint p-3">
          <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-navy"><Lightbulb className="h-3.5 w-3.5 text-primary" /> Gợi ý khi bí ý tưởng</h3>
          <ul className="list-disc space-y-1 pl-4 text-sm text-text">{exercise.hints?.map((hint) => <li key={hint}>{hint}</li>)}</ul>
        </section>
      )}

      {exercise.phase && <p className="mt-4 border-t border-border-soft pt-3 text-xs text-text-faint">{exercise.phase}{exercise.refDoc ? ` · Tham khảo: ${exercise.refDoc}` : ""}</p>}
    </Modal>
  );
}

/* ---------- Edit ---------- */

export function ExerciseEditModal({
  exercise,
  onClose,
  onSave,
}: {
  exercise: GroupExercise | null;
  onClose: () => void;
  onSave: (next: GroupExercise) => void;
}) {
  const [form, setForm] = useState<GroupExercise | null>(exercise);
  useEffect(() => setForm(exercise), [exercise]);
  if (!exercise || !form) return null;

  const set = <K extends keyof GroupExercise>(key: K, value: GroupExercise[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <Modal
      open
      onClose={onClose}
      title="Chỉnh sửa bài tập"
      footer={
        <>
          {/* Statement and test cases are authored on the full editor page, not here. */}
          <Button
            size="sm"
            variant="outline"
            href={`/create-problem?exercise=${exercise.id}`}
            className="mr-auto"
          >
            <FileCode2 className="h-3.5 w-3.5" /> Sửa đề bài & test case
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button size="sm" disabled={!form.title.trim()} onClick={() => onSave(form)}>
            Lưu bài tập
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="ex-title" className="mb-1.5 block text-xs font-medium text-text-muted">
            Tên bài tập
          </label>
          <Input id="ex-title" value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>

        <div>
          <label htmlFor="ex-objective" className="mb-1.5 block text-xs font-medium text-text-muted">
            Nội dung yêu cầu
          </label>
          <textarea
            id="ex-objective"
            rows={3}
            value={form.objective}
            onChange={(e) => set("objective", e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-navy outline-none focus:border-navy"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="ex-due" className="mb-1.5 block text-xs font-medium text-text-muted">
              Thời hạn hoàn thành
            </label>
            <Input
              id="ex-due"
              value={formatDueDate(form.dueAt)}
              onChange={(e) => {
                const [d, m, y] = e.target.value.split("/");
                set("dueAt", d && m && y ? `${y}-${m}-${d}` : null);
              }}
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div>
            <label htmlFor="ex-phase" className="mb-1.5 block text-xs font-medium text-text-muted">
              Giai đoạn / chủ đề
            </label>
            <Input id="ex-phase" value={form.phase} onChange={(e) => set("phase", e.target.value)} />
          </div>
        </div>

        <div>
          <label htmlFor="ex-ref" className="mb-1.5 block text-xs font-medium text-text-muted">
            Tài liệu tham khảo
          </label>
          <Input
            id="ex-ref"
            value={form.refDoc}
            onChange={(e) => set("refDoc", e.target.value)}
            placeholder="Tên tài liệu trong nhóm hoặc liên kết ngoài"
          />
        </div>

        <div>
          <label htmlFor="ex-criteria" className="mb-1.5 block text-xs font-medium text-text-muted">
            Tiêu chí đánh giá
          </label>
          <textarea
            id="ex-criteria"
            rows={2}
            value={form.criteria}
            onChange={(e) => set("criteria", e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-navy outline-none focus:border-navy"
          />
        </div>

        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-text-muted">Độ khó</legend>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => set("difficulty", d)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                  form.difficulty === d
                    ? "border-navy bg-navy text-on-ink"
                    : "border-border text-text-muted hover:bg-bg"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="ex-xp" className="mb-1.5 block text-xs font-medium text-text-muted">
              Điểm XP
            </label>
            <Input
              id="ex-xp"
              value={String(form.xp)}
              onChange={(e) => set("xp", Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label htmlFor="ex-est" className="mb-1.5 block text-xs font-medium text-text-muted">
              Thời gian ước tính
            </label>
            <Input id="ex-est" value={form.estTime} onChange={(e) => set("estTime", e.target.value)} />
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Create ---------- */

type CreateSource = "document" | "ai" | "personal";

const SOURCE_CARDS: { key: CreateSource; icon: typeof Sparkles; title: string; desc: string }[] = [
  {
    key: "document",
    icon: FileCode2,
    title: "Từ tài liệu",
    desc: "AI đọc tài liệu của nhóm hoặc tệp bạn tải lên và soạn bài tập bám sát nội dung.",
  },
  {
    key: "ai",
    icon: Sparkles,
    title: "Tạo mới bằng AI",
    desc: "Nhập chủ đề, độ khó và kỹ năng cần luyện — AI tự soạn bài tập từ đầu.",
  },
  {
    key: "personal",
    icon: FileCode2,
    title: "Từ bài tập cá nhân",
    desc: "Chọn một bài bạn đã soạn trước đó và giao lại cho nhóm này.",
  },
];

export function CreateExerciseModal({
  open,
  onClose,
  documents,
  personalExercises,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  documents: GroupDocument[];
  personalExercises: { id: string; title: string; difficulty: ExerciseDifficulty; topic: string }[];
  onCreate: (title: string) => void;
}) {
  const [source, setSource] = useState<CreateSource | null>(null);
  const [docChoice, setDocChoice] = useState<"group" | "upload">("group");
  const [docId, setDocId] = useState("");
  const [topic, setTopic] = useState("");
  const [personalId, setPersonalId] = useState("");

  useEffect(() => {
    if (!open) return;
    setSource(null);
    setDocChoice("group");
    setDocId("");
    setTopic("");
    setPersonalId("");
  }, [open]);

  const canSubmit =
    source === "document"
      ? docChoice === "upload" || docId !== ""
      : source === "ai"
        ? topic.trim() !== ""
        : personalId !== "";

  const submit = () => {
    if (source === "personal") {
      onCreate(personalExercises.find((p) => p.id === personalId)?.title ?? "Bài tập mới");
    } else if (source === "ai") {
      onCreate(`Bài luyện ${topic.trim()}`);
    } else {
      const doc = documents.find((d) => d.id === docId);
      onCreate(`Bài tập từ ${doc?.title ?? "tài liệu đã tải lên"}`);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="lg"
      title="Tạo bài tập"
      description={source ? undefined : "Chọn nguồn để tạo bài tập cho nhóm."}
      footer={
        source ? (
          <>
            <Button size="sm" variant="outline" onClick={() => setSource(null)} className="mr-auto">
              ← Chọn nguồn khác
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button size="sm" disabled={!canSubmit} onClick={submit}>
              Tạo bài tập
            </Button>
          </>
        ) : undefined
      }
    >
      {!source && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SOURCE_CARDS.map((card) => (
            <button
              key={card.key}
              type="button"
              onClick={() => setSource(card.key)}
              className="flex flex-col items-center rounded-lg border border-border p-5 text-center hover:border-primary hover:bg-primary-tint"
            >
              <card.icon className="mb-2 h-6 w-6 text-primary" />
              <span className="mb-1 text-sm font-bold text-navy">{card.title}</span>
              <span className="text-xs leading-relaxed text-text-muted">{card.desc}</span>
            </button>
          ))}
        </div>
      )}

      {source === "document" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {(["group", "upload"] as const).map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => setDocChoice(choice)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                  docChoice === choice
                    ? "border-primary bg-primary-tint text-navy"
                    : "border-border text-text-muted hover:bg-bg"
                }`}
              >
                {choice === "group" ? "Tài liệu trong nhóm" : "Tải lên tài liệu mới"}
              </button>
            ))}
          </div>

          {docChoice === "group" ? (
            <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
              {documents.length === 0 && (
                <li className="py-6 text-center text-sm text-text-faint">
                  Nhóm chưa có tài liệu nào đã duyệt.
                </li>
              )}
              {documents.map((doc) => (
                <li key={doc.id}>
                  <label
                    className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 ${
                      docId === doc.id ? "border-primary bg-primary-tint" : "border-border-soft hover:bg-bg"
                    }`}
                  >
                    <input
                      type="radio"
                      name="create-doc"
                      checked={docId === doc.id}
                      onChange={() => setDocId(doc.id)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-navy">{doc.title}</span>
                      <span className="block text-xs text-text-faint">
                        {doc.type} · {doc.topic}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center rounded-lg border-2 border-dashed border-border bg-bg px-6 py-8 text-center">
              <Upload className="mb-2 h-6 w-6 text-text-faint" />
              <p className="text-sm text-text-muted">
                Tải tài liệu lên ở tab Tài liệu, sau đó chọn nó ở đây.
              </p>
            </div>
          )}
        </div>
      )}

      {source === "ai" && (
        <div>
          <label htmlFor="create-topic" className="mb-1.5 block text-xs font-medium text-text-muted">
            Chủ đề
          </label>
          <Input
            id="create-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="vd. Đệ quy, Con trỏ, Sắp xếp..."
          />
          <p className="mt-2 text-xs text-text-faint">
            AI sẽ soạn đề bài, test case và gợi ý theo chủ đề này.
          </p>
        </div>
      )}

      {source === "personal" && (
        <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
          {personalExercises.map((ex) => (
            <li key={ex.id}>
              <label
                className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 ${
                  personalId === ex.id ? "border-primary bg-primary-tint" : "border-border-soft hover:bg-bg"
                }`}
              >
                <input
                  type="radio"
                  name="create-personal"
                  checked={personalId === ex.id}
                  onChange={() => setPersonalId(ex.id)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-navy">{ex.title}</span>
                  <span className="block text-xs text-text-faint">
                    {ex.difficulty} · {ex.topic}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
