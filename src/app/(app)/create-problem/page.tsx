import { Placeholder } from "@/components/placeholder";

export default function CreateProblemPage() {
  return (
    <div className="flex h-full flex-col gap-4">
      <Placeholder label="Toolbar: tiêu đề, độ khó, tags, trợ lý AI, lưu bài tập" />
      <div className="flex flex-1 gap-4">
        <div className="flex flex-1 flex-col gap-4">
          <Placeholder label="Đề bài, ví dụ, ràng buộc" />
          <Placeholder label="Gợi ý (3 mức)" />
          <Placeholder label="Ngôn ngữ cho phép & code mẫu" />
          <Placeholder label="Test case" />
        </div>
        <Placeholder label="Trợ lý tạo đề (AI)" className="w-80 shrink-0" />
      </div>
    </div>
  );
}
