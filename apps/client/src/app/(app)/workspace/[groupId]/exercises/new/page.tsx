import { WorkspaceExerciseStudio } from "@/features/workspace/components/workspace-exercise-studio";

export default async function NewWorkspaceExercisePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  return <WorkspaceExerciseStudio slug={groupId} />;
}
