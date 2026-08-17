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
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { exerciseId } = await params;
  const { returnTo } = await searchParams;
  const backHref = returnTo?.startsWith("/") ? returnTo : "/practice";

  return (
    <div className="min-h-0 flex-1">
      <SolveLoader exerciseId={exerciseId} backHref={backHref} />
    </div>
  );
}
