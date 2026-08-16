"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Breadcrumb } from "@codementor/ui";
import { breadcrumbFor } from "@/lib/navigation/route-meta";
import { useBreadcrumbTitleStore } from "@/lib/store/breadcrumb-title-store";

/** The shell's breadcrumb. Derived from the route map — pages never render their own. */
export function AppBreadcrumb() {
  const pathname = usePathname();
  const titles = useBreadcrumbTitleStore((state) => state.titles);

  return <Breadcrumb items={breadcrumbFor(pathname, titles)} className="flex-1" />;
}

/**
 * Registers the real title of a dynamic segment so the trail reads "Lộ trình › Frontend
 * Developer" rather than "Lộ trình › Frontend developer". Render it anywhere inside a
 * detail page; it draws nothing.
 */
export function BreadcrumbTitle({ slug, title }: { slug: string; title: string }) {
  const setTitle = useBreadcrumbTitleStore((state) => state.setTitle);
  useEffect(() => setTitle(slug, title), [slug, title, setTitle]);
  return null;
}
