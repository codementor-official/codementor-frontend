import { ArrowUpRight, Database, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AdminSectionDefinition } from "@/features/admin-section/data/admin-sections";

export function AdminSectionPage({ section }: { section: AdminSectionDefinition }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{section.eyebrow}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">{section.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{section.description}</p>
        </div>
        <Button variant="outline">View activity <ArrowUpRight aria-hidden="true" className="size-4" /></Button>
      </div>

      <Card className="grid grid-cols-1 overflow-hidden sm:grid-cols-3">
        {section.highlights.map((highlight, index) => (
          <div className={`p-5 ${index < section.highlights.length - 1 ? "border-b sm:border-b-0 sm:border-r" : ""}`} key={highlight.label}>
            <p className="text-xs text-muted-foreground">{highlight.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{highlight.value}</p>
          </div>
        ))}
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
          <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border bg-background px-3 text-sm text-muted-foreground">
            <Search aria-hidden="true" className="size-4" />
            <span>Search {section.title.toLowerCase()}...</span>
          </div>
          <Button variant="outline"><Filter aria-hidden="true" className="size-4" />Filters</Button>
        </div>
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="flex size-10 items-center justify-center rounded-lg border bg-muted/50">
            <Database aria-hidden="true" className="size-5 text-muted-foreground" />
          </span>
          <h2 className="mt-4 text-sm font-semibold">Management workspace ready</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            This route uses the shared Admin shell and is ready for API-backed tables, filters, and actions.
          </p>
        </div>
      </Card>
    </div>
  );
}
