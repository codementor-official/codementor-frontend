import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { roleHomes } from "@/lib/env";
import type { LandingData } from "./data";

export function LandingFooter({ courses, roadmaps, articles }: LandingData) {
  const groups = [
    { title: "Học tập", links: [["Khóa học", "/courses"], ["Lộ trình", "/roadmaps"], ["Luyện tập", "/practice"], ["Khám phá", "/explore"]] },
    { title: "Cộng đồng", links: [["Nhóm học", "/workspace"], ["Bài viết", "/articles"], ["Trợ lý AI", "/ai-tutor"]] },
    { title: "Tài khoản", links: [["Đăng nhập", "/login"], ["Đăng ký", "/signup"], ["Khóa học đã mua", "/purchases"], ["Đã lưu", "/saved"]] },
    ...(roleHomes.lecturerAppUrl ? [{ title: "Giảng dạy", links: [["Kênh giảng viên", roleHomes.lecturerAppUrl]] }] : []),
  ];
  const catalogue = [
    [courses.length, "khóa học"],
    [roadmaps.length, "lộ trình"],
    [articles.length, "bài viết"],
  ].filter(([value]) => Number(value) > 0);

  return (
    <footer className="border-t border-border bg-bg px-4 pt-12 pb-8 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.3fr_2fr]">
        <div className="max-w-sm">
          <BrandLogo size="sm" />
<p className="mt-4 text-sm leading-6 text-text-muted">
  Nền tảng học lập trình: khóa học từ giảng viên, lộ trình xếp sẵn, bài tập chấm tự động và trợ lý AI khi bạn cần <span className="whitespace-nowrap">gợi ý.</span>
</p>
          {catalogue.length > 0 && (
            <p className="mt-4 text-sm text-text-muted">
              Hiện có {catalogue.map(([value, label]) => `${value} ${label}`).join(" · ")}.
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="text-sm font-semibold text-navy">{group.title}</p>
              <ul className="mt-3 space-y-1">
                {group.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="inline-flex min-h-9 items-center text-sm text-text-muted hover:text-navy">{label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-sm text-text-faint">
        <span>© {new Date().getFullYear()} CodeMentor</span>
        <span>Số liệu danh mục cập nhật mỗi 5 phút.</span>
      </div>
    </footer>
  );
}
