import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

export const LANDING_NAV = [
  { label: "Khóa học", href: "/courses" },
  { label: "Lộ trình", href: "/roadmaps" },
  { label: "Luyện tập", href: "/practice" },
  { label: "Nhóm học", href: "/workspace" },
  { label: "Bài viết", href: "/articles" },
];

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface px-4 sm:px-8">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6">
        <Link href="/" aria-label="CodeMentor — trang chủ" className="shrink-0 rounded-md">
          <BrandLogo size="sm" priority />
        </Link>
        <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 lg:flex">
          {LANDING_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm font-medium text-text-muted hover:bg-bg hover:text-navy">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex-1" />
        <Link href="/login" className="hidden rounded-md px-3 py-2 text-sm font-semibold text-navy hover:bg-bg sm:inline-flex">
          Đăng nhập
        </Link>
        <Button href="/signup" className="h-10 max-sm:hidden">Đăng ký miễn phí</Button>
        {/* <details> mở/đóng không cần JS, nên header vẫn là server component. */}
        <details className="group relative lg:hidden">
          <summary
            aria-label="Mở menu"
            className="flex size-11 cursor-pointer list-none items-center justify-center rounded-md border border-border text-navy [&::-webkit-details-marker]:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </summary>
          <nav
            aria-label="Điều hướng trên di động"
            className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-2 shadow-lg"
          >
            {LANDING_NAV.map((item) => (
              <Link key={item.href} href={item.href} className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-navy hover:bg-bg">
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid gap-2 border-t border-border pt-2 sm:hidden">
              <Button href="/login" variant="outline" className="h-11">Đăng nhập</Button>
              <Button href="/signup" className="h-11">Đăng ký miễn phí</Button>
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}
