import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Bot,
  CheckCircle2,
  Code2,
  Flame,
  GraduationCap,
  Lightbulb,
  MessageSquareText,
  Play,
  Search,
  Sparkles,
  Target,
  Trophy,
  UsersRound,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

const audiences = [
  {
    icon: Code2,
    title: "Người học lập trình",
    description: "Xây năng lực bằng lộ trình có cấu trúc, bài luyện tập sát thực tế và hồ sơ kỹ năng có thể chứng minh.",
    features: ["IDE và chấm bài trực tuyến", "Ngân hàng bài theo kỹ năng", "XP, chuỗi học và thành tích"],
  },
  {
    icon: UsersRound,
    title: "Nhóm học tập",
    description: "Cùng học trên một không gian chung, giao bài, thảo luận hướng giải và theo dõi sự tiến bộ của từng thành viên.",
    features: ["Tài liệu và bài tập dùng chung", "Bảng xếp hạng theo XP", "Theo dõi bài nộp của nhóm"],
  },
  {
    icon: GraduationCap,
    title: "Mentor & tổ chức",
    description: "Tạo nội dung, đánh giá kỹ năng thực hành và xây cộng đồng học tập dựa trên dữ liệu thật.",
    features: ["Tạo bộ đề và lộ trình riêng", "Phân quyền quản lý nhóm", "Dữ liệu tiến độ minh bạch"],
  },
];

const highlights = [
  { type: "Bộ luyện tập", title: "Top 100 câu hỏi phỏng vấn Backend", description: "API, SQL, Java và các tình huống hệ thống thường gặp.", meta: "100 bài · 4 cấp độ", icon: Trophy, href: "/practice" },
  { type: "Lộ trình mới", title: "Backend Java từ nền tảng đến dự án", description: "Java Core, Spring Boot, database và dự án cuối lộ trình.", meta: "7 khóa học · 42 giờ", icon: BookOpen, href: "/paths/backend-java" },
  { type: "Cộng đồng", title: "Thảo luận hướng giải ngay trong IDE", description: "Hỏi đáp, vote và chia sẻ test case mà không rời màn hình code.", meta: "1.280 thảo luận", icon: MessageSquareText, href: "/solve/giai-phuong-trinh-bac-hai" },
  { type: "AI học tập", title: "Codey đồng hành theo trạng thái làm bài", description: "Gợi ý ngắn khi bế tắc và phản hồi theo kết quả test case.", meta: "Hỗ trợ 24/7", icon: Bot, href: "/ai-tutor" },
];

const learningSteps = [
  { number: "01", icon: Target, title: "Chọn mục tiêu", description: "Cá nhân hóa lĩnh vực, trình độ và thời gian học mỗi tuần." },
  { number: "02", icon: BookOpen, title: "Theo lộ trình", description: "Học theo chương, bài học và cột mốc được sắp xếp rõ ràng." },
  { number: "03", icon: Code2, title: "Luyện tập thật", description: "Viết code, chạy test và trao đổi hướng giải cùng cộng đồng." },
  { number: "04", icon: BarChart3, title: "Chứng minh tiến bộ", description: "Tích lũy XP, duy trì chuỗi học và hoàn thiện hồ sơ kỹ năng." },
];

const stories = [
  { initials: "TN", name: "Trung Nguyên", role: "Backend Developer", quote: "Lộ trình Java giúp mình biết chính xác nên học gì tiếp theo, còn workspace khiến việc luyện bài liền mạch hơn hẳn.", result: "+1.890 XP trong 8 tuần" },
  { initials: "HY", name: "Hải Yến", role: "Sinh viên năm 3", quote: "Mình thích nhất phần thảo luận trong bài. Có thể đọc nhiều góc tiếp cận mà không bị lộ đáp án hoàn chỉnh.", result: "Chuỗi học 21 ngày" },
  { initials: "MK", name: "Minh Khoa", role: "Mentor nhóm Java", quote: "Bảng theo dõi bài nộp và tiến độ giúp mình biết thành viên nào đang cần hỗ trợ trước mỗi buổi học.", result: "Quản lý 36 thành viên" },
];

const activity = [0, 1, 2, 0, 3, 2, 1, 0, 2, 4, 3, 1, 0, 1, 3, 4, 2, 1, 0, 2, 3, 1, 4, 2, 0, 1, 2, 3, 4, 3, 1, 0, 2, 4, 2, 3, 1, 0, 1, 3, 4, 2];

export default function LandingPage() {
  return <div className="min-h-full bg-white text-zinc-900">
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5 sm:px-8">
        <Link href="/" className="shrink-0"><BrandLogo size="sm" priority /></Link>
        <nav className="hidden items-center gap-5 lg:flex">
          {[["Khám phá", "/explore"], ["Luyện tập", "/practice"], ["Lộ trình", "/paths"], ["Nhóm học", "/workspace"]].map(([label, href]) => <Link key={label} href={href} className="text-xs font-medium text-zinc-600 hover:text-zinc-950">{label}</Link>)}
        </nav>
        <div className="flex-1" />
        <label className="hidden h-9 w-56 items-center gap-2 rounded-full border border-zinc-300 px-3 xl:flex"><Search className="h-3.5 w-3.5 text-zinc-400" /><span className="text-xs text-zinc-400">Tìm bài tập, lộ trình...</span></label>
        <Link href="/login" className="text-xs font-semibold text-zinc-700 hover:text-zinc-950">Đăng nhập</Link>
        <Button href="/signup" size="sm">Đăng ký</Button>
      </div>
    </header>

    <main>
      <section className="relative overflow-hidden px-5 py-16 sm:px-8 lg:py-22">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-72 rounded-full bg-orange-100/50 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_0.92fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] text-primary uppercase"><Sparkles className="h-4 w-4" /> Nền tảng chứng minh năng lực</div>
            <h1 className="max-w-2xl text-4xl leading-[1.08] font-extrabold tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">Nơi kỹ năng lập trình được rèn luyện và ghi nhận.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-zinc-600">Học theo lộ trình, giải bài trong workspace chuyên nghiệp, thảo luận cùng cộng đồng và xây hồ sơ năng lực dựa trên kết quả thật.</p>
            <div className="mt-7 flex flex-wrap gap-3"><Button href="/signup">Bắt đầu miễn phí <ArrowRight className="h-4 w-4" /></Button><Button href="/practice" variant="outline">Xem bài luyện tập</Button></div>
            <div className="mt-9 flex flex-wrap gap-x-8 gap-y-3 border-t border-zinc-200 pt-6">
              {[["1.200+", "người học"], ["300+", "bài luyện tập"], ["24/7", "AI đồng hành"]].map(([value, label]) => <div key={label}><b className="text-lg text-zinc-950">{value}</b><span className="ml-2 text-xs text-zinc-500">{label}</span></div>)}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute inset-x-10 bottom-5 h-10 rounded-full bg-zinc-100 blur-xl" />
            <Image src="/anh10.PNG" alt="Người học chinh phục hành trình lập trình" width={626} height={441} className="relative h-auto w-full object-contain" priority />
            <div className="absolute right-0 bottom-3 rounded-xl border border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:right-4"><div className="flex items-center gap-2"><Flame className="h-4 w-4 text-primary" /><div><b className="block text-xs">Chuỗi học 12 ngày</b><span className="text-[10px] text-zinc-500">Tiếp tục giữ nhịp nhé!</span></div></div></div>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white px-5 py-6 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[{ icon: Zap, value: "48.000+", label: "lượt chạy code" }, { icon: CheckCircle2, value: "72%", label: "bài được hoàn thành" }, { icon: MessageSquareText, value: "6.400+", label: "lượt trao đổi" }, { icon: Trophy, value: "2,8 triệu", label: "XP đã tích lũy" }].map((stat) => <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 px-4 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50"><stat.icon className="h-4.5 w-4.5 text-primary" /></span><div><b className="block text-lg text-zinc-950">{stat.value}</b><span className="text-xs text-zinc-500">{stat.label}</span></div></div>)}
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl"><p className="text-xs font-bold tracking-[0.15em] text-primary uppercase">Hành trình rõ ràng</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">Từ mục tiêu học tập đến năng lực có thể <br />chứng minh</h2><p className="mt-3 text-sm leading-6 text-zinc-600">Mọi hoạt động trong hệ thống đều nối tiếp nhau, giúp bạn luôn biết mình đang ở đâu và bước tiếp theo là gì.</p></div>
          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {learningSteps.map((step, index) => <article key={step.number} className="relative rounded-xl border border-zinc-200 p-5 transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"><span className="absolute top-4 right-4 font-mono text-xs text-zinc-300">{step.number}</span><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-primary"><step.icon className="h-5 w-5" /></span><h3 className="mt-5 text-sm font-bold text-zinc-950">{step.title}</h3><p className="mt-2 text-xs leading-5 text-zinc-500">{step.description}</p>{index < learningSteps.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 rounded-full bg-white text-zinc-300 lg:block" />}</article>)}
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-zinc-50 px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8"><p className="text-xs font-bold tracking-[0.15em] text-primary uppercase">Ai đang ở CodeMentor?</p><h2 className="mt-2 text-2xl font-bold text-zinc-950">Một không gian chung cho người học và người hướng dẫn</h2></div>
          <div className="grid gap-8 lg:grid-cols-3">
            {audiences.map((audience) => <article key={audience.title} className="grid grid-cols-[1fr_auto] gap-5"><div><audience.icon className="mb-4 h-7 w-7 text-primary" /><h3 className="text-lg font-bold text-zinc-950">{audience.title}</h3><p className="mt-2 text-sm leading-6 text-zinc-600">{audience.description}</p><p className="mt-5 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Tính năng chính</p><ul className="mt-3 space-y-2">{audience.features.map((feature) => <li key={feature} className="flex items-center gap-2 text-xs text-zinc-700"><CheckCircle2 className="h-3.5 w-3.5 text-primary" />{feature}</li>)}</ul></div><div className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm"><audience.icon className="h-7 w-7 text-zinc-900" /></div></article>)}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-[0.15em] text-primary uppercase">Mới & đáng chú ý</p><h2 className="mt-2 text-2xl font-bold text-zinc-950">Bắt đầu từ điều phù hợp với bạn</h2><p className="mt-1 text-sm text-zinc-500">Lộ trình, bài luyện tập và hoạt động nổi bật trên hệ thống.</p></div><Link href="/explore" className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-primary">Xem toàn bộ <ArrowRight className="h-3.5 w-3.5" /></Link></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{highlights.map((item) => <Link key={item.title} href={item.href} className="group rounded-xl border border-zinc-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-sm"><div className="flex items-start justify-between gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-primary"><item.icon className="h-4.5 w-4.5" /></span><ArrowRight className="h-4 w-4 text-zinc-300 transition group-hover:text-primary" /></div><p className="mt-5 text-[10px] font-bold tracking-wider text-primary uppercase">{item.type}</p><h3 className="mt-1.5 text-sm font-bold leading-5 text-zinc-950">{item.title}</h3><p className="mt-2 text-xs leading-5 text-zinc-500">{item.description}</p><p className="mt-4 border-t border-zinc-100 pt-3 text-[11px] font-medium text-zinc-400">{item.meta}</p></Link>)}</div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-zinc-50 px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.78fr_1.22fr]">
          <div><p className="text-xs font-bold tracking-[0.15em] text-primary uppercase">Workspace luyện tập</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">Đề bài, code, test và cộng đồng trong cùng một màn hình.</h2><p className="mt-4 text-sm leading-6 text-zinc-600">Một trải nghiệm giống công cụ làm việc thật: quản lý file, viết code với Monaco, chạy test và thảo luận mà không rời phiên làm bài.</p><ul className="mt-5 space-y-2">{["Editor nhiều ngôn ngữ và tự động lưu", "Public test, hidden test và kết quả chi tiết", "Thảo luận hướng giải theo từng bài"].map((item) => <li key={item} className="flex items-center gap-2 text-xs text-zinc-700"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />{item}</li>)}</ul><Button href="/solve/giai-phuong-trinh-bac-hai" variant="outline" className="mt-6">Thử workspace <Play className="h-3.5 w-3.5" /></Button></div>
          <div className="overflow-hidden rounded-xl border border-zinc-300 bg-white shadow-lg"><div className="flex h-10 items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-3"><span className="h-2.5 w-2.5 rounded-full bg-zinc-300" /><span className="h-2.5 w-2.5 rounded-full bg-zinc-300" /><span className="h-2.5 w-2.5 rounded-full bg-primary" /><span className="ml-2 font-mono text-[10px] text-zinc-500">solution.cpp</span><span className="ml-auto rounded bg-zinc-200 px-2 py-1 text-[9px] font-semibold text-zinc-600">C++</span></div><div className="grid min-h-72 grid-cols-[0.8fr_1.2fr]"><div className="border-r border-zinc-200 p-4"><div className="text-xs font-bold text-zinc-950">Giải phương trình bậc hai</div><div className="mt-3 space-y-2 text-[10px] leading-5 text-zinc-500"><p>Cho ba hệ số a, b, c.</p><p>Tính delta và in nghiệm thực.</p><span className="inline-flex rounded bg-orange-50 px-2 py-1 font-semibold text-primary">+25 XP</span></div><div className="mt-6 rounded-lg border border-zinc-200 p-3"><p className="font-mono text-[9px] text-zinc-400">TEST RESULT</p><p className="mt-2 text-xs font-semibold text-emerald-700">✓ 3/3 test case đạt</p></div></div><pre className="overflow-hidden bg-zinc-950 p-4 font-mono text-[10px] leading-5 text-zinc-300"><span className="text-orange-300">double</span>{` delta = b*b - 4*a*c;\n`}<span className="text-orange-300">if</span>{` (delta > 0) {\n  // two roots\n}\n`}</pre></div></div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <div className="relative overflow-hidden rounded-2xl border border-orange-200 bg-orange-50/40 p-6 shadow-sm">
            <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-orange-200/40 blur-3xl" />
            <div className="relative flex items-start gap-4"><span className="mascot-sprite mascot-sprite-idle h-24 w-24 shrink-0" /><div><span className="inline-flex rounded-full border border-orange-200 bg-white px-2 py-1 text-[9px] font-bold tracking-wide text-primary uppercase">Codey · phản hồi nhanh</span><h3 className="mt-3 text-xl font-bold text-zinc-950">Một người bạn nhỏ trong lúc code</h3><p className="mt-2 text-xs leading-5 text-zinc-600">Codey đọc trạng thái chạy bài, nhắc test case biên và đưa gợi ý ngắn ngay trong popup để bạn không mất tập trung.</p></div></div>
            <div className="relative mt-5 ml-16 rounded-xl border border-orange-200 bg-white p-3 text-xs leading-5 text-zinc-700"><Lightbulb className="mr-2 inline h-3.5 w-3.5 text-primary" />Thử tách ba trường hợp theo dấu của delta trước nhé.</div>
          </div>
          <div><p className="text-xs font-bold tracking-[0.15em] text-ai uppercase">Hai cấp độ hỗ trợ</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">Hỏi nhanh Codey, phân tích sâu với Trợ lý AI</h2><p className="mt-4 text-sm leading-6 text-zinc-600">Hai công cụ có nhiệm vụ riêng để bạn chọn đúng mức hỗ trợ, từ một lời nhắc nhỏ đến phân tích toàn bộ chiến lược giải.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4"><Bot className="h-5 w-5 text-primary" /><b className="mt-3 block text-sm">Codey</b><p className="mt-1 text-xs leading-5 text-zinc-600">Gợi ý nhanh, đọc trạng thái test và giữ bạn trong luồng làm bài.</p></div><div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4"><Sparkles className="h-5 w-5 text-ai" /><b className="mt-3 block text-sm">Trợ lý AI</b><p className="mt-1 text-xs leading-5 text-zinc-600">Phân tích code, độ phức tạp và phương án cải thiện chuyên sâu.</p></div></div></div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-zinc-50 px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div><p className="text-xs font-bold tracking-[0.15em] text-primary uppercase">Tiến bộ nhìn thấy được</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">Mỗi ngày học đều góp vào hồ sơ của bạn</h2><p className="mt-3 text-sm leading-6 text-zinc-600">XP, chuỗi hoạt động, kỹ năng và bài đã giải được tổng hợp thành một bức tranh năng lực rõ ràng.</p><div className="mt-6 grid grid-cols-3 gap-3">{[["2.450", "Tổng XP"], ["47", "Bài đã giải"], ["12 ngày", "Chuỗi dài nhất"]].map(([value, label]) => <div key={label} className="rounded-xl border border-zinc-200 bg-white p-4"><b className="block text-lg text-zinc-950">{value}</b><span className="mt-1 block text-[10px] text-zinc-500">{label}</span></div>)}</div></div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><b className="text-sm">Hoạt động 6 tuần gần nhất</b><p className="mt-1 text-[10px] text-zinc-500">36 bài nộp · 9 ngày hoạt động</p></div><span className="flex items-center gap-1 text-xs font-semibold text-primary"><Flame className="h-4 w-4" /> 5 ngày</span></div><div className="mt-5 grid grid-flow-col grid-rows-6 gap-1.5">{activity.map((level, index) => <span key={index} className={`aspect-square min-h-3 rounded-sm ${level === 0 ? "bg-zinc-100" : level === 1 ? "bg-orange-100" : level === 2 ? "bg-orange-200" : level === 3 ? "bg-orange-400" : "bg-orange-600"}`} />)}</div><div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4 text-[10px] text-zinc-500"><span>Kỹ năng nổi bật</span><span className="font-semibold text-zinc-800">Java · SQL · API Design</span></div></div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl"><div className="text-center"><p className="text-xs font-bold tracking-[0.15em] text-primary uppercase">Câu chuyện người học</p><h2 className="mt-2 text-3xl font-bold text-zinc-950">Tiến bộ tốt hơn khi không học một mình</h2></div><div className="mt-9 grid gap-4 lg:grid-cols-3">{stories.map((story) => <article key={story.name} className="rounded-xl border border-zinc-200 p-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-xs font-bold text-primary">{story.initials}</span><div><b className="block text-sm">{story.name}</b><span className="text-[10px] text-zinc-500">{story.role}</span></div></div><p className="mt-5 text-sm leading-6 text-zinc-600">“{story.quote}”</p><p className="mt-5 border-t border-zinc-100 pt-4 text-xs font-semibold text-primary">{story.result}</p></article>)}</div></div>
      </section>

      <section className="px-5 pb-16 sm:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-orange-200 bg-orange-50/50 px-6 py-10 text-center sm:px-10"><Award className="mx-auto h-8 w-8 text-primary" /><h2 className="mt-4 text-3xl font-bold text-zinc-950">Sẵn sàng chinh phục cột mốc tiếp theo?</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-600">Tạo hồ sơ miễn phí, chọn mục tiêu và bắt đầu tích lũy XP từ bài luyện tập đầu tiên.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Button href="/signup">Tạo tài khoản miễn phí <ArrowRight className="h-4 w-4" /></Button><Button href="/paths" variant="outline">Xem lộ trình học</Button></div></div>
      </section>
    </main>

    <footer className="border-t border-zinc-200 px-5 py-7 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-zinc-500 sm:flex-row"><BrandLogo size="sm" /><span>© 2026 CodeMentor · Học, luyện tập và chứng minh năng lực.</span><div className="flex gap-4"><Link href="/practice" className="hover:text-zinc-950">Luyện tập</Link><Link href="/login" className="hover:text-zinc-950">Đăng nhập</Link></div></div></footer>
  </div>;
}
