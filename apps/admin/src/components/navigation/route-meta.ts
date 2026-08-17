import { breadcrumbTrail, type BreadcrumbItem, type RouteMeta } from "@codementor/ui";
import { adminNavigation } from "@/components/navigation/admin-navigation";

const HOME = "/dashboard";

/**
 * Derived from the navigation itself: every admin destination is a nav entry, so a
 * hand-kept second copy of the same labels could only ever drift out of date.
 */
const ROUTES: Record<string, RouteMeta> = Object.fromEntries(
  adminNavigation.flatMap((group) =>
    group.items.map((item) => [
      item.href,
      { label: item.label, parent: item.href === HOME ? undefined : HOME },
    ]),
  ),
);

export function breadcrumbFor(pathname: string): BreadcrumbItem[] {
  return breadcrumbTrail(ROUTES, pathname);
}
