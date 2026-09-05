"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, Loader2, TriangleAlert, X } from "lucide-react";
import { Button, useToast } from "@codementor/ui";
import { ApiClientError } from "@codementor/api-client";
import { api } from "@/lib/api";
import { ExerciseCreatedCard } from "./exercise-created-card";

/**
 * Hộp xác nhận cho một đề xuất ghi của Lecter.
 *
 * Việc ghi do CHÍNH hộp này thi hành, bằng `api.exercises.*` — tức bằng token của người đang ngồi
 * trước màn hình, đi qua đúng guard `@Roles('lecturer')` của exercise-service. ai-service không
 * cầm credential ghi nào; nó chỉ đề xuất.
 */
/**
 * Kết cục của một đề xuất, dạng CHUỖI mà `respond()` đã trả về.
 *
 * Đây là thứ duy nhất còn lại sau khi tải lại trang: `ProposalCard` giữ kết cục trong `useState`,
 * còn lịch sử hội thoại chỉ mang theo `result` của lời gọi tool. Vì vậy `respond()` trả JSON —
 * xem `hitl.tsx`. Hội thoại lưu trước thay đổi đó có `result` là văn xuôi; parse hỏng thì rơi về
 * `null` chứ không được ném lỗi.
 */
export interface ProposalOutcome {
  outcome: "applied" | "rejected" | "failed";
  id?: string;
  slug?: string;
  title?: string;
  reason?: string;
  /** Chỉ `create_exercise` đặt: bài mới LUÔN là nháp (`exercises.status @default(draft)`). */
  status?: "draft";
  /** Câu chỉ dẫn dành cho model, không hiện lên giao diện. */
  note?: string;
}

export function readOutcome(result: string | undefined): ProposalOutcome | null {
  if (!result) return null;
  try {
    const parsed = JSON.parse(result) as ProposalOutcome;
    return parsed && typeof parsed.outcome === "string" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Một đề xuất ĐÃ xử lý xong, nạp lại từ lịch sử.
 *
 * Không có nút, và đó là điểm chính. Trước đây nhánh `complete` của `useHumanInTheLoop` không
 * được xử lý, nên sau khi tải lại trang một đề xuất đã áp dụng hiện lại nguyên thẻ xác nhận: bấm
 * "Tạo bài nháp" lần nữa là tạo thêm một bài trùng, bấm "Lưu nội dung" là PUT lại. Ở trạng thái
 * này `respond` là `undefined` nên agent cũng không biết gì mà sửa.
 *
 * Cũng nhờ đổi component mà `ProposalCard` không mount nữa: nó gọi `GET /exercises/{id}` lúc
 * mount để cảnh báo bài công khai, và mỗi thẻ lịch sử là một request thừa mỗi lần mở hội thoại.
 */
export function SettledProposal({
  title,
  outcome,
  lines,
  exerciseId,
}: {
  title: string;
  outcome: ProposalOutcome | null;
  /** Tóm tắt để hiện lại trên thẻ kết quả; cùng mảng đã đưa cho `ProposalCard`. */
  lines?: string[];
  /** Bài được sửa. Với `create_exercise` thì id chỉ có trong `outcome`, không có trong args. */
  exerciseId?: string;
}) {
  if (outcome?.outcome === "failed") {
    return (
      <p className="my-2 flex items-start gap-2 text-sm text-destructive">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>
          Không lưu được: {outcome.reason ?? "không rõ lý do"}
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Lecter đã nhận lỗi này và sẽ sửa lại đề xuất.
          </span>
        </span>
      </p>
    );
  }

  if (outcome?.outcome === "rejected") {
    return (
      <p className="my-2 flex items-center gap-2 text-sm text-muted-foreground">
        <X aria-hidden="true" className="size-4" />
        Đã bỏ qua: {title}
      </p>
    );
  }

  const id = exerciseId ?? outcome?.id;
  if (outcome?.outcome === "applied" && id) {
    return (
      <ExerciseCreatedCard
        exerciseId={id}
        lines={lines}
        status={outcome.status}
        title={outcome.title ?? title}
      />
    );
  }

  // Hội thoại lưu trước khi `respond()` trả JSON: không có id để dựng đường sang studio, nên
  // giữ nguyên dòng cũ thay vì hiện một thẻ không bấm được.
  return (
    <p className="my-2 flex items-center gap-2 text-sm text-muted-foreground">
      <Check aria-hidden="true" className="size-4 text-success" />
      Đã áp dụng: {title}
    </p>
  );
}

export interface ProposalCardProps {
  title: string;
  /** Tóm tắt thay đổi, mỗi dòng một ý. Đủ để duyệt mà không phải mở studio. */
  lines: string[];
  children?: ReactNode;
  /** Có thì hộp sẽ tự đọc trạng thái bài để cảnh báo khi bài đã công khai. */
  exerciseId?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<string>;
  onReject: () => void | Promise<void>;
  /**
   * Backend từ chối lệnh ghi. Bắt buộc phải báo NGƯỢC cho agent, không chỉ hiện toast: người
   * soạn không sửa được payload do model sinh ra, nên nếu agent không biết là mình vừa sai thì
   * hộp này thành ngõ cụt — chỉ còn nút "Bỏ qua".
   */
  onFailure: (reason: string) => void | Promise<void>;
}

export function ProposalCard({
  title,
  lines,
  children,
  exerciseId,
  confirmLabel = "Xác nhận",
  onConfirm,
  onReject,
  onFailure,
}: ProposalCardProps) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [settled, setSettled] = useState<"applied" | "rejected" | "failed" | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  // Bài đã công khai thì học viên đang học nó; sửa là thay đổi thứ người khác đang nhìn thấy.
  // Cờ này đọc từ backend NGAY TRONG hộp, không lấy từ tham số tool: model không đặt được nó.
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (!exerciseId) return;
    let cancelled = false;
    api.exercises
      .get(exerciseId)
      .then((exercise) => !cancelled && setPublished(exercise.status === "published"))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  // Cùng một hình dạng với lúc nạp lại từ lịch sử. Trạng thái cục bộ này chỉ phủ khoảng khắc
  // giữa lúc bấm nút và lúc lời gọi tool chuyển sang `complete`.
  if (settled) {
    return (
      <SettledProposal
        outcome={{ outcome: settled, reason: failure ?? undefined }}
        title={title}
      />
    );
  }

  const apply = async () => {
    setBusy(true);
    try {
      const message = await onConfirm();
      setSettled("applied");
      toast.success(message);
    } catch (cause) {
      // Thông điệp của backend nói rõ thiếu gì; đừng thay bằng câu chung chung. `message` là
      // MẢNG khi lỗi đến từ ValidationPipe của Nest ("constraints must be an array") và là chuỗi
      // khi đến từ domain — gộp lại trước khi hiện, không thì toast ra "[object Object]".
      const body =
        cause instanceof ApiClientError ? (cause.body as { message?: string | string[] }) : undefined;
      const detail = Array.isArray(body?.message) ? body.message.join("; ") : body?.message;
      const reason = detail ?? (cause instanceof Error ? cause.message : "Không áp dụng được");
      setFailure(reason);
      setSettled("failed");
      toast.error(reason);
      await onFailure(reason);
    }
  };

  return (
    <section className="my-2 rounded-lg border border-border bg-card p-3.5">
      <h3 className="text-sm font-semibold">{title}</h3>

      {published && (
        <p className="mt-2 flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-2.5 py-2 text-xs">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-warning" />
          Bài này đang công khai. Học viên sẽ thấy thay đổi ngay khi bạn xác nhận.
        </p>
      )}

      {lines.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {lines.map((line) => (
            <li key={line}>· {line}</li>
          ))}
        </ul>
      )}

      {children}

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button
          disabled={busy}
          onClick={() => {
            setSettled("rejected");
            void onReject();
          }}
          type="button"
          variant="outline"
        >
          Bỏ qua
        </Button>
        <Button disabled={busy} onClick={() => void apply()} type="button">
          {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
          {busy ? "Đang áp dụng…" : confirmLabel}
        </Button>
      </div>
    </section>
  );
}
