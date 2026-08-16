import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * The three states a backend-backed list can be in, drawn the same way on every page.
 *
 * Loading is a skeleton shaped like the grid it replaces, so the page does not jump when
 * data lands. Empty says the catalogue is empty rather than pretending the filter is at
 * fault — the backend has no published roadmaps or courses yet, and that is worth seeing.
 */
export function CatalogueSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: count }).map((_, index) => (
        <li key={index}>
          <Card className="h-56 animate-pulse">
            <div className="h-20 rounded-t-lg bg-border-soft" />
            <div className="flex flex-col gap-2 p-4">
              <div className="h-3 w-2/3 rounded bg-border-soft" />
              <div className="h-3 w-full rounded bg-border-soft" />
              <div className="h-3 w-4/5 rounded bg-border-soft" />
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function CatalogueEmpty({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-dashed p-10 text-center">
      <Icon className="mx-auto mb-2 h-5 w-5 text-text-faint" />
      <p className="text-sm font-semibold text-navy">{title}</p>
      <p className="mt-1 text-xs text-text-faint">{description}</p>
    </Card>
  );
}

export function CatalogueError({ message }: { message: string }) {
  return (
    <Card className="border-dashed border-primary/30 p-10 text-center">
      <p className="text-sm font-semibold text-navy">Không tải được dữ liệu</p>
      <p className="mt-1 text-xs text-text-muted">{message}</p>
      <p className="mt-2 text-2xs text-text-faint">
        Kiểm tra gateway ở <code className="font-mono">localhost:8000</code> và phiên đăng nhập.
      </p>
    </Card>
  );
}
