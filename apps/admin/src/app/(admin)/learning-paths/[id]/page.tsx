import { RoadmapViewer } from "@/features/content-viewer/roadmap-viewer";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RoadmapViewer id={id} />;
}
