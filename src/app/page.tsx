import Link from "next/link";
import { Placeholder } from "@/components/placeholder";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 items-center gap-6 border-b border-zinc-200 px-10">
        <span className="text-lg font-bold text-zinc-900">CodeMentor</span>
        <div className="flex-1" />
        <Link href="/login" className="text-sm font-medium text-zinc-700">
          Đăng nhập
        </Link>
        <Link
          href="/signup"
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Đăng ký miễn phí
        </Link>
      </header>

      <section className="bg-zinc-900 px-10 py-16 text-white">
        <h1 className="mb-4 max-w-xl text-4xl font-bold">
          Học tốt hơn, lập trình tự tin hơn
        </h1>
        <p className="mb-6 max-w-lg text-zinc-300">
          Nền tảng tự học và luyện tập lập trình cho tất cả mọi người.
        </p>
        <Link
          href="/signup"
          className="inline-block rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold"
        >
          Bắt đầu miễn phí →
        </Link>
      </section>

      <main className="flex flex-1 flex-col gap-8 px-10 py-14">
        <Placeholder label="Tính năng chính" />
        <Placeholder label="Cách hoạt động" />
        <Placeholder label="Không gian làm việc / Nhóm học tập" />
        <Placeholder label="Sinh viên nói gì" />
        <Placeholder label="Câu hỏi thường gặp" />
      </main>

      <footer className="flex justify-between border-t border-zinc-200 px-10 py-6 text-xs text-zinc-400">
        <span>© 2026 CodeMentor</span>
        <div className="flex gap-4">
          <Link href="#">Giới thiệu</Link>
          <Link href="#">Hỗ trợ</Link>
        </div>
      </footer>
    </div>
  );
}
