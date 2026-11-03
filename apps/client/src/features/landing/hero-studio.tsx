const CODE = [
  "def search_insert(nums, target):",
  "    lo, hi = 0, len(nums)",
  "    while lo < hi:",
  "        mid = (lo + hi) // 2",
  "        if nums[mid] < target: lo = mid + 1",
  "        else: hi = mid",
  "    return lo",
];
const TESTS = [
  { input: "[1,3,5,6], 5", passed: true },
  { input: "[1,3,5,6], 7", passed: true },
  { input: "[], 3", passed: false },
];

/**
 * Màn hình làm bài thu nhỏ, đứng yên: một test sai để thấy Codey gợi ý gì. Đề là bài có thật
 * trong ngân hàng ("Vị trí chèn trong mảng đã sắp xếp").
 */
export function HeroStudio() {
  const passed = TESTS.filter((test) => test.passed).length;
  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="flex h-12 items-center gap-2 border-b border-border px-4">
        <span className="truncate text-sm font-semibold text-navy">Vị trí chèn trong mảng đã sắp xếp</span>
        <span className="shrink-0 rounded-sm bg-primary px-2 py-0.5 text-2xs font-bold text-on-ink">Trung bình</span>
        <span className="ml-auto font-mono text-xs text-text-muted">Python</span>
      </div>
      <pre className="overflow-x-auto bg-ink-fixed px-5 py-4 font-mono text-xs leading-7 text-on-ink-fixed sm:text-sm" aria-label="Lời giải bằng Python">
        {CODE.map((line, index) => (
          <span key={index} className="block whitespace-pre">
            <span className="mr-4 inline-block w-3 text-right text-text-faint select-none">{index + 1}</span>
            {line}
          </span>
        ))}
      </pre>
      <div className="flex items-center border-b border-border-soft px-4 py-3 text-xs">
        <span className="font-semibold text-navy">Kết quả chạy test</span>
        <span className="ml-auto text-text-muted">{passed}/{TESTS.length} đạt</span>
      </div>
      <ul className="divide-y divide-border-soft text-sm">
        {TESTS.map((test) => (
          <li key={test.input} className="flex items-center gap-2 px-4 py-2.5">
            <span className="font-mono text-text">{test.input}</span>
            <span className={`ml-auto rounded-sm px-2 py-0.5 text-2xs font-bold ${test.passed ? "bg-border-soft text-navy" : "bg-primary-tint text-primary-active"}`}>
              {test.passed ? "Đạt" : "Sai kết quả"}
            </span>
          </li>
        ))}
      </ul>
      <figcaption className="flex items-start gap-3 border-t border-border-soft bg-bg px-4 py-3 text-sm leading-6 text-text">
        <span className="mascot-sprite size-8 shrink-0" aria-hidden />
        <span><b className="text-navy">Codey:</b> Mảng rỗng thì vòng lặp có chạy không? Thử in giá trị trả về cho test 3.</span>
      </figcaption>
    </figure>
  );
}
