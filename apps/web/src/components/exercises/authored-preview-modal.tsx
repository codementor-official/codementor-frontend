"use client";

import { BookOpen, CircleCheck, Clock, Play, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { AuthoredProblem } from "@/types/authored-problem";

const DIFFICULTY_LABEL = { easy: "Cơ bản", medium: "Trung bình", hard: "Nâng cao" } as const;

function Meta({ items }: { items: [string, string][] }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-md bg-bg px-3 py-2">
          <div className="text-2xs text-text-faint">{label}</div>
          <div className="mt-0.5 text-sm font-semibold text-navy">{value}</div>
        </div>
      ))}
    </div>
  );
}

function AssignedGroups({ groups }: { groups: string[] }) {
  return (
    <section className="mt-5 border-t border-border-soft pt-4">
      <h3 className="mb-2 flex items-center gap-1.5 text-2xs font-bold tracking-wide text-text-faint uppercase">
        <Users className="h-3.5 w-3.5" /> Nhóm đã bàn giao
      </h3>
      {groups.length === 0 ? (
        <p className="text-sm text-text-faint">Chưa giao cho nhóm nào.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {groups.map((group) => (
            <li key={group} className="flex items-center gap-2 text-sm text-text">
              <CircleCheck className="h-4 w-4 shrink-0 text-text-faint" />
              {group}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Read-only look at an authored item, with the one action that matters for its kind:
 * a code problem opens in the solve workspace, a lesson opens in the reader.
 */
export function AuthoredPreviewModal({
  problem,
  onClose,
}: {
  problem: AuthoredProblem | null;
  onClose: () => void;
}) {
  if (!problem) return null;

  const statusLabel = problem.status === "draft" ? "Bản nháp" : "Đã đăng";

  return (
    <Modal
      open
      onClose={onClose}
      width="lg"
      title={problem.title}
      description={`${problem.kind === "code" ? "Bài code" : "Bài lý thuyết"} · ${statusLabel} · cập nhật ${problem.updatedAt}`}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          {problem.kind === "code" ? (
            <Button size="sm" href={`/solve/${problem.solveSlug}?returnTo=/exercises`}>
              <Play className="h-3.5 w-3.5" /> Giải bài
            </Button>
          ) : (
            <Button size="sm" href={`/lessons/${problem.id}`}>
              <BookOpen className="h-3.5 w-3.5" /> Xem chi tiết
            </Button>
          )}
        </>
      }
    >
      {problem.kind === "code" ? (
        <>
          <Meta
            items={[
              ["Độ khó", DIFFICULTY_LABEL[problem.difficulty]],
              ["Ngôn ngữ", `${problem.languageCount}`],
              ["Test case", `${problem.testCaseCount}`],
              ["Đã giải", problem.solverCount === 0 ? "—" : `${problem.solverCount}`],
            ]}
          />

          <h3 className="mb-1.5 text-2xs font-bold tracking-wide text-text-faint uppercase">Đề bài</h3>
          <p className="text-sm leading-relaxed text-text">{problem.statement}</p>

          <h3 className="mt-4 mb-1.5 text-2xs font-bold tracking-wide text-text-faint uppercase">
            Ví dụ
          </h3>
          <div className="flex flex-col gap-2">
            {problem.examples.map((example) => (
              <pre
                key={example.input}
                className="overflow-x-auto rounded-md bg-bg p-3 font-mono text-xs leading-relaxed text-text"
              >
                <span className="font-semibold text-navy">Input:</span> {example.input}
                {"\n"}
                <span className="font-semibold text-navy">Output:</span> {example.output}
              </pre>
            ))}
          </div>

          {problem.constraints.length > 0 && (
            <>
              <h3 className="mt-4 mb-1.5 text-2xs font-bold tracking-wide text-text-faint uppercase">
                Ràng buộc
              </h3>
              <ul className="list-disc space-y-1 pl-4 text-sm text-text">
                {problem.constraints.map((constraint) => (
                  <li key={constraint}>{constraint}</li>
                ))}
              </ul>
            </>
          )}

          {problem.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {problem.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-bg px-2.5 py-1 text-xs text-navy">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <Meta
            items={[
              ["Chương", problem.chapter],
              ["Thời lượng", `${problem.durationMinutes} phút`],
              ["Mục tiêu", `${problem.objectiveCount}`],
              ["Lượt đọc", problem.readerCount === 0 ? "—" : `${problem.readerCount}`],
            ]}
          />

          <p className="text-sm leading-relaxed text-text-muted">{problem.summary}</p>

          <div className="mt-4 rounded-md border border-primary/20 bg-primary-tint p-4">
            <p className="mb-2 text-sm font-bold text-navy">Sau bài này bạn có thể</p>
            <ul className="flex flex-col gap-1.5">
              {problem.objectives.map((objective) => (
                <li key={objective} className="flex items-start gap-2 text-sm text-text">
                  <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {objective}
                </li>
              ))}
            </ul>
          </div>

          <h3 className="mt-4 mb-1.5 flex items-center gap-1.5 text-2xs font-bold tracking-wide text-text-faint uppercase">
            <Clock className="h-3.5 w-3.5" /> Xem trước nội dung
          </h3>
          {/* Capped so the modal previews the lesson rather than becoming the lesson —
           * "Xem chi tiết" is the way to read it in full. Authored by our own editor,
           * never fetched from elsewhere; revisit if lessons ever load from an API. */}
          <div className="max-h-72 overflow-y-auto rounded-md border border-border bg-bg p-4">
            <div className="rich-text" dangerouslySetInnerHTML={{ __html: problem.contentHtml }} />
          </div>
        </>
      )}

      <AssignedGroups groups={problem.assignedGroups} />
    </Modal>
  );
}
