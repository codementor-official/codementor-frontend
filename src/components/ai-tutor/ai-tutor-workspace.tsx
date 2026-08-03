"use client";

import { useState } from "react";
import { Bot, BookOpen, Bug, ChevronRight, Code2, Lightbulb, Send, Sparkles, Target, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

type ChatMessage = { id: number; role: "assistant" | "user"; content: string };

const prompts = [
  "Giải thích Big-O bằng ví dụ dễ hiểu",
  "Gợi ý cách tư duy bài Two Sum",
  "Kiểm tra lỗi trong đoạn code của tôi",
];

const tools = [
  { icon: BookOpen, title: "Tóm tắt bài đang học", description: "Rút ra ý chính và ví dụ nhỏ", prompt: "Tóm tắt kiến thức quan trọng của bài Java Core đang học cho mình." },
  { icon: Lightbulb, title: "Gỡ rối khái niệm", description: "Diễn giải theo cách dễ hiểu", prompt: "Giải thích giúp mình sự khác nhau giữa stack và heap." },
  { icon: Bug, title: "Phân tích lỗi code", description: "Tìm nguyên nhân trước khi sửa", prompt: "Mình cần phân tích nguyên nhân lỗi trong đoạn code, hãy hỏi mình input và output mong đợi." },
  { icon: Code2, title: "Lập kế hoạch giải bài", description: "Chia nhỏ bước tư duy", prompt: "Hãy lập kế hoạch giải bài trước khi mình bắt đầu viết code." },
];

function answer(prompt: string) {
  if (/Big-O|độ phức tạp/i.test(prompt)) return "Hãy đếm số thao tác lặp lại khi dữ liệu tăng: duyệt một mảng n phần tử thường là O(n), còn hai vòng lặp lồng nhau thường là O(n²). Gửi mình một đoạn code nếu bạn muốn phân tích chính xác hơn.";
  if (/Two Sum|bài|kế hoạch/i.test(prompt)) return "Trước tiên hãy xác định dữ liệu cần nhớ khi duyệt từng phần tử. Với Two Sum, một hash map lưu giá trị đã gặp và chỉ số giúp bạn tìm phần bù trong O(n). Sau đó kiểm tra các trường hợp mảng rỗng và số trùng nhau.";
  if (/lỗi|code|debug/i.test(prompt)) return "Hãy gửi đoạn code, input đang dùng và kết quả bạn mong đợi. Mình sẽ cùng bạn khoanh vùng nguyên nhân, đưa ra test case nhỏ và chỉ gợi ý mức cần thiết để bạn vẫn tự hoàn thiện lời giải.";
  return "Mình đã ghi nhận yêu cầu. Bạn hãy thêm ngữ cảnh của bài học, ngôn ngữ đang dùng hoặc đoạn code để mình đưa ra gợi ý sát với tiến độ hiện tại hơn.";
}

export function AiTutorWorkspace() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: "assistant", content: "Chào Gia Sĩ! Mình đã xem tiến độ Backend Java của bạn: bạn vừa hoàn thành Cú pháp Java cơ bản và đang luyện mảng, vòng lặp. Hôm nay bạn muốn học, gỡ lỗi hay chọn bài luyện tập?" },
  ]);
  const [input, setInput] = useState("");
  const [group, setGroup] = useState("Nhóm Nhập môn Lập trình");
  const [documentName, setDocumentName] = useState("Ghi chú tự soạn.md");
  const [notice, setNotice] = useState("");

  function send(raw = input) {
    const text = raw.trim();
    if (!text) return;
    setMessages((items) => [...items, { id: Date.now(), role: "user", content: text }, { id: Date.now() + 1, role: "assistant", content: answer(text) }]);
    setInput("");
  }

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-4">
      <header className="flex flex-col justify-between gap-4 border-b border-border-soft pb-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-primary uppercase"><Sparkles className="h-4 w-4" /> Học cùng AI</div>
          <h1 className="text-3xl font-bold tracking-tight text-navy">Trợ lý AI cá nhân</h1>
          <p className="mt-1.5 max-w-3xl text-sm text-text-muted">Một không gian để hỏi bài, phân tích code và tạo kế hoạch luyện tập bám sát lộ trình Backend Java của bạn.</p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-xs"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-tint text-primary"><Target className="h-4 w-4" /></span><span><b className="block text-navy">Mục tiêu tuần này</b><span className="text-text-muted">Còn 2 giờ để hoàn thành</span></span></div>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_300px_340px] xl:grid-cols-[minmax(0,1fr)_330px]">
        <Card className="order-1 flex min-h-[620px] flex-col overflow-hidden 2xl:col-span-1">
          <div className="flex items-center justify-between border-b border-border-soft px-5 py-4"><div className="flex items-center gap-2 text-sm font-bold text-navy"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-tint"><Bot className="h-4 w-4 text-primary" /></span> Trò chuyện với trợ lý</div><span className="flex items-center gap-1.5 text-xs text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Sẵn sàng hỗ trợ</span></div>
          <div className="flex-1 space-y-4 overflow-y-auto bg-bg/55 p-5">
            {messages.map((message) => <div key={message.id} className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy"><Bot className="h-3.5 w-3.5 text-white" /></span>}
              <div className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${message.role === "user" ? "rounded-br-md bg-navy text-white" : "rounded-bl-md border border-border-soft bg-surface text-text"}`}>{message.content}</div>
            </div>)}
          </div>
          <div className="border-t border-border-soft bg-surface p-4"><div className="mb-3 flex flex-wrap gap-2">{prompts.map((prompt) => <button key={prompt} type="button" onClick={() => send(prompt)} className="rounded-full border border-border bg-bg px-3 py-1.5 text-xs font-medium text-text transition hover:border-primary hover:bg-primary-tint hover:text-navy">{prompt}</button>)}</div><div className="flex gap-2"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder="Hỏi về bài học, thuật toán hoặc lỗi code..." className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3.5 text-sm text-navy outline-none placeholder:text-text-faint focus:border-primary" /><Button onClick={() => send()}><Send className="h-4 w-4" /> Gửi</Button></div></div>
        </Card>

        <aside className="order-2 space-y-4 2xl:col-span-1">
          <Card className="p-4"><h2 className="mb-1 text-sm font-bold text-navy">Học tiếp với AI</h2><p className="mb-3 text-xs leading-relaxed text-text-muted">Chọn một tác vụ, AI sẽ dùng tiến độ hiện tại để gợi ý phù hợp.</p><div className="space-y-2">{tools.map((item) => <button key={item.title} type="button" onClick={() => send(item.prompt)} className="group flex w-full items-center gap-3 rounded-lg border border-border-soft p-3 text-left transition hover:border-primary hover:bg-primary-tint"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-bg text-primary group-hover:bg-surface"><item.icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><b className="block text-xs text-navy">{item.title}</b><span className="mt-0.5 block text-[11px] text-text-faint">{item.description}</span></span><ChevronRight className="h-4 w-4 text-text-faint" /></button>)}</div></Card>
          <Card className="p-4"><div className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /><h2 className="text-sm font-bold text-navy">Phiên học hôm nay</h2></div><div className="mt-4 space-y-3"><div><div className="mb-1 flex justify-between text-xs"><span className="text-text-muted">Java Core · Chương 1</span><b className="text-navy">2/5 bài</b></div><div className="h-1.5 overflow-hidden rounded-full bg-border-soft"><div className="h-full w-2/5 rounded-full bg-primary" /></div></div><div className="rounded-lg bg-bg p-3"><p className="text-xs font-semibold text-navy">Gợi ý tiếp theo</p><p className="mt-1 text-xs leading-relaxed text-text-muted">Luyện một bài về vòng lặp và mảng trước khi bắt đầu nội dung mới.</p><button type="button" onClick={() => send("Hãy gợi ý cho mình một bài luyện về mảng và vòng lặp phù hợp hôm nay.")} className="mt-2 text-xs font-bold text-primary">Nhờ AI chọn bài →</button></div></div></Card>
        </aside>

        <aside className="order-3 space-y-4 xl:col-span-2 2xl:col-span-1">
          <Card className="p-4"><div className="flex items-center gap-2"><WandSparkles className="h-4 w-4 text-primary" /><h2 className="text-sm font-bold text-navy">Tạo bài luyện tập với AI</h2></div><p className="mt-1 text-xs leading-relaxed text-text-muted">Dựa trên tài liệu của nhóm, tạo bản nháp để bạn duyệt trước khi giao bài.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-1"><Select label="Nhóm học" shape="box" value={group} onChange={setGroup} options={[{ value: "Nhóm Nhập môn Lập trình", label: "Nhóm Nhập môn Lập trình" }, { value: "Python cho Người mới", label: "Python cho Người mới" }]} /><Select label="Tài liệu" shape="box" value={documentName} onChange={setDocumentName} options={[{ value: "Ghi chú tự soạn.md", label: "Ghi chú tự soạn.md" }, { value: "Slide buổi 4", label: "Slide buổi 4" }]} /></div><div className="mt-3 space-y-2">{[["Một bài nền tảng", "10–15 phút · input/output rõ ràng"], ["Bài vận dụng", "Liên hệ kiến thức vừa học"], ["Bộ 3 câu ôn tập", "Tăng dần mức độ khó"]].map(([title, detail]) => <button key={title} type="button" onClick={() => setNotice(`Đã tạo bản nháp “${title}” từ ${documentName}. Bạn có thể xem và chỉnh sửa trước khi gửi vào ${group}.`)} className="w-full rounded-lg border border-border px-3 py-2.5 text-left transition hover:border-primary hover:bg-bg"><span className="block text-xs font-semibold text-navy">{title}</span><span className="mt-0.5 block text-[11px] text-text-faint">{detail}</span></button>)}</div>{notice && <p className="mt-3 rounded-lg bg-primary-tint p-3 text-xs leading-relaxed text-navy">{notice}</p>}</Card>
        </aside>
      </div>
    </div>
  );
}
