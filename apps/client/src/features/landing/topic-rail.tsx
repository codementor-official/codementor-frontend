import Link from "next/link";
import type { CSSProperties } from "react";
import { Binary, Blocks, BrainCircuit, Database, Globe, Server, type LucideIcon } from "lucide-react";
import type { CourseSummary } from "@/types/catalogue";
import { topicRails, type TopicItem } from "./data";

// Mỗi bản sao phải dài hơn màn hình rộng nhất, không thì cuối vòng lộ khoảng trống.
const MIN_PER_COPY = 14;
const SECONDS_PER_ITEM = 4;

// Logo thật (devicon, MIT — qua techicons.dev) cho chủ đề là một công nghệ cụ thể; khóa theo slug chủ đề.
const TECH_LOGOS: Record<string, string> = {
  javascript: "/tech-icons/JavaScript.svg",
  python: "/tech-icons/Python.svg",
  react: "/tech-icons/React.svg",
  "tailwind-css": "/tech-icons/Tailwind-CSS.svg",
};

// Chủ đề chung (Back-end, Mảng…) không có logo: icon nét, mỗi nhóm một màu token.
const CATEGORY_ICONS: Record<string, { icon: LucideIcon; tone: string }> = {
  foundations: { icon: Blocks, tone: "text-primary" },
  web: { icon: Globe, tone: "text-accent" },
  systems: { icon: Server, tone: "text-ai" },
  database: { icon: Database, tone: "text-success" },
  algorithms: { icon: Binary, tone: "text-brown" },
  data_ai: { icon: BrainCircuit, tone: "text-ai" },
};

function TopicMark({ item }: { item: TopicItem }) {
  const logo = TECH_LOGOS[item.slug];
  // eslint-disable-next-line @next/next/no-img-element -- SVG tĩnh 20px, next/image không tối ưu được gì
  if (logo) return <img src={logo} alt="" width={20} height={20} className="size-5 shrink-0" />;
  const { icon: Icon, tone } = CATEGORY_ICONS[item.category] ?? CATEGORY_ICONS.foundations;
  return <Icon className={`size-5 shrink-0 ${tone}`} aria-hidden />;
}

function Rail({ items, reverse }: { items: TopicItem[]; reverse: boolean }) {
  const repeat = Math.ceil(MIN_PER_COPY / items.length);
  const copy = Array.from({ length: repeat }, () => items).flat();
  const style: CSSProperties = {
    animationDuration: `${copy.length * SECONDS_PER_ITEM}s`,
    animationDirection: reverse ? "reverse" : "normal",
  };
  return (
    // Cuộn ngang được để vuốt trên điện thoại; rê chuột hoặc focus vào một mục thì dừng.
    <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div
        className="flex w-max gap-3 motion-safe:[animation:landing-marquee_linear_infinite] hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] motion-reduce:w-auto motion-reduce:flex-wrap"
        style={style}
      >
        {[0, 1].map((half) =>
          copy.map((item, index) => {
            // Chỉ lần xuất hiện đầu tiên là thật với trình đọc màn hình và phím Tab; còn lại là phần lặp để chạy vòng.
            const echo = half === 1 || index >= items.length;
            return (
              <Link
                key={`${half}-${index}`}
                href={item.href}
                tabIndex={echo ? -1 : undefined}
                aria-hidden={echo || undefined}
                className={`inline-flex h-11 shrink-0 items-center gap-2.5 rounded-full border border-border bg-surface pr-4 pl-3 text-sm whitespace-nowrap shadow-xs transition-colors hover:border-navy ${echo ? "motion-reduce:hidden" : ""}`}
              >
                <TopicMark item={item} />
                <span className="font-semibold text-navy">{item.name}</span>
                <span className="text-text-muted">{item.courseCount} khóa</span>
              </Link>
            );
          }),
        )}
      </div>
    </div>
  );
}

/** Các chủ đề thật trên khóa học đang mở, chạy ngang chậm. Không có dữ liệu thì không hiện. */
export function LandingTopicRail({ courses }: { courses: CourseSummary[] }) {
  const rails = topicRails(courses);
  if (rails.length === 0) return null;
  return (
    <section aria-labelledby="topics-title" data-tone="muted" className="border-y border-border bg-bg px-4 py-8 sm:px-8">
      {/* Cùng khung 1280px với mọi section; dải chạy bị cắt ở mép khung chứ không tràn hết màn hình. */}
      <div className="mx-auto max-w-7xl">
        <h2 id="topics-title" className="text-sm font-medium text-text-muted">
          Những gì bạn học được qua các khóa đang mở — chọn một chủ đề để xem khóa học
        </h2>
        <div className="mt-5 grid gap-3">
          {rails.map((items, index) => (
            <Rail key={index} items={items} reverse={index % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
