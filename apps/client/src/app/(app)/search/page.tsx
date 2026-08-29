import { ExploreScreen } from "@/features/discovery/components/explore-screen";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <ExploreScreen initialQuery={q ?? ""} />;
}
