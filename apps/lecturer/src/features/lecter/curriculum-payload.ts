import { z } from "zod";

/**
 * Hình dạng cây chương trình và phép chuẩn hoá trước khi ghi.
 *
 * Tách khỏi `hitl-course.tsx` vì đây là logic thuần — không JSX, không React — nên chạy thẳng
 * được trong `curriculum-payload.test.ts`. Cả schema zod lẫn hàm dựng payload dùng CHUNG một
 * hằng `UUID`: hai chỗ định nghĩa "id hợp lệ" khác nhau chính là loại lỗi tệp này ra đời để chặn.
 */

export const lessonType = z.enum([
  "video",
  "article",
  "exercise",
  "quiz",
  "challenge",
  "project",
]);

/**
 * Id của một mục ĐÃ CÓ, hoặc `null` cho mục mới.
 *
 * Hai chi tiết ở đây đều là hậu quả của một bug thật (`lecter:1e7f78d7-…`): model gọi
 * `validate_curriculum` với `id: null` — đúng, và được duyệt — rồi gọi `save_curriculum` với
 * `id: "new-1"` và ăn 400 từ Nest.
 *
 * 1. `.nullish()` chứ không phải `.optional()`. `z.string().optional()` KHÔNG nhận `null`, nên
 *    schema nói với model rằng `id` bắt buộc là chuỗi; không có id thật để điền, nó bịa ra
 *    "new-1". Tool phía Python nhận `list[dict]` tự do nên `null` đi lọt — hai tool khai hai kiểu
 *    khác nhau cho cùng một trường thì model không thể gửi cùng một payload cho cả hai.
 * 2. Regex chép đúng `UUID` ở `app/lecter/validate.py`, không dùng `z.uuid()`. `z.uuid()` của
 *    zod 4 ép đúng RFC (nibble phiên bản 1-8) còn `@IsUUID()` của Nest thì dễ tính hơn; hai
 *    validator bất đồng về "id là gì" chính là loại lỗi đang sửa.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const existingId = z.string().regex(UUID, "Phải là id có thật, hoặc null nếu là mục mới.");

/**
 * URL video/phụ đề. Mirror `@IsUrl({ protocols: ['http','https'], require_protocol: true })` +
 * `@MaxLength(2048)` của `LessonMediaDto` — cùng lý do như `existingId`: hai bên định nghĩa
 * "hợp lệ" khác nhau thì payload qua được zod vẫn chết ở Nest.
 */
const mediaUrl = z
  .string()
  .regex(/^https?:\/\//, "Phải là URL đầy đủ, bắt đầu bằng http:// hoặc https://")
  .max(2048);

/**
 * Khớp 1-1 `SaveLessonContentDto`. Không có `provider` dù validator Mongo cho phép: DTO của Nest
 * không khai nó, nên gửi lên là 400. Không có `sections` vì cùng lý do.
 */
export const lessonContentSchema = z.object({
  summary: z.string().max(2000).optional(),
  objectives: z.array(z.string()).optional(),
  contentHtml: z.string().optional(),
  exerciseBrief: z.array(z.string()).optional(),
  media: z
    .object({
      url: mediaUrl,
      durationSeconds: z.number().int().min(0).optional(),
      captionsUrl: mediaUrl.optional(),
    })
    .optional()
    .describe(
      "CHỈ gửi cho bài video đã có link thật. Bài article/exercise thì BỎ HẲN `media` — " +
        "`url` rỗng là 400.",
    ),
});

/** Trần một lượt. Nhiều hơn thì một lời gọi tool phải ôm toàn bộ HTML của cả khóa: dễ vượt trần
 *  output của model, chậm, và hỏng giữa chừng là mất cả lô. */
export const MAX_LESSONS_PER_BATCH = 5;

/**
 * Khớp 1-1 `SaveCurriculumDto`. `position` không có ở đây và đó là cố ý — thứ tự lấy theo thứ tự
 * mảng, gửi thêm `position` là 400.
 */
export const chapterSchema = z.object({
  id: existingId
    .nullish()
    .describe("Chương MỚI: gửi null. Chương đã có: PHẢI gửi lại đúng id đọc từ read_course."),
  title: z.string().max(200),
  description: z.string().max(2000).nullable().optional(),
  isOptional: z.boolean().optional(),
  lessons: z.array(
    z.object({
      id: existingId
        .nullish()
        .describe("Bài MỚI: gửi null. Bài đã có: PHẢI gửi lại đúng id đọc từ read_course."),
      title: z.string().max(200),
      type: lessonType.describe("Bài lý thuyết là 'article'."),
      durationMinutes: z.number().int().nullable().optional(),
      isPreview: z.boolean().optional(),
      isOptional: z.boolean().optional(),
      exerciseId: existingId
        .nullish()
        .describe("Chỉ cho type exercise/quiz/challenge/project. Id bài code CÓ THẬT, hoặc null."),
    }),
  ),
});

/**
 * Bỏ `id` rỗng trước khi gửi đi.
 *
 * `@IsUUID()` của Nest chỉ được `@IsOptional()` bỏ qua khi trường là `null`/`undefined`; chuỗi
 * rỗng vẫn bị kiểm và trả 400. Mà chuỗi rỗng chính là cách model diễn đạt "mục này mới" — nó đã
 * làm đúng vậy trong một hội thoại thật. Chuẩn hoá ở đây thì một lần trượt không thành lỗi backend
 * mà người soạn không sửa được.
 */
export function toCurriculumPayload(chapters: z.infer<typeof chapterSchema>[]) {
  const fake: string[] = [];
  const keep = (where: string, id: string | null | undefined) => {
    if (!id) return {};
    if (!UUID.test(id)) fake.push(`${where} = "${id}"`);
    return { id };
  };

  const payload = chapters.map(({ id, lessons, ...chapter }, index) => ({
    ...keep(`chương ${index + 1}`, id),
    ...chapter,
    lessons: lessons.map(({ id: lessonId, exerciseId, ...lesson }, position) => ({
      ...keep(`chương ${index + 1} · bài ${position + 1}`, lessonId),
      ...lesson,
      exerciseId: exerciseId || null,
    })),
  }));

  // Hàng rào cuối. Nest cũng chặn, nhưng câu của nó là 11 dòng "must be a UUID" không nói phải
  // làm gì — model đọc xong đã báo cáo bế tắc rồi dừng thay vì sửa. Câu này nêu đúng cách sửa và
  // đi ngược về agent qua `onFailure`.
  if (fake.length > 0) {
    throw new Error(
      `Id tự đặt không dùng được: ${fake.join(", ")}. Mục MỚI phải để \`id: null\`, ` +
        "đừng tự sinh id. Sửa rồi gọi lại `validate_curriculum` trước khi lưu.",
    );
  }
  return payload;
}



/**
 * Bỏ những trường "rỗng cho có" trước khi gửi đi.
 *
 * Cùng một thói quen đã làm hỏng `id`: model điền đủ mọi trường tuỳ chọn bằng giá trị rỗng thay
 * vì bỏ chúng đi. Với nội dung bài học nó gửi `media: {url: "", durationSeconds: 0,
 * captionsUrl: ""}` cho một bài `article` — mà `LessonMediaDto.url` không có `@IsOptional()` và
 * bị `@IsUrl(require_protocol)` gác, nên cả lệnh PUT trả 400.
 *
 * Ghi vào Mongo là MERGE (`$set`), nên bỏ một khoá KHÔNG xoá giá trị cũ; gửi `""` hay `[]` mới là
 * ghi đè bằng rỗng. Loại chúng ở đây vừa hợp ý model ("chỗ này không có gì") vừa an toàn hơn.
 */
export type LessonContentInput = z.infer<typeof lessonContentSchema>;

export function toLessonContentPayload(content: LessonContentInput): LessonContentInput {
  const payload: LessonContentInput = {};

  if (content.summary?.trim()) payload.summary = content.summary;
  if (content.contentHtml?.trim()) payload.contentHtml = content.contentHtml;
  for (const key of ["objectives", "exerciseBrief"] as const) {
    const list = content[key]?.filter((line) => line.trim());
    if (list?.length) payload[key] = list;
  }


  // `media` chỉ tồn tại khi có link thật. Không có url thì cả object là vô nghĩa.
  const media = content.media;
  if (media?.url?.trim()) {
    payload.media = {
      url: media.url,
      ...(media.durationSeconds !== undefined ? { durationSeconds: media.durationSeconds } : {}),
      ...(media.captionsUrl?.trim() ? { captionsUrl: media.captionsUrl } : {}),
    };
  }
  return payload;
}
