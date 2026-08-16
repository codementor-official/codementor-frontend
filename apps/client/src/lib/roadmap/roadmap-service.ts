import { learningRoadmaps } from "@/data/roadmaps";
import type { Course, LearningRoadmap } from "@/types/roadmap";

const MOCK_LATENCY_MS = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

function slugToTitle(slug: string) {
  return slug
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

/** Same graceful-fallback behaviour the old path-detail mock had: an unknown
 * slug renders a placeholder instead of a broken link. */
function buildFallbackRoadmap(slug: string): LearningRoadmap {
  return {
    id: `fallback-${slug}`,
    slug,
    title: slugToTitle(slug),
    thumbnail: "{ }",
    shortDescription: "Lộ trình đang được biên soạn — nội dung chi tiết sẽ sớm cập nhật.",
    description: "Lộ trình đang được biên soạn — nội dung chi tiết sẽ sớm cập nhật.",
    field: "foundation",
    level: "basic",
    technologies: [],
    estimatedHours: 40,
    prerequisites: [],
    learningOutcomes: ["Nội dung đang được cập nhật"],
    targetAudience: [],
    courses: [],
    popularity: 0,
    updatedAt: new Date().toISOString().slice(0, 10),
    userProgress: null,
  };
}

/**
 * Mock data-access layer shaped like a future REST/GraphQL client — every
 * method is async and returns plain data, so swapping the body for a real
 * `fetch` call later doesn't change any call site.
 */
export const roadmapService = {
  async getAll(): Promise<LearningRoadmap[]> {
    return delay(learningRoadmaps);
  },
  async getBySlug(slug: string): Promise<LearningRoadmap> {
    return delay(learningRoadmaps.find((r) => r.slug === slug) ?? buildFallbackRoadmap(slug));
  },
  async getCourse(roadmapSlug: string, courseSlug: string): Promise<{ roadmap: LearningRoadmap; course: Course } | undefined> {
    const roadmap = await this.getBySlug(roadmapSlug);
    const course = roadmap.courses.find((c) => c.slug === courseSlug);
    return course ? { roadmap, course } : undefined;
  },
};
