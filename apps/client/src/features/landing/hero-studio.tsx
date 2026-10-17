import type { CSSProperties, ReactNode } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

// Mỗi dòng: [thụt lề, các đoạn]. Từ khóa tô màu thương hiệu, phần còn lại màu chữ trên nền tối.
const CODE: [number, ReactNode][] = [
  [0, <><K>double</K> d = b*b - 4*a*c;</>],
  [0, <><K>if</K> (d {"<"} 0) {"{"}</>],
  [1, <>cout {"<<"} &quot;NO&quot;;</>],
  [0, <>{"}"} <K>else</K> {"{"}</>],
  [1, <><K>double</K> x = (-b + sqrt(d)) / (2*a);</>],
  [1, <>cout {"<<"} x;</>],
  [0, <>{"}"}</>],
];
const TESTS = ["a=1, b=-3, c=2", "Delta âm", "Nghiệm kép"];
const LINE = 0.35;
const TESTS_AT = CODE.length * LINE + 0.4;

function K({ children }: { children: ReactNode }) {
  return <span className="text-primary-fixed">{children}</span>;
}

const at = (seconds: number): CSSProperties => ({ animationDelay: `${seconds}s` });

/**
 * Màn hình làm bài thu nhỏ, chuyển động bằng CSS thuần nên vẫn là server component. Trạng
 * thái cuối là trạng thái mặc định: không có JS hay bật giảm chuyển động thì vẫn đủ nội dung.
 */
export function HeroStudio() {
  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex h-11 items-center gap-3 border-b border-border bg-bg px-4 text-sm">
        <span className="font-semibold text-navy">Giải phương trình bậc hai</span>
        <span className="ml-auto rounded-md bg-border-soft px-2 py-0.5 font-medium text-text-muted">C++</span>
      </div>
      <pre className="overflow-x-auto bg-ink-fixed px-4 py-4 font-mono text-xs sm:px-5 sm:text-sm leading-7 text-on-ink-fixed" aria-label="Lời giải mẫu bằng C++">
        {CODE.map(([indent, line], index) => (
          <span
            key={index}
            className="block w-fit motion-safe:[animation:hero-type_0.3s_steps(24)_backwards]"
            style={{ ...at(0.3 + index * LINE), paddingLeft: `${indent * 2}ch` }}
          >
            {line}
          </span>
        ))}
      </pre>
      <div className="grid gap-2 p-4">
        <p className="text-sm font-medium text-text-muted">Kết quả chạy test</p>
        <ul className="grid gap-1.5">
          {TESTS.map((name, index) => (
            <li key={name} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
              <span className="text-navy">Test {index + 1} · {name}</span>
              {/* Hai nhãn chồng lên nhau: "Đang chạy" tắt dần, "Đạt" hiện lên đúng lúc đó. */}
              <span className="grid shrink-0 font-semibold">
                <span
                  className="col-start-1 row-start-1 inline-flex items-center gap-1.5 text-text-muted opacity-0 motion-safe:[animation:hero-hide_0.2s_backwards]"
                  style={at(TESTS_AT + index * 0.5)}
                  aria-hidden
                >
                  <Loader2 className="size-4 motion-safe:animate-spin" /> Đang chạy
                </span>
                <span
                  className="col-start-1 row-start-1 inline-flex items-center gap-1.5 text-success motion-safe:[animation:hero-show_0.25s_backwards]"
                  style={at(TESTS_AT + index * 0.5)}
                >
                  <CheckCircle2 className="size-4" aria-hidden /> Đạt
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p
          className="mt-1 flex items-start gap-3 rounded-lg border border-border bg-bg p-3 text-sm leading-6 text-text motion-safe:[animation:hero-show_0.3s_backwards]"
          style={at(TESTS_AT + TESTS.length * 0.5 + 0.3)}
        >
          <span className="mascot-sprite size-9 shrink-0" aria-hidden />
          <span><b className="text-navy">Codey:</b> Đạt hết rồi! Thử thêm trường hợp a = 0 xem chương trình có chia cho 0 không nhé.</span>
        </p>
      </div>
      <figcaption className="border-t border-border px-4 py-2.5 text-sm text-text-faint">Minh họa màn hình làm bài</figcaption>
    </figure>
  );
}
