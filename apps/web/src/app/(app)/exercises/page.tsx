import { AuthoredProblemsTab } from "@/components/exercises/authored-problems-tab";
import { ExerciseTabNav } from "@/components/exercises/exercise-tab-nav";
import { resolveExerciseTab } from "@/components/exercises/exercise-tabs";
import { SubmissionsTab } from "@/components/exercises/submissions-tab";

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const tab = resolveExerciseTab((await searchParams).tab);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-navy">Bài tập</h1>
        <p className="mt-1 text-sm text-text-muted">
          Quản lý bài tập bạn đã soạn và theo dõi mọi lần làm bài của bạn.
        </p>
      </header>

      <ExerciseTabNav active={tab} />

      {tab === "authored" && <AuthoredProblemsTab />}
      {tab === "submissions" && <SubmissionsTab />}
    </div>
  );
}
