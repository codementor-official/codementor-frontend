import { ExploreLandingScreen } from "@/features/discovery/components/explore-landing-screen";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <ExploreLandingScreen initialQuery={q ?? ""} />;
}
