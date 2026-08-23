import { WorkspaceDetailScreen } from "@/features/workspace/components/workspace-detail-screen";

export default async function WorkspaceGroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  return <WorkspaceDetailScreen slug={groupId} />;
}
