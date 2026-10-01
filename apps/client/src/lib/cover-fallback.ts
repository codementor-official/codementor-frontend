/**
 * Ảnh bìa dự phòng (unDraw, khung 16:9 nền cam nhạt) cho khoá học / lộ trình chưa có ảnh bìa
 * riêng. Lộ trình chọn theo lĩnh vực; khoá học không có lĩnh vực nên dùng chung một ảnh.
 */
export const COURSE_COVER_FALLBACK = "/illustrations/course-fallback.svg";

const FIELDS = new Set(["frontend", "backend", "fullstack", "mobile", "data_ai", "foundation"]);

export function roadmapCoverFallback(field: string) {
  return FIELDS.has(field) ? `/illustrations/field-${field.replace("_", "-")}.svg` : COURSE_COVER_FALLBACK;
}
