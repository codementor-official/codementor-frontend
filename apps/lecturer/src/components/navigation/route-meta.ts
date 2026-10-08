import {
  breadcrumbTrail,
  type BreadcrumbItem,
  type BreadcrumbTitleEntry,
  type RouteMeta,
} from "@codementor/ui";
import { lecturerNavigation } from "@/components/navigation/lecturer-navigation";

const HOME = "/dashboard";

/**
 * Derived from the navigation, as in apps/admin. The hand-kept copy this replaces had
 * already drifted: "/documents" was in the sidebar but not here, so that page rendered with
 * an empty topbar.
 */
const ROUTES: Record<string, RouteMeta> = Object.fromEntries(
  lecturerNavigation.flatMap((group) =>
    group.items.map((item) => [
      item.href,
      { label: item.label, parent: item.href === HOME ? undefined : HOME },
    ]),
  ),
);

/** Labels for the trailing segments the studio routes end in. */
const SEGMENT_LABELS = { studio: "Studio", solve: "Làm thử" };

export function breadcrumbFor(
  pathname: string,
  titles: Record<string, BreadcrumbTitleEntry> = {},
): BreadcrumbItem[] {
  return breadcrumbTrail(ROUTES, pathname, { titles: { ...SEGMENT_LABELS, ...titles } });
}
