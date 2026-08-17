import { breadcrumbTrail, type BreadcrumbItem, type RouteMeta } from "@codementor/ui";

/**
 * The one place a route's human name lives.
 *
 * Every breadcrumb in the application is derived from this map, so a new route cannot ship
 * without a trail and a rename is a one-line edit here rather than a grep across pages.
 * Keys are path prefixes; the longest matching prefix wins, and each entry names its parent
 * so the trail is a chain rather than a flat pair.
 */
const HOME = "/dashboard";

const ROUTES: Record<string, RouteMeta> = {
  "/dashboard": { label: "Tổng quan" },
  "/explore": { label: "Khám phá", parent: HOME },
  "/courses": { label: "Khóa học", parent: HOME },
  "/paths": { label: "Lộ trình", parent: HOME },
  "/practice": { label: "Luyện tập", parent: HOME },
  "/workspace": { label: "Nhóm học tập", parent: HOME },
  "/ai-tutor": { label: "Trợ lý AI", parent: HOME },
  "/settings": { label: "Cài đặt", parent: HOME },
  "/profile": { label: "Hồ sơ", parent: HOME },
  "/articles": { label: "Bài viết", parent: HOME },
  "/create-problem": { label: "Tạo bài tập", parent: HOME },
  "/lessons": { label: "Bài học", parent: "/create-problem" },
  "/solve": { label: "Làm bài", parent: "/practice" },
};

/**
 * Segments that name a nested collection rather than a place. `/paths/x/courses/y` reads
 * as "Lộ trình › X › Y" — a crumb for the bare word "courses" would point at a route that
 * does not exist. Same for "lessons" in /courses/x/lessons/y.
 */
const TRANSPARENT_SEGMENTS = ["courses", "learn", "lessons"];

/**
 * @param pathname  the current `usePathname()` value
 * @param titles    dynamic-segment slug → its real title, registered by the page that
 *                  loaded the entity. Missing entries fall back to the humanized slug.
 */
export function breadcrumbFor(
  pathname: string,
  titles: Record<string, string> = {},
): BreadcrumbItem[] {
  return breadcrumbTrail(ROUTES, pathname, { titles, transparent: TRANSPARENT_SEGMENTS });
}
