import { CourseDetailView } from "./course-detail-view";

/**
 * `courseId` is the course's UUID. Flat, not nested under a roadmap: a course belongs to
 * zero or more roadmaps, so `/roadmaps/x/courses/y` had to guess which one to name, and the
 * catalogue does not carry that back-reference anyway.
 */
export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <CourseDetailView courseId={courseId} />;
}
