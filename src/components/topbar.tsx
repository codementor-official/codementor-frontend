import Image from "next/image";
import Link from "next/link";

export function Topbar() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-zinc-200 bg-white px-4">
      <Link href="/dashboard" className="shrink-0">
        <Image src="/logo.png" alt="CodeMentor" width={460} height={159} className="h-10 w-auto" priority />
      </Link>
      <input
        type="text"
        placeholder="Tìm bài luyện tập, lộ trình, chủ đề..."
        className="hidden max-w-xs flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm sm:block"
      />
      <div className="flex-1" />
    </header>
  );
}
