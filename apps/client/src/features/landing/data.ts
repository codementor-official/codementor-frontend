import type { ArticleSummary, CourseSummary, RoadmapSummary } from "@/types/catalogue";

// Landing làm mới mỗi 5 phút từ danh mục công khai — chỉ ba danh sách này là đọc được khi
// chưa đăng nhập; bài tập, chủ đề và nhóm học đều cần phiên nên không có số liệu ở đây.
export const LANDING_REVALIDATE = 300;

async function publicList<T>(path: string): Promise<T[]> {
  const base = (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
  if (!base) return [];
  try {
    const res = await fetch(`${base}${path}`, { next: { revalidate: LANDING_REVALIDATE } });
    if (!res.ok) return [];
    const body = (await res.json()) as { data?: { items?: T[] } };
    return body.data?.items ?? [];
  } catch {
    // Landing không được sập vì gateway chậm: thiếu dữ liệu thì phần đó tự ẩn.
    return [];
  }
}

export async function loadLanding() {
  const [courses, roadmaps, articles] = await Promise.all([
    publicList<CourseSummary>("/courses?limit=100"),
    publicList<RoadmapSummary>("/roadmaps?limit=100"),
    publicList<ArticleSummary>("/articles?limit=100"),
  ]);
  return { courses, roadmaps, articles };
}

export type LandingData = Awaited<ReturnType<typeof loadLanding>>;

/** Cùng nhãn và thứ tự với bộ lọc chủ đề ở trang /courses. */
export const CATEGORY_LABELS: Record<string, string> = {
  foundations: "Nền tảng",
  web: "Web & JavaScript",
  systems: "Hệ thống",
  database: "Cơ sở dữ liệu",
  algorithms: "Thuật toán",
  data_ai: "Dữ liệu & AI",
};

export interface TopicCategory {
  key: string;
  label: string;
  courseCount: number;
  topics: string[];
  /** `/courses?topics=` lọc khóa có ÍT NHẤT một chủ đề trong danh sách — đúng bằng courseCount. */
  href: string;
}

/** Nhóm chủ đề thật của các khóa đang công khai, theo `category` của từng chủ đề. */
export function topicCategories(courses: CourseSummary[]): TopicCategory[] {
  const groups = new Map<string, { ids: Set<string>; names: Set<string>; courses: Set<string> }>();
  for (const course of courses) {
    for (const topic of course.topics ?? []) {
      if (!CATEGORY_LABELS[topic.category]) continue;
      const group = groups.get(topic.category) ?? { ids: new Set(), names: new Set(), courses: new Set() };
      group.ids.add(topic.id);
      group.names.add(topic.name);
      group.courses.add(course.id);
      groups.set(topic.category, group);
    }
  }
  return Object.keys(CATEGORY_LABELS)
    .filter((key) => groups.has(key))
    .map((key) => {
      const group = groups.get(key)!;
      return {
        key,
        label: CATEGORY_LABELS[key],
        courseCount: group.courses.size,
        topics: [...group.names],
        href: `/courses?topics=${[...group.ids].join(",")}`,
      };
    });
}

export interface TopicItem {
  id: string;
  slug: string;
  category: string;
  name: string;
  courseCount: number;
  href: string;
}

/**
 * Chủ đề thật trên các khóa đang mở, nhiều khóa nhất đứng trước, chia hai dải: kiến thức thuật
 * toán và phần còn lại (ngôn ngữ, công nghệ, nền tảng). Một dải quá ngắn thì gộp làm một.
 */
export function topicRails(courses: CourseSummary[]): TopicItem[][] {
  const byId = new Map<string, TopicItem>();
  for (const course of courses) {
    for (const topic of course.topics ?? []) {
      const item = byId.get(topic.id) ?? { id: topic.id, slug: topic.slug, category: topic.category, name: topic.name, courseCount: 0, href: `/courses?topics=${topic.id}` };
      item.courseCount += 1;
      byId.set(topic.id, item);
    }
  }
  const all = [...byId.values()].sort((a, b) => b.courseCount - a.courseCount || a.name.localeCompare(b.name, "vi"));
  const algorithms = all.filter((t) => t.category === "algorithms");
  const rest = all.filter((t) => t.category !== "algorithms");
  if (algorithms.length < 4 || rest.length < 4) return all.length ? [all] : [];
  return [rest, algorithms];
}

const LEVEL_ORDER = ["none", "basic", "intermediate", "experienced"];

/** Lộ trình xếp theo trình độ đầu vào; mỗi nhóm một bậc. Không suy ra thứ tự học giữa các lộ trình. */
export function roadmapsByLevel(roadmaps: RoadmapSummary[]) {
  return LEVEL_ORDER.map((level) => ({ level, roadmaps: roadmaps.filter((r) => r.level === level) })).filter(
    (stage) => stage.roadmaps.length > 0,
  );
}
