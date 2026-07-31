import { Card } from "@/components/ui/card";
import { samplePaths } from "@/data/sample-courses";

const stats = [
  { label: "Tổng XP", value: "2.450", sub: "Hạng #3 trong nhóm" },
  { label: "Chuỗi ngày", value: "5", sub: "Kỷ lục: 12 ngày" },
  { label: "Tỷ lệ hoàn thành", value: "68%", sub: "47/69 bài đã thử" },
  { label: "Điểm trung bình", value: "8.4", sub: "Trên các bài đã nộp" },
];

const solved = 47;
const totalProblems = 69;
const solvedPct = Math.round((solved / totalProblems) * 100);

const trend = [20, 35, 25, 55, 40, 65, 50, 70];

const heatColors = ["var(--color-border-soft)", "#FED7AA", "#FDBA74", "#F97316", "#C2410C"];
const heatmapCells = Array.from({ length: 91 }).map((_, i) => {
  const v = Math.abs(Math.sin(i * 12.9898));
  const level = v > 0.85 ? 4 : v > 0.65 ? 3 : v > 0.45 ? 2 : v > 0.25 ? 1 : 0;
  return heatColors[level];
});

const technologies = ["C", "C++", "Python"];

const coursesInProgress = samplePaths.filter((p) => typeof p.progress === "number");

export default function ProfilePage() {
  return (
    <div>
      <div className="mb-5 flex items-center gap-4 rounded-lg bg-navy p-6 text-white">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold">
          GS
        </div>
        <div className="min-w-0">
          <div className="mb-1 text-lg font-bold">Nguyễn Trần Gia Sĩ</div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-zinc-300">
            <span className="rounded-md bg-white/15 px-2.5 py-1 font-semibold text-white">Học viên</span>
            <span>Hạng #3 trong nhóm</span>
            <span>· Hoạt động: Hôm nay</span>
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((w) => (
          <Card key={w.label} className="p-4">
            <div className="mb-2 text-xs font-medium text-text-muted">{w.label}</div>
            <div className="mb-1 text-xl font-bold text-navy">{w.value}</div>
            <div className="text-xs text-text-faint">{w.sub}</div>
          </Card>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-4 lg:flex-row">
        <Card className="flex-1 p-5">
          <div className="mb-3.5 text-sm font-bold text-navy">Thống kê bài làm</div>
          <div className="flex items-center gap-4">
            <div
              className="flex h-18 w-18 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(var(--color-navy) ${solvedPct}%, var(--color-border-soft) 0)`,
              }}
            >
              <div className="flex h-13 w-13 flex-col items-center justify-center rounded-full bg-surface">
                <span className="text-sm font-bold text-navy">{solved}</span>
                <span className="text-[10px] text-text-faint">/{totalProblems}</span>
              </div>
            </div>
            <div className="flex-1 text-xs text-text">
              <div className="mb-1.5 flex justify-between">
                <span>Đã giải</span>
                <b className="text-navy">{solved}</b>
              </div>
              <div className="flex justify-between">
                <span>Chưa giải</span>
                <b className="text-text-muted">{totalProblems - solved}</b>
              </div>
            </div>
          </div>
        </Card>

        <Card className="flex-1 p-5">
          <div className="mb-3.5 text-sm font-bold text-navy">Biểu đồ tiến độ (8 tuần)</div>
          <div className="flex h-24 items-end gap-2">
            {trend.map((v, i) => (
              <div key={i} className="flex-1 rounded-t-sm bg-primary" style={{ height: `${v}%` }} />
            ))}
          </div>
        </Card>
      </div>

      <Card className="mb-5 p-5">
        <div className="mb-3.5 text-sm font-bold text-navy">Mức độ hoạt động (13 tuần gần nhất)</div>
        <div className="grid w-fit grid-flow-col grid-rows-7 gap-[3px]">
          {heatmapCells.map((bg, i) => (
            <div key={i} className="h-3 w-3 rounded-sm" style={{ background: bg }} />
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-4 lg:flex-row">
        <Card className="flex-1 p-5">
          <div className="mb-3 text-sm font-bold text-navy">Công nghệ đang học</div>
          <div className="flex flex-wrap gap-1.5">
            {technologies.map((t) => (
              <span key={t} className="rounded-sm bg-border-soft px-2.5 py-1 text-xs font-semibold text-navy">
                {t}
              </span>
            ))}
          </div>
        </Card>

        <Card className="flex-1 p-5">
          <div className="mb-3 text-sm font-bold text-navy">Lộ trình đang học</div>
          <div className="flex flex-col gap-3">
            {coursesInProgress.map((c) => (
              <div key={c.title}>
                <div className="mb-1.5 flex justify-between text-xs font-medium text-text">
                  <span>{c.title}</span>
                  <span>{c.progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-border-soft">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${c.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
