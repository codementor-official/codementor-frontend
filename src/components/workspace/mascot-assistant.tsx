"use client";

import { useState } from "react";
import { Bot, Lightbulb, Send, X } from "lucide-react";

export type MascotState = "idle" | "thinking" | "typing" | "loading" | "success" | "error";

type ChatMessage = {
  from: "user" | "codey";
  text: string;
};

const spritePosition: Record<Exclude<MascotState, "idle">, string> = {
  thinking: "100% 0%",
  typing: "0% 50%",
  loading: "33.333% 50%",
  success: "66.666% 50%",
  error: "100% 50%",
};

const stateCopy: Record<MascotState, string> = {
  idle: "Mình đang quan sát phiên làm bài và sẵn sàng đưa một gợi ý ngắn.",
  thinking: "Mình đang xem câu hỏi và tìm một gợi ý vừa đủ cho bạn...",
  typing: "Bạn cứ tiếp tục triển khai, mình sẽ không làm gián đoạn luồng code.",
  loading: "Test case đang chạy. Mình sẽ giúp bạn đọc kết quả ngay khi hoàn tất.",
  success: "Tuyệt lắm! Các test case vừa chạy đều đã đạt.",
  error: "Có test chưa đạt. Bạn có thể hỏi mình về lỗi hoặc trường hợp biên.",
};

const quickReplies: Record<string, string> = {
  "Gợi ý bước tiếp theo": "Hãy tách bài toán thành ba nhánh theo dấu của delta. Làm xong từng nhánh rồi mới tối ưu định dạng kết quả.",
  "Đọc kết quả test": "So sánh test không đạt theo ba phần: dữ liệu đầu vào, nhánh điều kiện đã chạy và định dạng output mong đợi.",
  "Tạo test case biên": "Bạn nên thử a = 0, delta = 0, delta âm và các hệ số rất lớn để kiểm tra độ ổn định.",
};

function buildReply(question: string) {
  if (quickReplies[question]) return quickReplies[question];
  const normalized = question.toLocaleLowerCase("vi");
  if (normalized.includes("lỗi") || normalized.includes("sai")) return "Bạn hãy mở tab Kết quả, chọn test chưa đạt rồi kiểm tra nhánh điều kiện tương ứng. Đừng quên sai số khi so sánh số thực.";
  if (normalized.includes("test")) return "Một bộ test tốt nên có trường hợp thông thường, trường hợp biên và dữ liệu có thể làm lộ lỗi định dạng output.";
  return "Mình gợi ý bạn viết ra input nhỏ nhất, mô phỏng từng dòng code và xác định chính xác bước đầu tiên kết quả lệch kỳ vọng.";
}

export function MascotAssistant({ state }: { state: MascotState }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [replying, setReplying] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "codey", text: "Chào bạn, mình là Codey. Mình trả lời nhanh ngay tại đây và không mở tab Trợ lý AI." },
  ]);
  const visualState: MascotState = replying ? "thinking" : state;

  function submit(raw = question) {
    const value = raw.trim();
    if (!value || replying) return;
    setMessages((current) => [...current, { from: "user", text: value }]);
    setQuestion("");
    setReplying(true);
    window.setTimeout(() => {
      setMessages((current) => [...current, { from: "codey", text: buildReply(value) }]);
      setReplying(false);
    }, 550);
  }

  return <div className="fixed right-4 bottom-4 z-40 sm:right-6 sm:bottom-6">
    {open && <section aria-label="Chat nhanh với Codey" className="absolute right-0 bottom-[calc(100%+12px)] flex max-h-[520px] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-modal">
      <header className="flex items-start gap-3 border-b border-border-soft p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary"><Bot className="h-4.5 w-4.5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-bold text-navy">Codey</h2><span className="rounded-full bg-primary-tint px-2 py-0.5 text-[9px] font-bold tracking-wide text-primary uppercase">Phản hồi nhanh</span></div>
          <p className="mt-1 text-xs leading-5 text-text-muted">{stateCopy[visualState]}</p>
        </div>
        <button type="button" aria-label="Đóng Codey" onClick={() => setOpen(false)} className="rounded-md p-1.5 text-text-faint hover:bg-bg hover:text-navy"><X className="h-4 w-4" /></button>
      </header>

      <div className="border-b border-border-soft bg-primary-tint/50 px-4 py-2.5 text-[10px] leading-4 text-text-muted">
        <span className="font-semibold text-primary">Codey</span> đưa gợi ý ngắn theo trạng thái hiện tại. Phân tích toàn bộ lời giải vẫn nằm ở tab <span className="font-semibold text-ai">Trợ lý AI</span>.
      </div>

      <div className="min-h-28 flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((message, index) => <div key={`${message.from}-${index}`} className={`flex ${message.from === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[86%] rounded-lg px-3 py-2 text-xs leading-5 ${message.from === "user" ? "bg-navy text-on-ink" : "border border-border-soft bg-bg text-text"}`}>{message.text}</div>
        </div>)}
        {replying && <div className="flex items-center gap-2 px-1 text-[11px] text-text-faint"><span className="mascot-sprite h-7 w-7" style={{ backgroundPosition: spritePosition.thinking }} /> Codey đang suy nghĩ...</div>}
      </div>

      <div className="border-t border-border-soft p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">{Object.keys(quickReplies).map((prompt) => <button key={prompt} type="button" onClick={() => submit(prompt)} disabled={replying} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-[10px] font-medium text-text-muted hover:border-primary hover:text-primary disabled:opacity-50"><Lightbulb className="h-3 w-3" />{prompt}</button>)}</div>
        <div className="flex gap-2"><input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submit()} placeholder="Hỏi nhanh Codey..." className="h-9 min-w-0 flex-1 rounded-md border border-border bg-bg px-3 text-xs text-navy outline-none focus:border-primary" /><button type="button" aria-label="Gửi câu hỏi cho Codey" onClick={() => submit()} disabled={!question.trim() || replying} className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-on-ink disabled:opacity-40"><Send className="h-3.5 w-3.5" /></button></div>
      </div>
    </section>}
    <button type="button" aria-label="Mở Codey" onClick={() => setOpen((value) => !value)} className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface shadow-dropdown transition-transform hover:-translate-y-0.5 sm:h-14 sm:w-14">
      <span className={`mascot-sprite h-11 w-11 sm:h-13 sm:w-13 ${visualState === "idle" ? "mascot-sprite-idle" : ""}`} style={visualState === "idle" ? undefined : { backgroundPosition: spritePosition[visualState] }} />
    </button>
  </div>;
}
