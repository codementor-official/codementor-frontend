import { learningRoadmaps } from "@/data/roadmaps";
import type { Difficulty } from "@/components/ui/badge";
import type { CurrentLevel } from "@/types/learning-preference";
import type { Course } from "@/types/roadmap";

export interface CatalogCourse extends Course {
  roadmapSlug: string;
  roadmapTitle: string;
}

/** Every course across every roadmap, flattened into one browsable catalog — this is the
 * real course data (Explore/Dashboard used to show 4 disconnected mock entries instead). */
export const courseCatalog: CatalogCourse[] = learningRoadmaps.flatMap((roadmap) =>
  roadmap.courses.map((course) => ({ ...course, roadmapSlug: roadmap.slug, roadmapTitle: roadmap.title })),
);

const LEVEL_TO_DIFFICULTY: Record<CurrentLevel, Difficulty> = {
  none: "Cơ bản",
  basic: "Cơ bản",
  intermediate: "Trung bình",
  experienced: "Nâng cao",
};

export function courseDifficulty(level: CurrentLevel): Difficulty {
  return LEVEL_TO_DIFFICULTY[level];
}

export function courseHref(course: CatalogCourse): string {
  return `/paths/${course.roadmapSlug}/courses/${course.slug}`;
}

/** One course per roadmap, in catalog order — gives topic variety for a "featured courses"
 * row instead of e.g. 10 straight chapters from the same roadmap. */
export const featuredCourses: CatalogCourse[] = (() => {
  const seenRoadmaps = new Set<string>();
  return courseCatalog.filter((c) => {
    if (seenRoadmaps.has(c.roadmapSlug)) return false;
    seenRoadmaps.add(c.roadmapSlug);
    return true;
  });
})();
