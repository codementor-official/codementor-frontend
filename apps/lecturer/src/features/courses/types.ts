import type { ContentStatus, Level } from "@/features/roadmaps/types";
import type { LessonType } from "@codementor/types";

// Kiểu bài và nhãn của nó ở `@codementor/types` — màn kiểm duyệt bên admin đọc cùng bảng.
export { LESSON_TYPES, LESSON_TYPE_LABELS } from "@codementor/types";
export type { LessonType } from "@codementor/types";

/**
 * Kiểu bài người soạn được phép chọn — DANH SÁCH DUY NHẤT, dùng cho cả tạo mới lẫn sửa.
 *
 * Đây là chỗ đã sinh ra lỗi "Tạo khóa học không có VIDEO nhưng Sửa thì có": danh sách này
 * không có `video`, còn ô chọn kiểu bài lại tự thêm kiểu HIỆN TẠI của bài vào cuối để
 * không âm thầm đổi kiểu của một bài cũ (xem `typeOptions` ở `inspector.tsx`). Hệ quả:
 * bài mới luôn bắt đầu ở `article` nên chỉ thấy 2 lựa chọn, còn mở một bài vốn đã là
 * `video` từ dữ liệu cũ thì thấy 3. Không phải hai màn hình khác nhau, mà là một danh
 * sách phụ thuộc vào giá trị đang có.
 *
 * Sửa dứt điểm = thêm `video` vào chính đây. Mọi nơi chọn kiểu bài đều đọc hằng này, nên
 * không có đường nào để hai màn hình lệch nhau trở lại.
 *
 * Trắc nghiệm/thử thách/dự án vẫn đứng ngoài: chúng đọc được từ dữ liệu cũ nhưng chưa có
 * màn soạn nào, nên mời chọn mới là mời tạo ra một bài rỗng không sửa được.
 */
export const SELECTABLE_LESSON_TYPES: LessonType[] = ["article", "video", "exercise"];

/** Khớp CHECK `lessons_exercise_only_for_exercise_types` ở CSDL. */
const EXERCISE_BEARING: LessonType[] = ["exercise", "quiz", "challenge", "project"];

export function bearsExercise(type: LessonType): boolean {
  return EXERCISE_BEARING.includes(type);
}

export interface CourseListItem {
  id: string;
  slug: string;
  title: string;
  level: Level;
  status: ContentStatus;
  durationHours: number | null;
  totalChapters: number;
  totalLessons: number;
  createdBy: string | null;
  authorName: string | null;
  updatedAt: string;
}

/**
 * Điều kiện mở một bài. `ALL` = phải xong hết danh sách, `ANY` = xong một bài bất kỳ.
 *
 * Chỉ có tác dụng khi khóa học ở chế độ mở khoá `graph` — hai chế độ kia bỏ qua hoàn
 * toàn: `linear` gác bằng thứ tự, `free` không gác gì. Studio nói thẳng điều đó ra thay
 * vì để người soạn tự phát hiện là mình vừa soạn một thứ không chạy.
 */
export type PrerequisiteRule = "ALL" | "ANY";

export interface LessonPrerequisites {
  rule: PrerequisiteRule;
  /** Rỗng = không có điều kiện, bài mở ngay. */
  lessonIds: string[];
}

export const NO_PREREQUISITES: LessonPrerequisites = { rule: "ALL", lessonIds: [] };

export const PREREQUISITE_RULE_LABELS: Record<PrerequisiteRule, string> = {
  ALL: "Phải hoàn thành TẤT CẢ các bài đã chọn",
  ANY: "Chỉ cần hoàn thành MỘT bài bất kỳ trong danh sách",
};

export interface StoredLesson {
  id: string;
  title: string;
  type: LessonType;
  durationMinutes: number | null;
  isPreview: boolean;
  isOptional: boolean;
  position: number;
  exerciseId: string | null;
  contentRef: string | null;
  exerciseTitle: string | null;
  exerciseStatus: string | null;
  exerciseAuthorId: string | null;
  prerequisites: LessonPrerequisites;
}

export interface StoredChapter {
  id: string;
  title: string;
  description: string | null;
  isOptional: boolean;
  position: number;
  lessons: StoredLesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  level: Level;
  durationHours: number | null;
  instructorId: string | null;
  prerequisiteNote: string | null;
  progressionMode: string;
  status: ContentStatus;
  createdBy: string | null;
  rejectionReason: string | null;
  removalRequested: boolean;
  publishedAt: string | null;
  totalChapters: number;
  totalLessons: number;
  updatedAt: string;
  chapters?: StoredChapter[];
}

export interface LessonContent {
  summary?: string;
  objectives?: string[];
  contentHtml?: string;
  exerciseBrief?: string[];
  /** Video của bài. Không lưu nguồn phát — `resolveVideo` nhận diện từ chính URL. */
  media?: { url: string; durationSeconds?: number; captionsUrl?: string };
}

/** `GET /courses/video-upload/config` — kho đã sẵn sàng chưa, giới hạn là bao nhiêu. */
export interface VideoUploadConfig {
  enabled: boolean;
  maxBytes: number;
  acceptedTypes: string[];
}

/** `POST /courses/:id/lessons/:lessonId/video-upload-url` */
export interface PresignedUpload {
  uploadUrl: string;
  headers: Record<string, string>;
  publicUrl: string;
  objectKey: string;
  expiresInSeconds: number;
}

/**
 * Cây đang soạn trong studio.
 *
 * `id` vắng mặt = mục mới, backend sinh id. Có `id` = giữ nguyên hàng, và đó là điều
 * kiện để tiến độ học viên không bị xoá — nên kéo thả tuyệt đối không được sinh id mới
 * cho một bài đã tồn tại.
 */
export interface DraftLesson {
  key: string;
  id?: string;
  title: string;
  type: LessonType;
  durationMinutes: string;
  isPreview: boolean;
  isOptional: boolean;
  exerciseId: string | null;
  exerciseTitle: string | null;
  contentRef: string | null;
  prerequisites: LessonPrerequisites;
}

export interface DraftChapter {
  key: string;
  id?: string;
  title: string;
  description: string;
  isOptional: boolean;
  lessons: DraftLesson[];
}

let counter = 0;
/** Khoá ổn định cho React và cho dnd-kit, kể cả khi mục chưa có id từ máy chủ. */
export function newKey(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Khoá theo `id` khi hàng đã có, chỉ sinh khoá mới cho hàng CHƯA từng lưu. Trước đây mọi
 * lần `toDraft` đều sinh khoá ngẫu nhiên bất kể `id`, nên sau bất kỳ lần lưu nào — kể cả
 * lưu một trường không liên quan — `selection` (giữ khoá cũ) không còn khớp hàng nào
 * trong cây mới, panel bên phải trắng trơn cho tới khi bấm chọn lại đúng hàng đó.
 */
function keyFor(prefix: string, id: string | null | undefined): string {
  return id ?? newKey(prefix);
}

export function toDraft(chapters: StoredChapter[]): DraftChapter[] {
  return chapters.map((chapter) => ({
    key: keyFor("ch", chapter.id),
    id: chapter.id,
    title: chapter.title,
    description: chapter.description ?? "",
    isOptional: chapter.isOptional,
    lessons: chapter.lessons.map((lesson) => ({
      key: keyFor("ls", lesson.id),
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      durationMinutes: lesson.durationMinutes?.toString() ?? "",
      isPreview: lesson.isPreview,
      isOptional: lesson.isOptional,
      exerciseId: lesson.exerciseId,
      exerciseTitle: lesson.exerciseTitle,
      contentRef: lesson.contentRef,
      // Khoá học lưu trước khi có tính năng này không có trường này trong phản hồi.
      prerequisites: lesson.prerequisites ?? NO_PREREQUISITES,
    })),
  }));
}

export function toPayload(chapters: DraftChapter[]) {
  // Xoá một bài không tự gỡ nó khỏi điều kiện của những bài khác đang trỏ vào. Cắt ở đây
  // thay vì ở chỗ xoá: kéo thả giữa hai chương, hoàn tác, xoá cả một chương — mỗi đường
  // đều làm mất một bài, và chỉ chỗ này nhìn thấy cây sau cùng.
  const alive = new Set(
    chapters.flatMap((chapter) => chapter.lessons.map((lesson) => lesson.id).filter(Boolean)),
  );

  return chapters.map((chapter) => ({
    ...(chapter.id ? { id: chapter.id } : {}),
    title: chapter.title,
    description: chapter.description || null,
    isOptional: chapter.isOptional,
    lessons: chapter.lessons.map((lesson) => ({
      ...(lesson.id ? { id: lesson.id } : {}),
      title: lesson.title,
      type: lesson.type,
      durationMinutes: lesson.durationMinutes.trim() ? Number(lesson.durationMinutes) : null,
      isPreview: lesson.isPreview,
      isOptional: lesson.isOptional,
      exerciseId: bearsExercise(lesson.type) ? lesson.exerciseId : null,
      // Chỉ gửi cho bài ĐÃ có id: cạnh cần cả hai đầu là hàng có thật trong CSDL, và
      // backend từ chối cả cây nếu thấy điều kiện gắn vào một bài chưa lưu lần nào.
      ...(lesson.id
        ? {
            prerequisites: {
              rule: lesson.prerequisites.rule,
              lessonIds: lesson.prerequisites.lessonIds.filter((id) => alive.has(id)),
            },
          }
        : {}),
    })),
  }));
}
