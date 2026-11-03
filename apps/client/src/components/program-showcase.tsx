import Image from "next/image";
import Link from "next/link";

/** Ảnh trong public/programs/ — tạo lại bằng scripts/render-program-thumbnails.mjs. */
const PROGRAMS = [
  { title: "Khóa học", text: "Bài video và bài đọc do giảng viên biên soạn, tiến độ lưu theo từng bài.", href: "/courses", image: "/programs/courses.png" },
  { title: "Lộ trình", text: "Nhiều khóa xếp theo thứ tự, biết học gì trước và còn bao lâu.", href: "/roadmaps", image: "/programs/roadmaps.png" },
  { title: "Luyện tập", text: "Viết code ngay trong trình duyệt, chạy test thử rồi nộp để chấm.", href: "/practice", image: "/programs/practice.png" },
  { title: "Nhóm học tập", text: "Giảng viên giao bài có hạn nộp, theo dõi tiến độ cả lớp.", href: "/workspace", image: "/programs/groups.png" },
  { title: "Trợ lý AI", text: "Hỏi về bài đang học, câu trả lời dựa trên tài liệu khóa học.", href: "/ai-tutor", image: "/programs/assistant.png" },
];

/**
 * Các mảng chính của hệ thống, mỗi mảng một ảnh minh họa màn hình thật.
 * `grid`: thẻ dọc cho landing; `list`: hàng ngang gọn cho dashboard.
 */
export function ProgramShowcase({ layout = "grid" }: { layout?: "grid" | "list" }) {
  if (layout === "list") {
    return (
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {PROGRAMS.map((program) => (
          <li key={program.href}>
            <Link href={program.href} className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-card transition-colors hover:border-text-faint">
              <Image src={program.image} alt="" width={640} height={360} sizes="(min-width: 1280px) 240px, 50vw" className="aspect-video w-full object-cover" />
              <span className="p-3">
                <span className="block text-sm font-semibold text-navy">{program.title}</span>
                <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-text-muted">{program.text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }
  // Thẻ đầu chiếm 2×2 ô: một banner lớn, bốn thẻ nhỏ lấp phần còn lại.
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {PROGRAMS.map((program, index) => (
        <li key={program.href} className={index === 0 ? "md:col-span-2 lg:row-span-2" : undefined}>
          <Link href={program.href} className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-card transition-colors hover:border-text-faint">
            <Image
              src={program.image}
              alt=""
              width={1280}
              height={720}
              sizes={index === 0 ? "(min-width: 1024px) 640px, 100vw" : "(min-width: 1024px) 320px, 50vw"}
              className={index === 0 ? "min-h-64 w-full flex-1 bg-ink-fixed object-contain" : "aspect-video w-full object-cover"}
            />
            <span className={index === 0 ? "p-6" : "p-4"}>
              <span className={`block font-semibold text-navy ${index === 0 ? "text-xl" : "text-base"}`}>{program.title}</span>
              <span className={`mt-1 block leading-6 text-text-muted ${index === 0 ? "text-base" : "line-clamp-2 text-sm"}`}>{program.text}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
