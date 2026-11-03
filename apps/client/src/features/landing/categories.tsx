import Link from "next/link";
import { BinaryIcon as Binary, CubeIcon as Blocks, BrainIcon as BrainCircuit, DatabaseIcon as Database, GlobeIcon as Globe, HardDrivesIcon as Server } from "@phosphor-icons/react/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { CourseSummary } from "@/types/catalogue";
import { LandingSection } from "./section";
import { topicCategories } from "./data";

const ICONS: Record<string, PhosphorIcon> = {
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
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const Icon = ICONS[category.key];
          return (
            <li key={category.key}>
              <Link
                href={category.href}
                className="flex h-full items-start gap-4 rounded-lg border border-border bg-surface p-5 transition-colors hover:border-text-faint"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-border-soft text-navy">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-base font-semibold text-navy">{category.label}</span>
                    <span className="shrink-0 text-xs text-text-muted">{category.courseCount} khóa học</span>
                  </span>
                  <span className="mt-1.5 line-clamp-2 block text-sm leading-6 text-text-muted">{category.topics.join(" · ")}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </LandingSection>
  );
}
