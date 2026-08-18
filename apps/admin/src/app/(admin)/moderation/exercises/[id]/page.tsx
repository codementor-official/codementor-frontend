"use client";

import { useParams } from "next/navigation";
import { ExerciseReview } from "@/features/moderation/exercise-review";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <ExerciseReview id={id} />;
}
