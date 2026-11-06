import { CourseDetailView } from "./course-detail-view";

/**
 * `courseId` is the course's UUID. Flat, not nested under a roadmap: a course belongs to
 * zero or more roadmaps, so `/roadmaps/x/courses/y` had to guess which one to name, and the
 * catalogue does not carry that back-reference anyway.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ via?: string | string[] }>;
}) {
  const { courseId } = await params;
  // `?via=<roadmapId>`: mở từ trang lộ trình. Chỉ nhận UUID — giá trị lạ thì coi như không có,
  // backend sẽ trả 400 cho cả lần ghi danh nếu chuyển nó đi.
  const { via } = await searchParams;
  const viaRoadmapId = typeof via === "string" && UUID.test(via) ? via : undefined;
  return <CourseDetailView courseId={courseId} viaRoadmapId={viaRoadmapId} />;
}
