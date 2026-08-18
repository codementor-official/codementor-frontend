"use client";

import { useParams } from "next/navigation";
import { CoursePreview } from "@/features/moderation/course-preview";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <CoursePreview id={id} />;
}
