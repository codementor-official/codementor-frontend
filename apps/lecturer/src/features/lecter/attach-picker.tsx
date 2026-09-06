"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, Search } from "lucide-react";
import { Modal, StatusBadge } from "@codementor/ui";
import { LEVEL_LABELS } from "@codementor/types";
import {
  DIFFICULTY_LABELS,
  STATUS_LABELS,
  STATUS_TONES,
  type ExerciseListItem,
  type ExerciseStatus,
} from "@codementor/solve";
import { ListPager, ListSearch, usePagedList } from "@/components/page/paged-list";
import type { CourseListItem } from "@/features/courses/types";
import { FIELD_LABELS, type RoadmapListItem } from "@/features/roadmaps/types";
import {
  DOCUMENT_STATE_LABELS,
  formatSize,
  isUsable,
  type AiDocument,
} from "@/features/documents/types";
import { api } from "@/lib/api";
import { ATTACH_LABELS, type AttachKind, type AttachedItem } from "./use-attached-content";

/**
 * Hộp chọn nội dung để đính kèm vào tin nhắn.
 *
 * Chỉ liệt kê nội dung CỦA CHÍNH giảng viên (`/mine`, mọi trạng thái). Kho công khai không nằm ở
 * đây: đính kèm là để bảo Lecter làm việc trên thứ mình đang soạn, còn tìm bài của người khác để
 * gắn vào khóa học là việc của tool `search_exercises` phía agent.
 *
 * Phân trang phía client, đúng như hai picker đang chạy trong studio — xem docstring của
 * `usePagedList`. 100 dòng nạp một lần rẻ hơn một vòng gọi mạng mỗi lần gõ phím.
 * ponytail: đổi sang tham số `q` của backend khi có giảng viên vượt 100 mục.
 */

const PAGE_SIZE = 6;
const FETCH_LIMIT = 100;
/** Hằng số ở module: một `[]` mới mỗi lần render sẽ phá memo của `usePagedList`. */
const NO_ROWS: Row[] = [];

/**
 * `status` khai kiểu `ExerciseStatus` cho cả ba loại, và đó là kiểu rộng hơn chứ không phải kiểu
 * sai: bài code có thêm `closed` và `hidden` ngoài sáu trạng thái dùng chung, còn khóa học và lộ
 * trình chỉ dùng sáu cái chung. Dùng bảng `CONTENT_STATUS_*` ở đây thì hai trạng thái riêng của
 * bài code hiện ra rỗng.
 */
type Row = {
  item: AttachedItem;
  caption: string;
  /** Nội dung phát hành mới có trạng thái duyệt; tài liệu thì không. */
  status?: ExerciseStatus;
  /** Tài liệu chưa xử lý xong thì không chọn được — Lecter chưa đọc được nó. */
  disabled?: boolean;
};

type ListEntry = ExerciseListItem | CourseListItem | RoadmapListItem | AiDocument;

/**
 * Dòng phụ dưới tiêu đề: thứ phân biệt được hai mục trùng tên, mỗi loại một cách.
 *
 * `toRows` phải ép kiểu để gọi được, và điều đó an toàn vì `kind` chọn CẢ lời gọi API lẫn hàm
 * ở đây — cùng một biến, trong cùng một effect.
 */
const CAPTIONS: Record<AttachKind, (entry: never) => string> = {
  exercise: (entry: ExerciseListItem) => `${DIFFICULTY_LABELS[entry.difficulty]} · ${entry.slug}`,
  course: (entry: CourseListItem) =>
    `${LEVEL_LABELS[entry.level]} · ${entry.totalChapters} chương, ${entry.totalLessons} bài`,
  roadmap: (entry: RoadmapListItem) =>
    `${FIELD_LABELS[entry.field]} · ${LEVEL_LABELS[entry.level]} · ${entry.courseCount} khóa`,
  document: (entry: AiDocument) =>
    `${entry.docType.toUpperCase()} · ${formatSize(entry.sizeBytes)} · ` +
    `${DOCUMENT_STATE_LABELS[entry.state] ?? entry.state}`,
};

function toRows(kind: AttachKind, data: ListEntry[]): Row[] {
  const caption = CAPTIONS[kind] as (entry: ListEntry) => string;
  return data.map((entry) =>
    kind === "document"
      ? {
          item: { kind, id: entry.id, title: entry.title, state: "ready" as const },
          caption: caption(entry),
          disabled: !isUsable(entry as AiDocument),
        }
      : {
          item: { kind, id: entry.id, title: entry.title },
          caption: caption(entry),
          status: (entry as Exclude<ListEntry, AiDocument>).status,
        },
  );
}

export function AttachPicker({
  kind,
  attachedIds,
  onPick,
  onClose,
}: {
  /** `null` = đóng. Đổi giá trị là nạp lại danh sách tương ứng. */
  kind: AttachKind | null;
  attachedIds: string[];
  onPick: (item: AttachedItem) => void;
  onClose: () => void;
}) {
  // Kết quả được KHOÁ THEO `kind` thay vì đi kèm một cờ `loading` riêng. Hai cái lợi: mọi
  // setState đều nằm trong `.then`/`.catch` nên không có render dây chuyền từ effect, và đổi loại
  // đính kèm không thể hiện nhầm danh sách của loại trước trong lúc chờ.
  const [loaded, setLoaded] = useState<{ kind: AttachKind; rows: Row[] } | null>(null);
  const [failure, setFailure] = useState<{ kind: AttachKind; message: string } | null>(null);

  useEffect(() => {
    if (!kind) return;
    let cancelled = false;
    const request =
      kind === "exercise"
        ? api.exercises.mine({ limit: FETCH_LIMIT })
        : kind === "course"
          ? api.courses.mine({ limit: FETCH_LIMIT })
          : kind === "roadmap"
            ? api.roadmaps.mine({ limit: FETCH_LIMIT })
            // Tài liệu trả thẳng một mảng, không phân trang — xem `api.aiDocuments.list`.
            : api.aiDocuments.list().then((items) => ({ items }));
    request
      .then((page) => !cancelled && setLoaded({ kind, rows: toRows(kind, page.items) }))
      .catch(
        () =>
          !cancelled &&
          setFailure({ kind, message: "Không tải được danh sách. Thử mở lại." }),
      );
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const rows = loaded?.kind === kind ? loaded.rows : NO_ROWS;
  const error = failure?.kind === kind ? failure.message : null;
  const loading = loaded?.kind !== kind && !error;

  const list = usePagedList(
    rows,
    (row, query) => `${row.item.title} ${row.caption}`.toLowerCase().includes(query),
    PAGE_SIZE,
  );

  if (!kind) return null;
  const label = ATTACH_LABELS[kind];

  // Portal ra `body`, bắt buộc chứ không phải cho gọn. Hộp này được render bên trong khung ô nhập
  // của CopilotChatView, mà khung đó là `pointer-events-none` (thuộc tính này DI TRUYỀN xuống con)
  // và `absolute z-20` (tạo stacking context riêng, nhốt `z-50` của Modal lại). Để nguyên tại chỗ
  // thì dialog vẫn hiện nhưng bấm không được và có thể nằm dưới thanh điều hướng.
  return createPortal(
    <Modal
      description="Lecter sẽ tự đọc chi tiết mục bạn chọn."
      onClose={onClose}
      open
      title={`Đính kèm ${label.toLowerCase()}`}
      width="md"
    >
      <ListSearch
        onChange={list.setQuery}
        placeholder={`Tìm ${label.toLowerCase()} theo tên…`}
        value={list.query}
      />

      {loading ? (
        <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Đang tải…
        </p>
      ) : error ? (
        <p className="rounded-lg border border-destructive/40 px-3 py-6 text-center text-sm text-destructive">
          {error}
        </p>
      ) : list.visible.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          <Search aria-hidden="true" className="mx-auto mb-2 size-4" />
          {rows.length === 0
            ? `Bạn chưa có ${label.toLowerCase()} nào.`
            : "Không có mục nào khớp."}
        </p>
      ) : (
        <ul className="grid gap-1.5">
          {list.visible.map((row) => {
            const attached = attachedIds.includes(row.item.id);
            const blocked = attached || Boolean(row.disabled);
            return (
              <li key={row.item.id}>
                <button
                  className="flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted/40 disabled:opacity-50"
                  disabled={blocked}
                  onClick={() => {
                    onPick(row.item);
                    onClose();
                  }}
                  type="button"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{row.item.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {row.caption}
                    </span>
                  </span>
                  {row.status && (
                    <StatusBadge tone={STATUS_TONES[row.status]}>
                      {STATUS_LABELS[row.status]}
                    </StatusBadge>
                  )}
                  {attached && <Check aria-hidden="true" className="size-4 shrink-0 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ListPager
        onChange={list.setPage}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        unit={label.toLowerCase()}
      />
    </Modal>,
    document.body,
  );
}
