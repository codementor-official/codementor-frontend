import { Card } from "@/components/ui/card";
import { CourseLessonPlayer } from "@/components/lesson-player/course-lesson-player";
import { roadmapService } from "@/lib/roadmap/roadmap-service";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ pathId: string; courseSlug: string; lessonId: string }>;
}) {
  const { pathId, courseSlug, lessonId } = await params;
  const result = await roadmapService.getCourse(pathId, courseSlug);
  const lessonExists = result?.course.chapters.some((chapter) => chapter.lessons.some((lesson) => lesson.id === lessonId));

  if (!result || !lessonExists) {
    return <Card className="p-8 text-center text-sm text-text-faint">Không tìm thấy bài học này.</Card>;
  }

  return <CourseLessonPlayer roadmapSlug={result.roadmap.slug} course={result.course} lessonId={lessonId} />;
}
