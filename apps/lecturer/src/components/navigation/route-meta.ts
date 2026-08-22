import {
  breadcrumbTrail,
  type BreadcrumbItem,
  type BreadcrumbTitleEntry,
  type RouteMeta,
} from "@codementor/ui";

/**
 * The one place a lecturer route's human name lives. Same contract as the web
 * application's map: keys are top-level prefixes, each entry names its parent.
 */
const HOME = "/dashboard";

const ROUTES: Record<string, RouteMeta> = {
  "/dashboard": { label: "Bảng điều khiển" },
  "/roadmaps": { label: "Lộ trình", parent: HOME },
  "/courses": { label: "Khóa học", parent: HOME },
  "/exercises": { label: "Bài code", parent: HOME },
  "/articles": { label: "Bài viết", parent: HOME },
  "/profile": { label: "Hồ sơ", parent: HOME },
};

/** Labels for the trailing segments the studio routes end in. */
const SEGMENT_LABELS = { studio: "Studio", solve: "Làm thử" };

export function breadcrumbFor(
  pathname: string,
  titles: Record<string, BreadcrumbTitleEntry> = {},
): BreadcrumbItem[] {
  return breadcrumbTrail(ROUTES, pathname, { titles: { ...SEGMENT_LABELS, ...titles } });
}
