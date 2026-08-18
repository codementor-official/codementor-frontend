"use client";

import { useParams } from "next/navigation";
import { RoadmapPreview } from "@/features/moderation/roadmap-preview";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <RoadmapPreview id={id} />;
}
