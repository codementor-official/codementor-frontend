import Link from "next/link";
import { visibleTabs, type GroupTabKey } from "./group-tabs";

/** URL-driven tabs (`?tab=`) so a tab is shareable and the back button works. */
export function GroupTabNav({
  groupId,
  active,
  isOwner,
}: {
  groupId: string;
  active: GroupTabKey;
  isOwner: boolean;
}) {
  return (
    <div className="scrollbar-none mb-5 overflow-x-auto border-b border-border">
      <nav className="flex min-w-max gap-1" aria-label="Mục của nhóm">
        {visibleTabs(isOwner).map((tab) => {
          const isActive = tab.key === active;
          return (
            <Link
              key={tab.key}
              href={`/workspace/${groupId}?tab=${tab.key}`}
              aria-current={isActive ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "border-primary text-navy"
                  : "border-transparent text-text-muted hover:border-border hover:text-navy"
              }`}
            >
              <tab.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
