import { SolveLoader } from "./solve-loader";

/**
 * `exerciseId` is the exercise's UUID. The practice list used to link by slug, but the
 * exercise service has no slug lookup, so the slug in the URL could only ever resolve
 * against the mock catalogue — which is exactly how a real list ended up opening
 * "Giải Phương trình Bậc hai".
 */
export default async function SolvePage({
  params,
  searchParams,
}: {
  params: Promise<{ exerciseId: string }>;
  searchParams: Promise<{ returnTo?: string; courseId?: string; lessonId?: string }>;
}) {
  const { exerciseId } = await params;
  const { returnTo, courseId, lessonId } = await searchParams;
  const backHref = returnTo?.startsWith("/") ? returnTo : "/practice";

  // Cả hai cùng có mặt mới tính. Một nửa ngữ cảnh thì judge không biết ghi tiến độ vào đâu,
  // và gửi đi một nửa chỉ tạo ra message bị learning-service vứt bỏ.
  const context = courseId && lessonId ? { courseId, lessonId, exerciseId } : undefined;

  return (
    <div className="min-h-0 flex-1">
      <SolveLoader exerciseId={exerciseId} backHref={backHref} context={context} />
    </div>
  );
}
