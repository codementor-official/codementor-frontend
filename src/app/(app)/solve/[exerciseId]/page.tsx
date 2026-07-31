import { Placeholder } from "@/components/placeholder";

export default async function SolvePage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;

  return (
    <div className="-m-6 flex h-[calc(100%+3rem)] flex-col">
      <div className="flex flex-1 min-h-0">
        <Placeholder label={`Đề bài / Thảo luận: ${exerciseId}`} className="w-72 shrink-0 border-r" />
        <div className="flex flex-1 flex-col min-w-0">
          <Placeholder label="Trình soạn code" className="flex-1 rounded-none border-x-0 border-t-0" />
          <Placeholder label="Kết quả kiểm thử" className="h-48 shrink-0 rounded-none border-x-0 border-b-0" />
        </div>
        <Placeholder label="Gợi ý AI / Trò chuyện AI" className="w-72 shrink-0 border-l" />
      </div>
    </div>
  );
}
