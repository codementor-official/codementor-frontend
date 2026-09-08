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

/** Một phần bị đổi, kèm thứ để đọc: nhãn, nội dung đề xuất, và bản đang có nếu bị ghi đè. */
export interface PatchEntry {
  key: string;
  label: string;
  preview: string;
  /** Chỉ có khi ô này ĐANG có nội dung khác — tức là sắp bị ghi đè. */
  current?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Số case công khai phải đọc được ngay, không phải đếm bằng mắt. */
function previewTestCases(cases: unknown[]): string {
  const items = cases.filter(isRecord);
  const open = items.filter((item) => item.visibility === "public").length;
  const lines = items.map((item) => {
    const input = item.args !== undefined ? JSON.stringify(item.args) : String(item.input ?? "");
    const expected =
      item.expected === undefined
        ? "—"
        : typeof item.expected === "string"
          ? item.expected
          : JSON.stringify(item.expected);
    return `#${item.order ?? "?"} [${item.visibility ?? "?"}] ${input} → ${expected}`;
  });
  return [`${items.length} case (${open} công khai)`, ...lines].join("\n");
}

/** Lời giải mẫu là thứ đáng đọc nhất trong cả patch: bài chấm đúng hay sai nằm ở đây. */
function previewLanguages(languages: unknown[]): string {
  return languages
    .filter(isRecord)
    .map((item) => {
      const solution = String(item.referenceSolution ?? "").trim();
      const head = `${item.id ?? "?"} (${item.label ?? "?"})`;
      return `${head}\n${solution || "— chưa có lời giải mẫu —"}`;
    })
    .join("\n\n");
}

/**
 * Nội dung của một phần, ở dạng đọc được bằng mắt.
 *
 * Không `JSON.stringify` tất cả: người soạn cần đọc đề bài và lời giải, không cần đọc dấu
 * ngoặc. Chỉ những thứ không có hình dạng cố định mới rơi về JSON.
 */
export function previewOf(key: string, value: unknown): string {
  if (value === undefined || value === null) return "—";
  if (key === "testCases" && Array.isArray(value)) return previewTestCases(value);
  if (key === "languages" && Array.isArray(value)) return previewLanguages(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "— trống —";
    return value
      .map((item) => (typeof item === "string" ? `• ${item}` : `• ${JSON.stringify(item)}`))
      .join("\n");
  }
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

/**
 * Từng phần patch này đụng tới, kèm nội dung để người soạn đọc TRƯỚC khi bấm.
 *
 * Một danh sách tên trường ("Đề bài, Test case, Ngôn ngữ") nói cái gì sắp đổi mà không nói đổi
 * thành gì. Người soạn còn hai lựa chọn: bấm liều, hoặc bấm rồi mở form ra dò từng ô.
 */
export function patchEntries(draft: ExerciseDraft, patch: LecterDraftPatch): PatchEntry[] {
  const current: Record<string, unknown> = {
    title: draft.title,
    summary: draft.summary,
    difficulty: draft.difficulty,
    estimatedMinutes: draft.estimatedMinutes,
    timeLimitMs: draft.timeLimitMs,
    memoryLimitKb: draft.memoryLimitKb,
    tagIds: draft.tagIds,
    ...(draft.content as Record<string, unknown>),
  };
  const proposed: Record<string, unknown> = {
    ...Object.fromEntries(Object.entries(patch).filter(([key]) => key !== "content")),
    ...(patch.content ?? {}),
  };
  return Object.entries(proposed)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      const existing = current[key];
      // "Ghi đè" chỉ tính khi ô ĐANG có nội dung và nội dung đó KHÁC. Điền vào ô trống thì không
      // có gì để mất, và cảnh báo ở đó chỉ tập cho người ta thói quen bấm qua cảnh báo.
      const filled = Array.isArray(existing)
        ? existing.length > 0
        : typeof existing === "string"
          ? existing.trim() !== ""
          : existing !== undefined && existing !== null;
      // So sánh giá trị thô, không so bản xem trước: hai giá trị khác nhau có thể rút gọn ra
      // cùng một dòng tóm tắt.
      const changed = JSON.stringify(existing) !== JSON.stringify(value);
      return {
        key,
        label: label(key),
        preview: previewOf(key, value),
        ...(filled && changed ? { current: previewOf(key, existing) } : {}),
      };
    });
}

/** Nhãn của những phần patch đụng tới — dòng tóm tắt trên thẻ xác nhận. */
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
  return patchEntries(draft, patch)
    .filter((entry) => entry.current !== undefined)
    .map((entry) => entry.label);
}
