import Link from "next/link";
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
    return (
      <div>
        <Link href={`/paths/${pathId}/courses/${courseSlug}`} className="mb-3.5 inline-block text-sm text-text-muted hover:text-navy">← Quay lại khóa học</Link>
        <Card className="p-8 text-center text-sm text-text-faint">Không tìm thấy bài học này.</Card>
      </div>
    );
  }

  return <CourseLessonPlayer roadmapSlug={result.roadmap.slug} course={result.course} lessonId={lessonId} />;
}
