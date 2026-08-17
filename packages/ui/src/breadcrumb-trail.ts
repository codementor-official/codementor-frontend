import type { BreadcrumbItem } from "./breadcrumb";

/**
 * A route's human name and where it sits in the trail. Keys of the map passed to
 * `breadcrumbTrail` are top-level path prefixes ("/courses"), and each entry names its
 * parent so the trail is a chain rather than a flat pair.
 */
export interface RouteMeta {
  label: string;
  /** The path of the crumb before this one. Omitted on top-level destinations. */
  parent?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A slug with no registered title still has to read as words, not as a URL fragment. */
function humanizeSlug(slug: string): string {
  const words = decodeURIComponent(slug).replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Builds the trail for `pathname` from an application's route map.
 *
 * Shared because all three shells need the same walk and the client application already
 * had the only correct implementation of it.
 *
 * @param routes    path prefix → its label and parent
 * @param pathname  the current `usePathname()` value
 * @param titles    dynamic-segment slug → its real title, registered by the page that
 *                  loaded the entity. Missing entries fall back to the humanized slug.
 * @param transparent  segments that name a nested collection rather than a place, e.g.
 *                  "lessons" in /courses/x/lessons/y — a crumb for the bare word would
 *                  point at a route that does not exist.
 */
export function breadcrumbTrail(
  routes: Record<string, RouteMeta>,
  pathname: string,
  {
    titles = {},
    transparent = [],
  }: { titles?: Record<string, string>; transparent?: readonly string[] } = {},
): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [];

  const root = `/${segments[0]}`;
  const meta = routes[root];
  // An unregistered route gets no invented trail — that omission is the signal to add it
  // to the map, and it is a great deal louder than a plausible-looking wrong crumb.
  if (!meta) return [];

  const skip = new Set(transparent);
  const items: BreadcrumbItem[] = [];

  for (let parent = meta.parent; parent; parent = routes[parent]?.parent) {
    items.unshift({ label: routes[parent]?.label ?? humanizeSlug(parent.slice(1)), href: parent });
  }

  items.push({ label: meta.label, href: root });

  let href = root;
  for (const segment of segments.slice(1)) {
    href += `/${segment}`;
    if (skip.has(segment)) continue;
    const title = titles[segment];
    // An id nobody registered a title for is noise: "Khóa học › 3f2a1c…" tells the reader
    // less than "Khóa học › Studio". Pages that know the real name register it and it
    // shows up here instead.
    if (!title && UUID.test(segment)) continue;
    items.push({ label: title ?? humanizeSlug(segment), href });
  }

  // The current page is announced, not linked.
  const last = items[items.length - 1];
  if (last) delete last.href;

  return items;
}
