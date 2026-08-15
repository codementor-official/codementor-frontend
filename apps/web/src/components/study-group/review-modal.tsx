"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { REVIEW_STATUS_META } from "@/lib/study-group/group-detail-meta";
import type { Assignment, GroupExercise, GroupMember, ReviewStatus } from "@/types/study-group-detail";

export interface ReviewComment {
  id: string;
  author: string;
  body: string;
  at: string;
  outcome: ReviewStatus;
}

/**
 * Existing feedback on one member's submission, plus the form to add more. Shows the
 * submission history alongside, so a reviewer isn't writing blind.
 */
export function ReviewModal({
  assignment,
  member,
  exercise,
  comments,
  onClose,
  onSubmit,
}: {
  assignment: Assignment | null;
  member?: GroupMember;
  exercise?: GroupExercise;
  comments: ReviewComment[];
  onClose: () => void;
  onSubmit: (assignmentId: string, body: string, outcome: ReviewStatus) => void;
}) {
  const [body, setBody] = useState("");
  const [outcome, setOutcome] = useState<ReviewStatus>("approved");

  useEffect(() => {
    setBody("");
    setOutcome("approved");
  }, [assignment?.id]);

  if (!assignment) return null;

  const canSubmit = body.trim().length > 0;

  return (
    <Modal
      open
      onClose={onClose}
      width="lg"
      title={`Đánh giá bài của ${member?.name ?? "thành viên"}`}
      description={exercise?.title}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button
            size="sm"
            disabled={!canSubmit}
            onClick={() => onSubmit(assignment.id, body.trim(), outcome)}
          >
            Gửi nhận xét
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <section>
          <h3 className="mb-2 text-xs font-bold tracking-wide text-text-faint uppercase">
            Lịch sử nộp bài ({assignment.submissions.length})
          </h3>
          {assignment.submissions.length === 0 ? (
            <p className="rounded-md bg-bg px-3 py-2.5 text-sm text-text-muted">
              Thành viên chưa nộp lần nào.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {assignment.submissions.map((s) => (
                <li
                  key={s.version}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-border-soft px-3 py-2 text-xs"
                >
                  <span className="font-mono font-semibold text-text-muted">Lần {s.version}</span>
                  <span className="text-text-muted">{s.submittedAt}</span>
                  <span className="min-w-0 flex-1 truncate text-text">{s.detail}</span>
                  {s.isLate && <span className="font-semibold text-primary">Trễ hạn</span>}
                  <span className={s.result === "Đạt" ? "font-semibold text-navy" : "text-text-muted"}>
                    {s.result}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-xs font-bold tracking-wide text-text-faint uppercase">
            Nhận xét đã có ({comments.length})
          </h3>
          {comments.length === 0 ? (
            <p className="rounded-md bg-bg px-3 py-2.5 text-sm text-text-muted">
              Chưa có nhận xét nào cho bài nộp này.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {comments.map((c) => (
                <li key={c.id} className="rounded-md border border-border-soft p-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-text-faint" />
                    <span className="text-sm font-semibold text-navy">{c.author}</span>
                    <span className="text-xs text-text-faint">{c.at}</span>
                    <span className="ml-auto text-xs font-semibold text-text-muted">
                      {REVIEW_STATUS_META[c.outcome].label}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-text">{c.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <label htmlFor="review-body" className="mb-2 block text-xs font-bold tracking-wide text-text-faint uppercase">
            Viết nhận xét
          </label>
          <textarea
            id="review-body"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Chỉ ra chỗ cần sửa, hoặc xác nhận bài đã đạt yêu cầu..."
            className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-navy outline-none placeholder:text-text-faint focus:border-navy"
          />
          <fieldset className="mt-3">
            <legend className="mb-1.5 text-xs font-medium text-text-muted">Kết luận</legend>
            <div className="flex flex-wrap gap-2">
              {(["approved", "needsfix"] as const).map((value) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs font-semibold ${
                    outcome === value
                      ? "border-primary bg-primary-tint text-navy"
                      : "border-border text-text-muted hover:bg-bg"
                  }`}
                >
                  <input
                    type="radio"
                    name="review-outcome"
                    value={value}
                    checked={outcome === value}
                    onChange={() => setOutcome(value)}
                    className="sr-only"
                  />
                  {REVIEW_STATUS_META[value].label}
                </label>
              ))}
            </div>
          </fieldset>
        </section>
      </div>
    </Modal>
  );
}
