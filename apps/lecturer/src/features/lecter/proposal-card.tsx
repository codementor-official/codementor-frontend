"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Loader2, TriangleAlert, X } from "lucide-react";
import { Button, useToast } from "@codementor/ui";
import { ApiClientError } from "@codementor/api-client";
import { api } from "@/lib/api";
import { ContentCreatedCard } from "./content-created-card";

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
/**
 * Nội dung mà một đề xuất đụng tới. Bài code và khóa học nằm ở hai service, hai route studio,
 * nên mọi chỗ đọc trạng thái hay dựng link đều phải rẽ theo `kind`.
 */
export interface ContentTarget {
  kind: "exercise" | "course";
  id: string;
}

export function studioHref({ kind, id }: ContentTarget): string {
  return kind === "course" ? `/courses/${id}/studio` : `/exercises/${id}/studio`;
}

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

/**
 * Câu lỗi backend, dạng model đọc được.
 *
 * `ApiClientError.message` chỉ là "Request failed with status 400" — vô dụng. Thứ nói rõ sai ở
 * đâu nằm trong `.body.message`, và nó là MẢNG khi lỗi đến từ `ValidationPipe` của Nest
 * ("media.url must be an URL address"), là chuỗi khi đến từ tầng domain.
 *
 * Xuất ra ngoài vì có hơn một chỗ bắt lỗi: `save_lesson_contents` chạy vòng lặp PUT nên nó tự
 * bắt, và bản đầu tiên của nó chỉ đọc `cause.message` rồi ném lại một `Error` thường — chi tiết
 * mất sạch ở cả hai tầng, agent nhận đúng câu "Request failed with status 400" và không sửa nổi.
 */
export function describeApiError(cause: unknown): string {
  const body =
    cause instanceof ApiClientError ? (cause.body as { message?: string | string[] }) : undefined;
  const detail = Array.isArray(body?.message) ? body.message.join("; ") : body?.message;
  return detail ?? (cause instanceof Error ? cause.message : "Không áp dụng được");
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
  target,
}: {
  title: string;
  outcome: ProposalOutcome | null;
  /** Tóm tắt để hiện lại trên thẻ kết quả; cùng mảng đã đưa cho `ProposalCard`. */
  lines?: string[];
  /** Nội dung được sửa. Với `create_*` thì id chỉ có trong `outcome`, không có trong args. */
  target?: ContentTarget;
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

  const id = target?.id ?? outcome?.id;
  if (outcome?.outcome === "applied" && id) {
    return (
      <ContentCreatedCard
        href={studioHref({ kind: target?.kind ?? "exercise", id })}
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

/** Đủ để cảnh báo; cả `Exercise` lẫn `Course` đều rót vừa hình dạng này. */
interface CourseLikeInfo {
  status?: string;
  chapters?: { id: string; title: string; lessons?: { id: string; title: string }[] }[];
}

export interface ProposalCardProps {
  title: string;
  /** Tóm tắt thay đổi, mỗi dòng một ý. Đủ để duyệt mà không phải mở studio. */
  lines: string[];
  children?: ReactNode;
  /** Có thì hộp sẽ tự đọc trạng thái từ backend để cảnh báo và để dựng link studio. */
  target?: ContentTarget;
/**
   * Id những chương/bài sẽ bị XÓA nếu xác nhận. Chỉ `save_curriculum` truyền: lệnh lưu cây thay
   * toàn bộ cây, nên đây là chỗ duy nhất Lecter phá được dữ liệu của học viên thật.
   *
   * Truyền id chứ không truyền tên: tên được tra từ chính khóa học mà hộp này vừa đọc về, nên
   * thứ người duyệt nhìn thấy luôn là dữ liệu thật, không phải nhãn do model tự đặt.
   */
  removeIds?: string[];
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
  target,
  removeIds,
  confirmLabel = "Xác nhận",
  onConfirm,
  onReject,
  onFailure,
}: ProposalCardProps) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [settled, setSettled] = useState<"applied" | "rejected" | "failed" | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  // Nội dung đã công khai thì học viên đang học nó; sửa là thay đổi thứ người khác đang nhìn
  // thấy. Đọc từ backend NGAY TRONG hộp, không lấy từ tham số tool: model không đặt được nó.
  const [info, setInfo] = useState<CourseLikeInfo | null>(null);

  const kind = target?.kind;
  const id = target?.id;
  useEffect(() => {
    if (!kind || !id) return;
    let cancelled = false;
    const read = kind === "course" ? api.courses.get(id) : api.exercises.get(id);
    read
      .then((found) => !cancelled && setInfo(found as CourseLikeInfo))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [kind, id]);

  // Backend từ chối MỌI lệnh ghi khi nội dung đang chờ duyệt (422). Chặn nút ở đây thay vì để
  // người soạn bấm rồi ăn lỗi — và agent thì không có gì để sửa cho đúng.
  const frozen = info?.status === "pending_review";

  const removals = useMemo(() => {
    if (!removeIds?.length) return [];
    const names = new Map<string, string>();
    for (const chapter of info?.chapters ?? []) {
      names.set(chapter.id, `Chương "${chapter.title}"`);
      for (const lesson of chapter.lessons ?? []) names.set(lesson.id, `Bài "${lesson.title}"`);
    }
    // Id không tra ra tên nghĩa là nó không có trong khóa học — vẫn hiện, để người duyệt thấy
    // model đang khai một thứ lạ thay vì bị nuốt mất trong im lặng.
    return removeIds.map((id) => names.get(id) ?? `Mục lạ ${id}`);
  }, [removeIds, info]);

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
      // Thông điệp của backend nói rõ thiếu gì; đừng thay bằng câu chung chung.
      const reason = describeApiError(cause);
      setFailure(reason);
      setSettled("failed");
      toast.error(reason);
      await onFailure(reason);
    }
  };

  return (
    <section className="my-2 rounded-lg border border-border bg-card p-3.5">
      <h3 className="text-sm font-semibold">{title}</h3>

      {removals.length > 0 && (
        <div className="mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-2.5 py-2 text-xs">
          <p className="flex items-start gap-2 font-medium text-destructive">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            Sẽ XÓA {removals.length} mục. Tiến độ của học viên ở phần này mất theo và không khôi
            phục được.
          </p>
          <ul className="mt-1.5 space-y-0.5 pl-5">
            {removals.map((name) => (
              <li key={name}>· {name}</li>
            ))}
          </ul>
        </div>
      )}

      {frozen && (
        <p className="mt-2 flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-2.5 py-2 text-xs">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-warning" />
          Nội dung này đang chờ duyệt nên không sửa được. Rút lại trong studio rồi thử lại.
        </p>
      )}

      {info?.status === "published" && (
        <p className="mt-2 flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-2.5 py-2 text-xs">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-warning" />
          Nội dung này đang công khai. Học viên sẽ thấy thay đổi ngay khi bạn xác nhận.
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
        <Button
          disabled={busy || frozen}
          onClick={() => void apply()}
          type="button"
          variant={removals.length > 0 ? "danger" : "default"}
        >
          {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
          {busy ? "Đang áp dụng…" : confirmLabel}
        </Button>
      </div>
    </section>
  );
}
