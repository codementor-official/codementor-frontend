import { Placeholder } from "@/components/placeholder";
import { CodeProblemForm } from "@/components/create-problem/code-problem-form";
import { ProblemTabNav } from "@/components/create-problem/problem-tab-nav";
import { resolveProblemTab } from "@/components/create-problem/problem-tabs";

export default async function CreateProblemPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const tab = resolveProblemTab((await searchParams).tab);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-navy">Tạo bài tập</h1>
        <p className="mt-1 text-sm text-text-muted">
          Soạn đề, code mẫu và test case rồi đăng vào ngân hàng bài tập hoặc giao cho nhóm học.
        </p>
      </header>

      <ProblemTabNav active={tab} />

      {tab === "code" && <CodeProblemForm />}
      {tab === "quiz" && <Placeholder label="Soạn câu hỏi trắc nghiệm: đáp án, giải thích, điểm" />}
      {tab === "essay" && <Placeholder label="Soạn bài tự luận: đề bài, tiêu chí chấm, đáp án mẫu" />}
    </div>
  );
}
