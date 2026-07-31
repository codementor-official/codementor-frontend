import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";

export default function AiTutorPage() {
  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader
        title="Trợ lý AI"
        subtitle="Hỏi đáp bài học, giải thích thuật toán, phân tích lỗi và tạo bài luyện tập mới"
      />
      <div className="flex flex-1 gap-4">
        <Placeholder label="Trò chuyện với Trợ lý AI" className="flex-1" />
        <Placeholder label="Trợ lý học tập & AI luyện tập" className="w-80 shrink-0" />
      </div>
    </div>
  );
}
