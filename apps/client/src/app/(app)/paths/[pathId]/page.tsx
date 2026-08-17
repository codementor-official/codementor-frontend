import { RoadmapDetailView } from "./roadmap-detail-view";

/** `pathId` is the roadmap's UUID — the learning service has no slug lookup. */
export default async function RoadmapDetailPage({
  params,
}: {
  params: Promise<{ pathId: string }>;
}) {
  const { pathId } = await params;
  return <RoadmapDetailView roadmapId={pathId} />;
}
