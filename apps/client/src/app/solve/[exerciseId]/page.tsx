import { getProblem } from "@/data/sample-problem";
import { SolveWorkspace } from "./solve-workspace";

export default async function SolvePage({
  params,
  searchParams,
}: {
  params: Promise<{ exerciseId: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { exerciseId } = await params;
  const { returnTo } = await searchParams;
  const problem = getProblem(exerciseId);
  const backHref = returnTo?.startsWith("/") ? returnTo : "/practice";

  return (
    <div className="min-h-0 flex-1">
      <SolveWorkspace problem={problem} backHref={backHref} />
    </div>
  );
}
