import { Card } from "@/components/ui/card";

export function RoadmapLoadingState() {
  return (
    <div>
      <div className="mb-6 h-40 animate-pulse rounded-xl bg-border-soft" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-56 animate-pulse border-transparent bg-border-soft shadow-none" />
        ))}
      </div>
    </div>
  );
}
