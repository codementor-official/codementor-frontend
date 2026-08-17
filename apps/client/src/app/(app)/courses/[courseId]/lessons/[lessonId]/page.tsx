import { LessonView } from "./lesson-view";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  return <LessonView courseId={courseId} lessonId={lessonId} />;
}
