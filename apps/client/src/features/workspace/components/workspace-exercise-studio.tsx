"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Upload } from "lucide-react";
import {
  ExerciseBriefForm,
  ExerciseCodeForm,
  StudioShell,
  StudioScroll,
  clearDraft,
  draftStorageKey,
  exerciseBriefBlocker,
  readDraft,
  useDraftAutosave,
  type ExerciseContent,
  type ExerciseDraft,
  type TagOption,
} from "@codementor/solve";
import {
  Modal,
  ResizeHandle,
  Select,
  StatusBadge,
  useResolvedTheme,
  useToast,
} from "@codementor/ui";
import { Group, Panel } from "react-resizable-panels";
import { BreadcrumbTitle } from "@/components/app-breadcrumb";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { api } from "@/lib/api";
import {
  messageOf,
  parseInputOutputPairs,
  parseProblemText,
  slugifyExercise,
  splitLines,
  toLocalInput,
} from "../exercise-authoring";
import type {
  WorkspaceContentPage,
  WorkspaceDetail,
  WorkspaceDocument,
  WorkspaceExerciseDetail,
  WorkspaceMember,
} from "../types";
import { WorkspaceMemberSelector } from "./workspace-member-selector";

const inputClass =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm text-navy";

const EMPTY_DOCUMENTS: WorkspaceContentPage<WorkspaceDocument> = {
  items: [],
  page: 1,
  limit: 8,
  total: 0,
  totalPages: 0,
};

const EMPTY_CONTENT: ExerciseContent = {
  statement: "",
  ioMode: "stdin_stdout",
  testCases: [],
  languages: [],
  evaluation: { checker: "trimmed", stopOnFirstFailure: false },
};

type StudioTab = "content" | "assignment";

/**
 * Studio bài tập của Workspace — một TRANG, không phải hộp thoại.
 *
 * Chỉ có MỘT form soạn bài: hai nguồn còn lại (dán đề từ nền tảng khác, sinh bản nháp từ
 * tài liệu đã duyệt) là hai nút mở hộp thoại rồi đổ kết quả vào chính form này. Trước đây
 * chúng là ba thẻ ngang hàng, nên "Tự nhập" trông như một lựa chọn phải chọn lại sau mỗi
 * lần nhập, còn nội dung đang soạn thì biến mất khỏi màn hình lúc xem tab khác.
 */
export function WorkspaceExerciseStudio({
  slug,
  exerciseId,
}: {
  slug: string;
  exerciseId?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const theme = useResolvedTheme();

  const [detail, setDetail] = useState<WorkspaceDetail | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [exercise, setExercise] = useState<WorkspaceExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<StudioTab>("content");

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [statement, setStatement] = useState("");
  const [exerciseSlug, setExerciseSlug] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("30");
  const [timeLimitMs, setTimeLimitMs] = useState("1000");
  const [memoryLimitKb, setMemoryLimitKb] = useState("262144");
  const [studioContent, setStudioContent] = useState<ExerciseContent>(EMPTY_CONTENT);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [generatedByAi, setGeneratedByAi] = useState(false);

  const [dueAt, setDueAt] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const backHref = `/workspace/${encodeURIComponent(slug)}?tab=exercises`;
  const storageKey = draftStorageKey(
    "workspace-exercise",
    exerciseId ?? `new:${slug}`,
  );

  const canAssign =
    detail !== null &&
    (detail.currentMembership.role === "owner" ||
      detail.currentMembership.permissions.assign_exercise);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [nextDetail, nextMembers, nextExercise] = await Promise.all([
          api.workspaces.detail(slug),
          api.workspaces.members(slug, { limit: 100 }),
          exerciseId
            ? api.workspaces.workspaceExerciseDetail(slug, exerciseId)
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setDetail(nextDetail);
        setMembers(nextMembers.items.filter((member) => member.role !== "owner"));
        setExercise(nextExercise);
        if (nextExercise) {
          const content = nextExercise.content ?? {};
          setTitle(nextExercise.title);
          setSummary(nextExercise.summary ?? "");
          setDifficulty(nextExercise.difficulty);
          setStatement(String(content.statement ?? ""));
          setExerciseSlug(nextExercise.slug);
          setEstimatedMinutes(String(nextExercise.estimatedMinutes ?? 30));
          setTimeLimitMs(String(nextExercise.timeLimitMs ?? 1000));
          setMemoryLimitKb(String(nextExercise.memoryLimitKb ?? 262144));
          setStudioContent(content as ExerciseContent);
          setTagIds(nextExercise.tagIds ?? []);
          setDueAt(nextExercise.dueAt ? toLocalInput(nextExercise.dueAt) : "");
          setMemberIds(
            nextExercise.assignedMemberIds ??
              nextExercise.assignments?.map((assignment) => assignment.memberId) ??
              [],
          );
        }
      } catch (cause) {
        if (!cancelled) setError(messageOf(cause, "Không mở được Studio bài tập."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, exerciseId]);

  // Chủ đề chỉ để CHỌN: `POST /tags` dành cho admin và giảng viên, nên không truyền
  // `onCreateTag` — hỏng thì bỏ luôn khối chủ đề, soạn bài không dừng vì một ô phụ.
  useEffect(() => {
    let cancelled = false;
    api.tags
      .list()
      .then((loaded) => !cancelled && setTags(loaded))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const draft: ExerciseDraft = {
    slug: exerciseSlug || slugifyExercise(title),
    title,
    summary,
    difficulty,
    tagIds,
    estimatedMinutes,
    timeLimitMs,
    memoryLimitKb,
    content: { ...studioContent, statement },
  };
  const updateDraft = (next: ExerciseDraft) => {
    setExerciseSlug(next.slug);
    setTitle(next.title);
    setSummary(next.summary);
    setDifficulty(next.difficulty as "easy" | "medium" | "hard");
    setTagIds(next.tagIds ?? []);
    setEstimatedMinutes(next.estimatedMinutes);
    setTimeLimitMs(next.timeLimitMs);
    setMemoryLimitKb(next.memoryLimitKb);
    setStatement(next.content.statement ?? "");
    setStudioContent(next.content);
  };

  const restoredKey = useRef<string | null>(null);
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    // Chờ bản đã lưu về trước: khôi phục sớm hơn thì effect nạp bài ghi đè mất bản nháp.
    if (loading || restoredKey.current === storageKey) return;
    restoredKey.current = storageKey;
    const stored = readDraft<ExerciseDraft>(storageKey);
    setRestored(true);
    if (!stored) return;
    updateDraft(stored.value);
    toast.success("Đã khôi phục bản nháp chưa lưu");
    // `updateDraft` dựng lại mỗi lần render; chốt trên đã đảm bảo chỉ chạy một lần.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, storageKey]);

  const blocker = exerciseBriefBlocker(draft, { slugLocked: Boolean(exerciseId) });
  useDraftAutosave(storageKey, draft, {
    ready: restored,
    dirty: Boolean(title.trim() || statement.trim()),
  });

  const applyImport = (parsed: ReturnType<typeof parseProblemText>, source: string) => {
    setGeneratedByAi(false);
    const imported = [
      parsed.statement,
      parsed.inputFormat ? `## Đầu vào\n${parsed.inputFormat}` : "",
      parsed.outputFormat ? `## Đầu ra\n${parsed.outputFormat}` : "",
      source,
    ]
      .filter(Boolean)
      .join("\n\n");
    setTitle(parsed.title);
    setSummary(parsed.summary);
    setExerciseSlug(slugifyExercise(parsed.title));
    setStatement(imported);
    setStudioContent((current) => ({
      ...current,
      statement: imported,
      constraints: splitLines(parsed.constraints),
      examples: parseInputOutputPairs(parsed.examples).map((item) => ({
        input: item.input,
        output: item.output,
      })),
    }));
    setImportOpen(false);
    // Nhập xong mà đang đứng ở tab giao bài thì không thấy gì đã đổi — kéo về đúng chỗ.
    setTab("content");
    toast.success("Đã chuyển nội dung sang form; hãy rà soát trước khi lưu");
  };

  const applyAiDraft = (generated: {
    title: string;
    summary: string;
    difficulty: "easy" | "medium" | "hard";
    content: Record<string, unknown>;
  }) => {
    setTitle(generated.title);
    setSummary(generated.summary);
    setDifficulty(generated.difficulty);
    setStatement(String(generated.content.statement ?? ""));
    setExerciseSlug(slugifyExercise(generated.title));
    setStudioContent(generated.content as ExerciseContent);
    setGeneratedByAi(true);
    setAiOpen(false);
    setTab("content");
  };

  const save = async () => {
    if (!title.trim() || !statement.trim()) {
      toast.error("Vui lòng nhập tiêu đề và đề bài");
      return;
    }
    setBusy(true);
    try {
      const content = { ...studioContent, statement: statement.trim() };
      const metadata = {
        tagIds,
        slug: draft.slug.trim(),
        estimatedMinutes: Number(estimatedMinutes) || null,
        timeLimitMs: Number(timeLimitMs) || 1000,
        memoryLimitKb: Number(memoryLimitKb) || 262144,
      };
      if (exercise) {
        await api.workspaces.updateWorkspaceExercise(slug, exercise.id, {
          ...metadata,
          title: title.trim(),
          summary: summary.trim() || null,
          difficulty,
          ...(canAssign
            ? { dueAt: dueAt ? new Date(dueAt).toISOString() : null, memberIds }
            : {}),
          content,
        });
      } else {
        await api.workspaces.createWorkspaceExercise(slug, {
          ...metadata,
          title: title.trim(),
          summary: summary.trim() || undefined,
          difficulty,
          source: generatedByAi ? "ai" : "manual",
          dueAt: canAssign && dueAt ? new Date(dueAt).toISOString() : undefined,
          memberIds: canAssign ? memberIds : [],
          content,
        });
      }
      clearDraft(storageKey);
      toast.success(
        exercise ? "Đã cập nhật bài tập từ Studio" : "Đã tạo và phân công bài tập",
      );
      router.push(backHref);
    } catch (cause) {
      toast.error(messageOf(cause));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <p className="flex items-center gap-2 py-10 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Đang mở Studio…
      </p>
    );
  }
  if (error || !detail) {
    return <p className="py-10 text-sm text-danger">{error ?? "Không có dữ liệu."}</p>;
  }

  return (
    <>
      {/* Đường dẫn trên đầu đọc "… › Nhóm AI › Two Sum": "exercises" và "studio" là đoạn
          trong suốt, còn id bài thì chỉ trang này biết tên thật của nó. */}
      <BreadcrumbTitle
        slug={exerciseId ?? "new"}
        title={exerciseId ? title || "Bài tập" : "Bài tập mới"}
      />
      <StudioShell
        backHref={backHref}
        backLabel="Bài tập nhóm"
        title={title || "Bài tập chưa đặt tên"}
        slug={draft.slug || "chưa có slug"}
        meta={`${timeLimitMs} ms · ${Math.round(Number(memoryLimitKb) / 1024)} MB`}
        status={
          <StatusBadge tone={exercise ? "success" : "neutral"}>
            {exercise ? "Đã đăng trong nhóm" : "Bài mới"}
          </StatusBadge>
        }
        tabs={{
          value: tab,
          onChange: (value) => setTab(value as StudioTab),
          options: [
            { value: "content", label: "Nội dung bài" },
            ...(canAssign ? [{ value: "assignment", label: "Giao bài" }] : []),
          ],
        }}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="h-3.5 w-3.5" />
              Nhập từ đề có sẵn
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAiOpen(true)}>
              <Sparkles className="h-3.5 w-3.5" />
              AI từ tài liệu
            </Button>
            <Button
              size="sm"
              onClick={() => void save()}
              disabled={busy || blocker !== undefined}
              title={blocker}
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {exercise ? "Lưu thay đổi" : "Lưu bài tập"}
            </Button>
          </div>
        }
      >
        {tab === "content" ? (
          // Chiều cao cố định vì trang này nằm trong khung cuộn chung của ứng dụng: hai
          // pane cần một chiều cao có thật để chia nhau, `h-full` ở đây sẽ là 0.
          <div className="h-[min(74vh,860px)] min-h-[540px] overflow-hidden rounded-xl border border-border-soft bg-bg/30">
            <Group orientation="horizontal" className="h-full">
              <Panel id="workspace-brief" defaultSize="50%" minSize="30%">
                <div className="h-full overflow-y-auto p-3">
                  <ExerciseBriefForm
                    value={draft}
                    onChange={updateDraft}
                    slugLocked={Boolean(exerciseId)}
                    tagOptions={tags}
                  />
                </div>
              </Panel>
              <ResizeHandle orientation="horizontal" />
              <Panel id="workspace-code" defaultSize="50%" minSize="30%">
                <div className="h-full overflow-y-auto p-3">
                  <ExerciseCodeForm
                    value={draft}
                    onChange={updateDraft}
                    judge={api.judge}
                    theme={theme}
                  />
                </div>
              </Panel>
            </Group>
          </div>
        ) : (
          <StudioScroll>
            <div className="space-y-4">
              <label className="block text-xs font-medium text-text-muted">
                Hạn nộp của Workspace
                <input
                  type="datetime-local"
                  className={`${inputClass} mt-1 block w-full max-w-sm`}
                  value={dueAt}
                  onChange={(event) => setDueAt(event.target.value)}
                />
              </label>
              <WorkspaceMemberSelector
                members={members}
                selectedIds={memberIds}
                onChange={setMemberIds}
              />
            </div>
          </StudioScroll>
        )}
      </StudioShell>

      <ImportProblemModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onApply={applyImport}
      />
      <AiDraftModal
        open={aiOpen}
        slug={slug}
        difficulty={difficulty}
        onClose={() => setAiOpen(false)}
        onApply={applyAiDraft}
      />
    </>
  );
}

/** Dán đề từ LeetCode/Codeforces rồi đổ vào form. Không gọi mạng — chỉ tách chữ. */
function ImportProblemModal({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (parsed: ReturnType<typeof parseProblemText>, source: string) => void;
}) {
  const [platform, setPlatform] = useState("leetcode");
  const [url, setUrl] = useState("");
  const [raw, setRaw] = useState("");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nhập đề từ nền tảng khác"
      description="Studio nhận diện các mục Description, Input, Output, Constraints và Example trước khi chuyển sang form chỉnh sửa."
      width="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={!raw.trim()}
            onClick={() =>
              onApply(
                parseProblemText(raw),
                url.trim() ? `Nguồn tham khảo (${platform}): ${url.trim()}` : "",
              )
            }
          >
            Chuyển sang form
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-[220px_1fr]">
          <label className="min-w-0 text-xs font-medium text-text-muted">
            Nền tảng
            <Select
              label="Nền tảng"
              value={platform}
              onChange={setPlatform}
              className="mt-1 w-full"
              options={[
                { value: "leetcode", label: "LeetCode" },
                { value: "codeforces", label: "Codeforces" },
                { value: "other", label: "Nền tảng khác" },
              ]}
            />
          </label>
          <label className="min-w-0 text-xs font-medium text-text-muted">
            URL bài tập (không bắt buộc)
            <input
              className={`${inputClass} mt-1 block w-full`}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://leetcode.com/problems/..."
            />
          </label>
        </div>
        <textarea
          className={`${inputClass} min-h-48 w-full resize-y font-mono`}
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          placeholder="Dán đề bài từ LeetCode, Codeforces hoặc nền tảng khác..."
        />
      </div>
    </Modal>
  );
}

/** Sinh bản nháp từ tài liệu ĐÃ DUYỆT của workspace. Kết quả vẫn phải rà soát trong form. */
function AiDraftModal({
  open,
  slug,
  difficulty,
  onClose,
  onApply,
}: {
  open: boolean;
  slug: string;
  difficulty: "easy" | "medium" | "hard";
  onClose: () => void;
  onApply: (draft: {
    title: string;
    summary: string;
    difficulty: "easy" | "medium" | "hard";
    content: Record<string, unknown>;
  }) => void;
}) {
  const toast = useToast();
  const [prompt, setPrompt] = useState("");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState(EMPTY_DOCUMENTS);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setDocumentsLoading(true);
    try {
      setDocuments(
        await api.workspaces.documents(slug, {
          page,
          limit: 8,
          q: query.trim() || undefined,
          status: "published",
        }),
      );
    } catch (error) {
      toast.error(messageOf(error, "Không thể tải tài liệu đã duyệt."));
    } finally {
      setDocumentsLoading(false);
    }
  }, [page, query, slug, toast]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timer);
  }, [open, load]);

  const generate = async () => {
    setBusy(true);
    try {
      const generated = await api.workspaces.generateWorkspaceExerciseDraft(slug, {
        prompt: prompt.trim(),
        difficulty,
        documentIds: selectedIds,
      });
      onApply(generated);
      toast.success(
        `Đã tạo bản nháp từ ${generated.sourceDocuments.length} tài liệu đã duyệt`,
      );
    } catch (error) {
      toast.error(messageOf(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tạo bản nháp từ tài liệu"
      description="Hệ thống chỉ đọc tài liệu đã duyệt của Workspace và trả về bản nháp để bạn rà soát."
      width="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Hủy
          </Button>
          <Button
            onClick={() => void generate()}
            disabled={busy || !prompt.trim() || selectedIds.length === 0}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Tạo bản nháp
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="rounded-lg border border-border-soft bg-bg/40 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-52 flex-1">
              <span className="sr-only">Tìm tài liệu đã duyệt</span>
              <input
                className={`${inputClass} h-9 w-full py-1.5 text-xs`}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Tìm tài liệu đã duyệt..."
              />
            </label>
            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
              {selectedIds.length} tài liệu đã chọn
            </span>
          </div>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {documentsLoading ? (
              <p className="col-span-full py-4 text-center text-xs text-text-faint">
                Đang tải tài liệu...
              </p>
            ) : documents.items.length === 0 ? (
              <p className="col-span-full py-4 text-center text-xs text-text-faint">
                Không tìm thấy tài liệu đã duyệt.
              </p>
            ) : (
              documents.items.map((document) => {
                const checked = selectedIds.includes(document.id);
                return (
                  <label
                    key={document.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 text-xs ${checked ? "border-primary bg-primary/5" : "border-border-soft"}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedIds((current) =>
                          current.includes(document.id)
                            ? current.filter((id) => id !== document.id)
                            : [...current, document.id],
                        )
                      }
                    />
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
            <div className="mt-2">
              <Pagination
                page={page}
                pageCount={documents.totalPages}
                onChange={setPage}
                label="Phân trang tài liệu đã duyệt"
              />
            </div>
          )}
        </div>
        <textarea
          className={`${inputClass} min-h-28 w-full resize-y`}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ví dụ: Tạo bài tập BFS tìm đường đi ngắn nhất..."
        />
      </div>
    </Modal>
  );
}
