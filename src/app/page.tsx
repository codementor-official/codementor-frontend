import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Lightbulb,
  Terminal,
  Users,
} from "lucide-react";
import { Testimonials } from "@/components/landing/testimonials";
import { Faq } from "@/components/landing/faq";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const navLinks = [
  { label: "Tính năng", href: "#features" },
  { label: "Lộ trình học", href: "#" },
  { label: "Nhóm học tập", href: "#groups" },
  { label: "Trợ lý AI", href: "#" },
];

const stats = [
  { value: "1.200+", label: "học viên đang học" },
  { value: "300+", label: "bài tập & thử thách" },
  { value: "2", label: "lộ trình học có cấu trúc" },
  { value: "24/7", label: "AI đồng hành" },
];

const features = [
  {
    icon: Lightbulb,
    tint: "bg-ai-tint text-ai",
    title: "Gợi ý AI theo 3 mức",
    desc: "Hướng tiếp cận → khung code → giải thích lỗi. AI dẫn dắt tư duy, không đưa đáp án hoàn chỉnh.",
  },
  {
    icon: Terminal,
    tint: "bg-primary-tint text-primary",
    title: "Chấm bài tự động",
    desc: "Biên dịch và chạy trong sandbox với test Public, Hidden và Custom — kết quả trong vài giây.",
  },
  {
    icon: Users,
    tint: "bg-accent-tint text-accent",
    title: "Nhóm học tập",
    desc: "Tạo nhóm học tập, chia sẻ tài liệu và để AI soạn bài luyện tập từ chính tài liệu của nhóm.",
  },
  {
    icon: BarChart3,
    tint: "bg-success-tint text-success",
    title: "Tiến độ minh bạch",
    desc: "Heatmap hoạt động, chủ đề vững / còn yếu và bảng xếp hạng XP trong từng nhóm.",
  },
];

const steps = [
  {
    n: "01",
    bg: "bg-navy",
    title: "Đăng ký bằng email trường",
    desc: "Dùng email trường hoặc Google để tạo tài khoản trong 30 giây.",
  },
  {
    n: "02",
    bg: "bg-primary",
    title: "Chọn lộ trình hoặc tham gia nhóm học",
    desc: "Chọn lộ trình theo mục tiêu của bạn, hoặc nhập mã mời để tham gia nhóm học tập.",
  },
  {
    n: "03",
    bg: "bg-accent",
    title: "Luyện tập cùng AI",
    desc: "Viết code, chạy kiểm thử và nhận gợi ý theo mức mỗi khi bế tắc.",
  },
];

const workspaceChecklist = [
  "Chạy kiểm thử Public, Hidden và Custom",
  "Phân tích lỗi và độ phức tạp sau mỗi lần chạy",
  "Thảo luận với người hướng dẫn ngay dưới đề bài",
];

const groupChecklist = [
  "Soạn bài tập, quiz và flashcard từ tài liệu môn học",
  "Mời thành viên bằng mã hoặc liên kết",
  "Bảng xếp hạng XP và tiến độ từng thành viên",
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 flex h-16 items-center gap-6 border-b border-border bg-surface px-6 sm:px-10">
        <Link href="/" className="shrink-0">
          <Image src="/logo.png" alt="CodeMentor" width={460} height={159} className="h-9 w-auto" priority />
        </Link>
        <nav className="hidden gap-6 md:flex">
          {navLinks.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="text-sm font-medium text-text hover:text-primary"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex-1" />
        <Link href="/login" className="text-sm font-semibold text-navy">
          Đăng nhập
        </Link>
        <Button href="/signup">Đăng ký miễn phí</Button>
      </header>

      <section className="bg-navy px-6 py-12 text-white sm:px-10 lg:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="mb-5 inline-flex rounded-md border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-primary">
              AI Agent đồng hành, không làm thay
            </span>
            <h1 className="mb-4 text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
              Học tốt hơn,
              <br />
              lập trình tự tin hơn
            </h1>
            <p className="mb-6 max-w-lg text-base leading-relaxed text-zinc-300">
              Nền tảng tự học và luyện tập lập trình cho tất cả mọi người — lộ
              trình theo mục tiêu, chấm bài tự động trong sandbox, gợi ý AI
              theo 3 mức và không gian học nhóm.
            </p>
            <div className="mb-8 flex flex-wrap gap-3">
              <Button href="/signup">
                Bắt đầu miễn phí <ArrowRight className="h-4 w-4" />
              </Button>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-md border border-white/25 px-4 py-2.5 text-sm font-semibold hover:bg-white/10"
              >
                Tôi đã có tài khoản
              </Link>
            </div>
            <div className="flex flex-wrap gap-8">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-primary">{s.value}</div>
                  <div className="text-xs text-zinc-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-xl bg-zinc-900 shadow-modal">
              <div className="flex items-center gap-1.5 border-b border-zinc-800 px-3.5 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="ml-2 font-mono text-xs text-zinc-500">
                  phuong_trinh_bac_hai.c
                </span>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">
                  <Check className="h-3 w-3" /> 3/3 kiểm thử
                </span>
              </div>
              <pre className="overflow-x-auto px-4 py-4 font-mono text-xs leading-loose text-zinc-200 sm:text-sm">
{`double delta = b*b - 4*a*c;
if (delta > 0) {
  x1 = (-b + sqrt(delta)) / (2*a);
  x2 = (-b - sqrt(delta)) / (2*a);
} else if (delta == 0) {
  // nghiệm kép x = -b/(2a)
} else {
  printf("Vô nghiệm thực");
}`}
              </pre>
            </div>
            <div className="mt-[-1.5rem] ml-10 max-w-xs rounded-xl border border-ai bg-surface p-3.5 shadow-modal">
              <div className="mb-1.5 text-[10px] font-bold tracking-wide text-ai uppercase">
                Gợi ý Mức 1 — Hướng tiếp cận
              </div>
              <div className="text-xs leading-relaxed text-text">
                Xét dấu của delta trước khi tính căn bậc hai — có ba trường
                hợp cần xử lý riêng.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-12 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-8 max-w-xl text-center">
            <div className="mb-3 text-xs font-bold tracking-widest text-primary uppercase">
              Tính năng chính
            </div>
            <h2 className="mb-3 text-3xl font-bold text-navy">
              Mọi thứ bạn cần để tự học lập trình
            </h2>
            <p className="text-sm leading-relaxed text-text-muted">
              Học theo lộ trình cá nhân hóa, luyện tập mỗi ngày và tiến bộ
              thật sự.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card key={f.title} className="p-5">
                <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-md ${f.tint}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="mb-1.5 text-base font-semibold text-navy">{f.title}</div>
                <div className="text-sm leading-relaxed text-text-muted">{f.desc}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-bg px-6 py-12 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 text-center">
            <div className="mb-3 text-xs font-bold tracking-widest text-primary uppercase">
              Cách hoạt động
            </div>
            <h2 className="text-3xl font-bold text-navy">Bắt đầu trong 3 bước</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {steps.map((s) => (
              <Card key={s.n} className="p-5">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full font-mono text-sm font-bold text-white ${s.bg}`}>
                  {s.n}
                </div>
                <div className="mb-1.5 text-base font-semibold text-navy">{s.title}</div>
                <div className="text-sm leading-relaxed text-text-muted">{s.desc}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-12 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-10">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <div className="mb-3 text-xs font-bold tracking-widest text-primary uppercase">
                Không gian làm việc
              </div>
              <h3 className="mb-3 text-2xl font-bold text-navy">
                Đề bài, IDE và gợi ý — trong cùng một màn hình
              </h3>
              <p className="mb-5 text-sm leading-relaxed text-text-muted">
                Đọc đề, viết code, chạy kiểm thử và nhận gợi ý theo mức mà
                không phải chuyển cửa sổ.
              </p>
              <ul className="flex flex-col gap-2.5">
                {workspaceChecklist.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-text">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Card className="p-3">
              <div className="rounded-md bg-navy p-4 font-mono text-xs leading-loose text-zinc-300">
                <div className="text-blue-300">if (delta &gt; 0) {"{"}</div>
                <div className="pl-4 text-zinc-400">x1 = (-b + sqrt(delta)) / (2*a);</div>
                <div className="text-blue-300">{"}"}</div>
              </div>
            </Card>
          </div>

          <div id="groups" className="grid items-center gap-8 lg:grid-cols-2">
            <Card className="order-2 p-5 lg:order-1">
              <div className="flex flex-col gap-3">
                {["Nhóm Nhập môn Lập trình", "Ôn tập Cấu trúc Dữ liệu"].map((g) => (
                  <div
                    key={g}
                    className="flex items-center gap-3 rounded-md border border-border-soft bg-bg p-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-navy font-mono text-xs font-bold text-white">
                      {g[0]}
                    </span>
                    <span className="text-sm font-medium text-navy">{g}</span>
                  </div>
                ))}
              </div>
            </Card>
            <div className="order-1 lg:order-2">
              <div className="mb-3 text-xs font-bold tracking-widest text-primary uppercase">
                Nhóm học tập
              </div>
              <h3 className="mb-3 text-2xl font-bold text-navy">
                Cả nhóm luyện chung một bộ đề
              </h3>
              <p className="mb-5 text-sm leading-relaxed text-text-muted">
                Chủ nhóm tải tài liệu lên và hệ thống soạn bài luyện tập cho
                cả nhóm. Ai học tới đâu, mạnh yếu chỗ nào — nhìn là thấy.
              </p>
              <ul className="flex flex-col gap-2.5">
                {groupChecklist.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-text">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-bg px-6 py-12 sm:px-10">
        <div className="mb-8 text-center">
          <div className="mb-3 text-xs font-bold tracking-widest text-primary uppercase">
            Sinh viên nói gì
          </div>
          <h2 className="text-3xl font-bold text-navy">
            Được tin dùng bởi cộng đồng lập trình
          </h2>
        </div>
        <Testimonials />
      </section>

      <section className="px-6 py-12 sm:px-10">
        <div className="mb-8 text-center">
          <div className="mb-3 text-xs font-bold tracking-widest text-primary uppercase">
            Câu hỏi thường gặp
          </div>
          <h2 className="text-3xl font-bold text-navy">Giải đáp trước khi bắt đầu</h2>
        </div>
        <Faq />
      </section>

      <section className="bg-navy px-6 py-12 text-center text-white sm:px-10">
        <h2 className="mb-3 text-3xl font-bold">Sẵn sàng rèn kỹ năng lập trình?</h2>
        <p className="mb-5 text-sm text-zinc-300">
          Đăng ký bằng email và bắt đầu bài luyện tập đầu tiên ngay hôm nay.
        </p>
        <Button href="/signup">
          Tạo tài khoản miễn phí <ArrowRight className="h-4 w-4" />
        </Button>
      </section>

      <footer className="flex flex-col items-center justify-between gap-4 border-t border-border px-6 py-6 text-xs text-text-faint sm:flex-row sm:px-10">
        <span>© 2026 CodeMentor</span>
        <div className="flex gap-5">
          <Link href="#" className="hover:text-navy">
            Giới thiệu
          </Link>
          <Link href="#" className="hover:text-navy">
            Hỗ trợ
          </Link>
        </div>
      </footer>
    </div>
  );
}
