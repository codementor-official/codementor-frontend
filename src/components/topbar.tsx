import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";

export function Topbar() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-surface px-4">
      {/* Sidebar (and its logo) is hidden below md — show the logo here instead so mobile
       * always has one. */}
      <Link href="/dashboard" className="shrink-0 md:hidden">
        <Image src="/logo.png" alt="CodeMentor" width={460} height={159} className="h-8 w-auto" priority />
      </Link>
      <div className="relative mx-auto w-full max-w-3xl">
        <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-text-faint" />
        <input
          type="text"
          placeholder="Tìm bài luyện tập, lộ trình, chủ đề..."
          className="w-full rounded-full border border-border py-2.5 pr-4 pl-10 text-sm outline-none focus:border-navy"
        />
      </div>
    </header>
  );
}
