import type { ExerciseDraft } from "@codementor/solve";
import type { LecterDraftPatch } from "./types";

/**
 * Áp một đề nghị của Lecter vào bản nháp đang mở trong studio.
 *
 * Hai luật, và chỉ hai:
 *   1. Trường KHÔNG có trong patch thì giữ nguyên. Đây là điều kiện để "sửa dần" hoạt động —
 *      người soạn nhờ viết lại đề bài thì bộ test case họ vừa gõ tay phải còn nguyên.
 *   2. Mảng (`testCases`, `languages`, `constraints`, `tagIds`) thì thay CẢ MẢNG. Trộn từng
 *      phần tử nghe hay nhưng không có khoá nào để ghép đúng — `order` trùng nhau giữa hai bản
 *      là chuyện thường — và một lần ghép sai thì người soạn phải dò từng case để tìm ra.
 *      Prompt nói rõ với Lecter điều này: sửa test case thì gửi lại đủ cả case cũ.
 *
 * `slug` không bao giờ đổi ở đây: studio tự sinh nó từ tiêu đề, và khoá hẳn khi bài đã đăng
 * trong nhóm — đổi slug của một bài đang có là đổi đường dẫn dưới chân người đang làm bài.
 */
export function applyPatch(draft: ExerciseDraft, patch: LecterDraftPatch): ExerciseDraft {
  return {
    ...draft,
    title: patch.title ?? draft.title,
    summary: patch.summary ?? draft.summary,
    difficulty: patch.difficulty ?? draft.difficulty,
    tagIds: patch.tagIds ?? draft.tagIds,
    // Form giữ ba số này dạng chuỗi (chúng là giá trị của <input>), còn Lecter gửi số.
    estimatedMinutes:
      patch.estimatedMinutes === undefined
        ? draft.estimatedMinutes
        : String(patch.estimatedMinutes),
    timeLimitMs:
      patch.timeLimitMs === undefined ? draft.timeLimitMs : String(patch.timeLimitMs),
    memoryLimitKb:
      patch.memoryLimitKb === undefined ? draft.memoryLimitKb : String(patch.memoryLimitKb),
    content: { ...draft.content, ...(patch.content ?? {}) },
  };
}

const LABELS: Record<string, string> = {
  title: "Tiêu đề",
  summary: "Tóm tắt",
  difficulty: "Độ khó",
  estimatedMinutes: "Thời lượng ước tính",
  timeLimitMs: "Giới hạn thời gian",
  memoryLimitKb: "Giới hạn bộ nhớ",
  tagIds: "Chủ đề",
  statement: "Đề bài",
  ioMode: "Chế độ nhập/xuất",
  signature: "Chữ ký hàm",
  constraints: "Ràng buộc",
  hints: "Gợi ý",
  examples: "Ví dụ",
  testCases: "Test case",
  languages: "Ngôn ngữ và lời giải mẫu",
  evaluation: "Cách chấm",
};

function label(key: string): string {
  return LABELS[key] ?? key;
}

/** Tên tiếng Việt của những phần patch này đụng tới, để thẻ xác nhận nói được nó sắp làm gì. */
export function changedFields(patch: LecterDraftPatch): string[] {
  const top = Object.keys(patch).filter(
    (key) => key !== "content" && patch[key as keyof LecterDraftPatch] !== undefined,
  );
  const inner = Object.keys(patch.content ?? {}).filter(
    (key) => (patch.content as Record<string, unknown>)[key] !== undefined,
  );
  return [...top, ...inner].map(label);
}

/**
 * Những phần người soạn ĐANG có nội dung khác và sẽ bị ghi đè.
 *
 * Studio có autosave và một hộp "khôi phục bản nháp", nên áp đè im lặng làm họ mất bài đang
 * viết mà không hiểu vì sao. Danh sách này biến thẻ xác nhận từ "bạn có chắc không" thành
 * "bạn sắp mất đúng những thứ này".
 */
export function overwrites(draft: ExerciseDraft, patch: LecterDraftPatch): string[] {
  const filled = (value: unknown) =>
    Array.isArray(value) ? value.length > 0 : typeof value === "string" ? value.trim() !== "" : value !== undefined && value !== null;
  const current: Record<string, unknown> = {
    title: draft.title,
    summary: draft.summary,
    tagIds: draft.tagIds,
    ...(draft.content as Record<string, unknown>),
  };
  const proposed: Record<string, unknown> = {
    ...Object.fromEntries(Object.entries(patch).filter(([key]) => key !== "content")),
    ...(patch.content ?? {}),
  };
  return Object.entries(proposed)
    .filter(([key, value]) => {
      if (value === undefined || !(key in current)) return false;
      if (!filled(current[key])) return false;
      return JSON.stringify(current[key]) !== JSON.stringify(value);
    })
    .map(([key]) => label(key));
}
