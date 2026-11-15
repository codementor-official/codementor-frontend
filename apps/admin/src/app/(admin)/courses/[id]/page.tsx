import { CourseViewer } from "@/features/content-viewer/course-viewer";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseViewer id={id} />;
}
