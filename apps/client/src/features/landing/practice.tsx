import { Bot, Code2, FlaskConical, MessagesSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const POINTS = [
  { icon: Code2, title: "Editor ngay trong trình duyệt", text: "Monaco, nhiều ngôn ngữ, tự lưu bài đang làm." },
  { icon: FlaskConical, title: "Chạy test trước khi nộp", text: "Test công khai để thử, test ẩn để chấm — xem kết quả từng case." },
  { icon: Bot, title: "Codey gợi ý đúng lúc", text: "Đọc trạng thái bài và kết quả test để nhắc một bước, không giải hộ." },
  { icon: MessagesSquare, title: "Thảo luận theo từng bài", text: "Trao đổi hướng giải với người cùng làm bài đó." },
];

/** Dải nền tối duy nhất của trang, cùng màu khối code — tạo nhịp mà không cần gradient. */
export function LandingPractice() {
  return (
    <section aria-labelledby="practice-title" data-tone="dark" className="bg-ink-fixed px-4 py-12 text-on-ink-fixed sm:px-8 lg:py-16">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <div>
          <p className="text-xs font-semibold tracking-wider text-on-ink-fixed/60 uppercase">Luyện tập</p>
          <h2 id="practice-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Học xong một bài, làm ngay một bài
          </h2>
          <p className="mt-3 text-base leading-7 text-on-ink-fixed/75">
            Đề bài, code và kết quả test nằm trên cùng một màn hình, nên bạn sửa và chạy lại ngay khi thấy sai.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/practice" className="h-12 px-6 text-base">Mở ngân hàng bài tập</Button>
            <Button href="/ai-tutor" variant="outline" className="h-12 px-6 text-base">
              <Sparkles className="size-4" aria-hidden /> Hỏi Trợ lý AI
            </Button>
          </div>
        </div>
        <ul className="grid gap-px overflow-hidden rounded-2xl border border-on-ink-fixed/15 bg-on-ink-fixed/15 sm:grid-cols-2">
          {POINTS.map((point) => (
            <li key={point.title} className="bg-ink-fixed p-6">
              <point.icon className="size-6 text-primary-fixed" aria-hidden />
              <h3 className="mt-4 text-base font-semibold">{point.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-on-ink-fixed/70">{point.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
