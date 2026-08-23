import { RoadmapDetailView } from "./roadmap-detail-view";

/** `roadmapId` is the roadmap's UUID — the learning service has no slug lookup. */
export default async function RoadmapDetailPage({
  params,
}: {
  params: Promise<{ roadmapId: string }>;
}) {
  const { roadmapId } = await params;
  return <RoadmapDetailView roadmapId={roadmapId} />;
}
