import { getProblem } from "@/data/sample-problem";
import { SolveWorkspace } from "./solve-workspace";

export default async function SolvePage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  const problem = getProblem(exerciseId);

  return (
    <div className="min-h-0 flex-1">
      <SolveWorkspace problem={problem} />
    </div>
  );
}
