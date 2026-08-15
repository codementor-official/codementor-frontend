import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/page/empty-state";
import { PageHeader } from "@/components/page/page-header";

interface NotBuiltYetProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

/**
 * A named placeholder rather than four near-identical pages. The navigation links
 * to these routes already, and a sidebar entry that 404s is worse than one that
 * says plainly the screen is not built yet.
 */
export function NotBuiltYet({ title, description, icon }: NotBuiltYetProps) {
  return (
    <>
      <PageHeader description={description} title={title} />
      <EmptyState
        description="Màn hình này chưa được dựng. Xem plan-lecturer.md — Phase 4 dựng khung CRUD, Phase 5 mới làm nghiệp vụ chuyên sâu."
        icon={icon}
        title="Chưa có gì ở đây"
      />
    </>
  );
}
