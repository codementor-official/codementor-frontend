import Link from "next/link";
import { Placeholder } from "@/components/placeholder";

export default async function PathDetailPage({
  params,
}: {
  params: Promise<{ pathId: string }>;
}) {
  const { pathId } = await params;

  return (
    <div>
      <Link href="/paths" className="mb-4 inline-block text-sm text-zinc-500">
        ← Quay lại lộ trình học
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <Placeholder label={`Hero lộ trình: ${pathId}`} className="mb-5 h-32" />
          <Placeholder label="Bạn sẽ học được gì" className="mb-4" />
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <Placeholder label="Điều kiện tiên quyết" className="flex-1" />
            <Placeholder label="Công nghệ liên quan" className="flex-1" />
          </div>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Placeholder key={i} label={`Chương ${i + 1}`} />
            ))}
          </div>
        </div>
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <Placeholder label="Tiến độ của bạn" />
          <Placeholder label="Đánh giá khóa học" />
          <Placeholder label="Nhận xét từ học viên" />
        </div>
      </div>
    </div>
  );
}
