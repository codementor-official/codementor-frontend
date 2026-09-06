import { z } from "zod";
import { UUID } from "./curriculum-payload";

/**
 * Hình dạng danh sách khóa học của một lộ trình, và phép chuẩn hoá trước khi ghi.
 *
 * Tách khỏi `hitl-roadmap.tsx` cùng lý do như `curriculum-payload.ts`: logic thuần, không JSX,
 * nên chạy thẳng được trong `roadmap-payload.test.ts`. `UUID` import từ đó chứ không viết lại.
 *
 * Khác cây chương trình ở một điểm quyết định mọi thứ còn lại: ở đây KHÔNG có `id: null`. Lộ
 * trình chỉ chứa khóa học CÓ THẬT, nên `courseId` là bắt buộc và luôn phải là uuid.
 */

/** `ArrayMaxSize(200)` ở `ReplaceRoadmapCoursesDto`. */
export const MAX_ROADMAP_COURSES = 200;

/**
 * Khớp 1-1 `RoadmapCourseDto`. `position` không có ở đây và đó là cố ý — thứ tự lấy theo thứ tự
 * mảng, gửi thêm `position` là 400. `title` cũng không: nó là thứ `read_roadmap` trả về để đọc,
 * không phải thứ gửi đi.
 */
export const roadmapCourseSchema = z.object({
  courseId: z
    .string()
    .describe(
      "Id khóa học CÓ THẬT, lấy từ read_roadmap hoặc search_courses. Lộ trình không có khái " +
        "niệm 'khóa mới' — muốn thêm khóa chưa tồn tại thì soạn khóa đó trước.",
    ),
  isOptional: z
    .boolean()
    .optional()
    .describe("Khóa bổ trợ, học viên bỏ qua được. Mặc định false."),
});

/**
 * Hình dạng tool khai với model: payload cộng một `title` CHỈ để hiện trên hộp xác nhận.
 *
 * Cùng tiền lệ với `save_lesson_contents` (`items[].title`). Không có nó thì thẻ xác nhận chỉ
 * liệt kê được uuid, tức là không duyệt được nếu chưa mở studio; mà tra tên từng khóa ngay trong
 * thẻ lại là N request mỗi lần nó hiện ra.
 */
export const roadmapCourseArgSchema = roadmapCourseSchema.extend({
  title: z.string().describe("Tên khóa học, chỉ để hiện trên hộp xác nhận. KHÔNG được gửi đi lưu."),
});

export type RoadmapCourseInput = z.infer<typeof roadmapCourseArgSchema>;

/**
 * Hình dạng đúng của thứ gửi lên backend: hai khoá, không hơn.
 *
 * Chỉ MAP, không ném lỗi — vì hàm này còn chạy trên đường KIỂM (`check/roadmap-courses`), nơi một
 * ngoại lệ sẽ bị `ProposalCard` nuốt (`.catch(() => undefined)`) và nút vẫn bấm được. Phần chặn
 * id tự đặt nằm ở `assertRealCourseIds`, gọi trên đường GHI.
 *
 * `title` bị loại ở đây: `_extra` phía ai-service và `whitelist` của Nest đều từ chối trường thừa.
 *
 * `isOptional` luôn điền tường minh: backend mặc định `false` cho trường vắng mặt, còn
 * `roadmap_is_unchanged` phía ai-service so `bool(isOptional)` — gửi tường minh giữ hai bên nói
 * cùng một thứ.
 */
export function toRoadmapCoursesPayload(
  courses: { courseId: string; isOptional?: boolean }[],
): { courseId: string; isOptional: boolean }[] {
  return courses.map((course) => ({
    courseId: course.courseId,
    isOptional: Boolean(course.isOptional),
  }));
}

/**
 * Hàng rào cuối trước khi ghi. Nest cũng chặn, nhưng câu của nó là một chuỗi "must be a UUID"
 * không nói phải làm gì — model đọc xong đã báo bế tắc rồi dừng thay vì sửa. Câu này nêu đúng
 * cách sửa và đi ngược về agent qua `onFailure`.
 */
export function assertRealCourseIds(courses: { courseId: string }[]): void {
  const fake = courses
    .map((course, index) => (UUID.test(course.courseId) ? null : `khóa ${index + 1} = "${course.courseId}"`))
    .filter((line): line is string => line !== null);
  if (fake.length === 0) return;
  throw new Error(
    `Id khóa học không dùng được: ${fake.join(", ")}. Lộ trình chỉ chứa khóa CÓ THẬT — ` +
      "tìm bằng `search_courses`, hoặc soạn khóa mới rồi lấy id. Sửa rồi gọi lại " +
      "`validate_roadmap_courses` trước khi lưu.",
  );
}
