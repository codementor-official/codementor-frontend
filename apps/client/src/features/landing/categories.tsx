import Link from "next/link";
import { ArrowRight, Binary, Blocks, BrainCircuit, Database, Globe, Server, type LucideIcon } from "lucide-react";
import type { CourseSummary } from "@/types/catalogue";
import { LandingSection } from "./section";
import { topicCategories } from "./data";

const ICONS: Record<string, LucideIcon> = {
  foundations: Blocks,
  web: Globe,
  systems: Server,
  database: Database,
  algorithms: Binary,
  data_ai: BrainCircuit,
};

export function LandingCategories({ courses }: { courses: CourseSummary[] }) {
  const categories = topicCategories(courses);
  if (categories.length === 0) return null;
  return (
    <LandingSection
      id="categories"
      eyebrow="Chủ đề"
      title="Bắt đầu từ mảng bạn muốn học"
      description="Nhóm theo chủ đề của các khóa học đang mở. Chọn một nhóm để xem đúng những khóa thuộc về nó."
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const Icon = ICONS[category.key];
          return (
            <li key={category.key}>
              <Link
                href={category.href}
                className="group flex h-full items-start gap-4 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-navy"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-bg text-navy">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-base font-semibold text-navy">{category.label}</span>
                    <ArrowRight className="size-4 shrink-0 text-text-faint group-hover:text-navy" aria-hidden />
                  </span>
                  <span className="mt-0.5 block text-sm text-text-muted">{category.courseCount} khóa học</span>
                  <span className="mt-2 line-clamp-1 block text-sm text-text-faint max-sm:hidden">{category.topics.join(" · ")}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </LandingSection>
  );
}
