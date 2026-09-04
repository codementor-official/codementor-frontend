import { WorkspaceExerciseStudio } from "@/features/workspace/components/workspace-exercise-studio";

export default async function WorkspaceExerciseStudioPage({
  params,
}: {
  params: Promise<{ groupId: string; exerciseId: string }>;
}) {
  const { groupId, exerciseId } = await params;
  return <WorkspaceExerciseStudio slug={groupId} exerciseId={exerciseId} />;
}
