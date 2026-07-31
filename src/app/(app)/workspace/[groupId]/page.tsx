import Link from "next/link";
import { Placeholder } from "@/components/placeholder";

const tabs = [
  { key: "overview", label: "Tổng quan" },
  { key: "docs", label: "Tài liệu" },
  { key: "exercises", label: "Bài tập" },
  { key: "assign", label: "Phân công & Nộp bài" },
  { key: "members", label: "Thành viên" },
  { key: "progress", label: "Tiến độ" },
] as const;

export default async function WorkspaceGroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { groupId } = await params;
  const { tab = "overview" } = await searchParams;

  return (
    <div>
      <Link href="/workspace" className="mb-4 inline-block text-sm text-zinc-500">
        ← Danh sách nhóm
      </Link>

      <h1 className="mb-4 text-xl font-bold text-zinc-900">Nhóm: {groupId}</h1>

      <div className="mb-6 flex gap-6 border-b border-zinc-200 text-sm font-medium">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/workspace/${groupId}?tab=${t.key}`}
            className={`border-b-2 pb-3 ${
              tab === t.key
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <Placeholder label={`Nội dung tab: ${tab}`} className="min-h-40" />
    </div>
  );
}
