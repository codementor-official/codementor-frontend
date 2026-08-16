import type { BreadcrumbItem } from "@codementor/ui";

/**
 * The one place a route's human name lives.
 *
 * Every breadcrumb in the application is derived from this map, so a new route cannot ship
 * without a trail and a rename is a one-line edit here rather than a grep across pages.
 * Keys are path prefixes; the longest matching prefix wins, and each entry names its parent
 * so the trail is a chain rather than a flat pair.
 */
interface RouteMeta {
  label: string;
  /** The path of the crumb before this one. Omitted on top-level destinations. */
  parent?: string;
}

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

/** A slug with no registered title still has to read as words, not as a URL fragment. */
function humanizeSlug(slug: string): string {
  const words = decodeURIComponent(slug).replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Segments that name a nested collection rather than a place. `/paths/x/courses/y` reads
 * as "Lộ trình › X › Y" — a crumb for the bare word "courses" would point at a route that
 * does not exist.
 */
const TRANSPARENT_SEGMENTS = new Set(["courses", "learn"]);

/**
 * @param pathname  the current `usePathname()` value
 * @param titles    dynamic-segment slug → its real title, registered by the page that
 *                  loaded the entity. Missing entries fall back to the humanized slug.
 */
export function breadcrumbFor(
  pathname: string,
  titles: Record<string, string> = {},
): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [];

  const root = `/${segments[0]}`;
  const meta = ROUTES[root];
  // An unregistered route gets no invented trail — that omission is the signal to add it
  // to this map, and it is a great deal louder than a plausible-looking wrong crumb.
  if (!meta) return [];

  const items: BreadcrumbItem[] = [];

  for (let parent = meta.parent; parent; parent = ROUTES[parent]?.parent) {
    items.unshift({ label: ROUTES[parent]?.label ?? humanizeSlug(parent.slice(1)), href: parent });
  }

  items.push({ label: meta.label, href: root });

  let href = root;
  for (const segment of segments.slice(1)) {
    href += `/${segment}`;
    if (TRANSPARENT_SEGMENTS.has(segment)) continue;
    items.push({ label: titles[segment] ?? humanizeSlug(segment), href });
  }

  // The current page is announced, not linked.
  const last = items[items.length - 1];
  if (last) delete last.href;

  return items;
}
