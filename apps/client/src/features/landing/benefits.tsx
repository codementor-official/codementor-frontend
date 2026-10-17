import { BarChart3, BookOpen, Bot, Map, ShieldCheck, UsersRound } from "lucide-react";
import { LandingSection } from "./section";

// Mỗi dòng ứng với một tính năng đang chạy trong app, không phải lời hứa chung chung.
const BENEFITS = [
  { icon: BookOpen, title: "Khóa học do giảng viên biên soạn", text: "Chia chương, bài video và bài đọc; được duyệt trước khi công khai." },
  { icon: Map, title: "Lộ trình có thứ tự", text: "Biết khóa nào học trước, khóa nào học sau, tổng thời lượng và chi phí." },
  { icon: ShieldCheck, title: "Bài tập chấm tự động", text: "Mỗi bài nộp chạy qua bộ test của đề, kết quả rõ đạt hay chưa." },
  { icon: BarChart3, title: "Theo dõi tiến độ", text: "Tiến độ từng khóa, XP và chuỗi ngày học trên bảng điều khiển của bạn." },
  { icon: Bot, title: "Hai mức hỗ trợ AI", text: "Codey gợi ý nhanh khi làm bài; Trợ lý AI trả lời sâu hơn về kiến thức." },
  { icon: UsersRound, title: "Nhóm học", text: "Tài liệu, bài tập và thảo luận chung cho lớp học hoặc nhóm bạn." },
];

export function LandingBenefits() {
  return (
    <LandingSection id="benefits" eyebrow="Vì sao CodeMentor" title="Mọi thứ cần để học lập trình, ở cùng một chỗ">
      <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {BENEFITS.map((benefit) => (
          <li key={benefit.title} className="border-t border-border pt-5">
            <benefit.icon className="size-6 text-navy" aria-hidden />
            <h3 className="mt-4 text-base font-semibold text-navy">{benefit.title}</h3>
            <p className="mt-1.5 text-sm leading-6 text-text-muted">{benefit.text}</p>
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
