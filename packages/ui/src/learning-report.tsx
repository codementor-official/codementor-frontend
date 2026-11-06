"use client";

import { Fragment, useState } from "react";
import {
  CaretDownIcon as CaretDown,
  CaretRightIcon as CaretRight,
  CertificateIcon as Certificate,
  ClockCountdownIcon as Stalled,
  GraduationCapIcon as GraduationCap,
  HourglassIcon as Hourglass,
  PathIcon as Route,
  ShuffleIcon as Shuffle,
  UserPlusIcon as UserPlus,
  UsersIcon as Users,
} from "@phosphor-icons/react/ssr";
import { CONTENT_STATUS_LABELS, type ContentStatus } from "@codementor/types";
import { KpiStrip } from "./kpi-strip";

/** Hình dạng của `GET /learning-reports` (learning-service `LearningReportService`). */
interface StatusCounts {
  enrolled: number;
  notStarted: number;
  inProgress: number;
  stalled: number;
  completed: number;
  dropped: number;
  newEnrollments: number;
  recentCompletions: number;
  avgProgress: number;
  medianDaysToComplete: number | null;
}

export interface LearningReportData {
  days: number;
  stalledDays: number;
  summary: {
    courseEnrollments: number;
    notStarted: number;
    inProgress: number;
    stalled: number;
    completed: number;
    dropped: number;
    completionRate: number;
    newEnrollments: number;
    recentCompletions: number;
    certificates: number;
    recentCertificates: number;
    roadmapEnrollments: number;
    roadmapsCompleted: number;
    outOfOrderStarts: number;
  };
  courses: (StatusCounts & { id: string; title: string; status: string; outOfOrder: number; certificates: number })[];
  roadmaps: (StatusCounts & {
    id: string;
    title: string;
    status: string;
    outOfOrder: number;
    certificates: number;
    funnel: { position: number; title: string; isOptional: boolean; started: number; completed: number; outOfOrder: number }[];
  })[];
}

const pct = (part: number, whole: number) => (whole === 0 ? "—" : `${Math.round((part / whole) * 100)}%`);
const TH = "px-3 py-2 text-right font-medium whitespace-nowrap";
const TD = "px-3 py-2 text-right tabular-nums whitespace-nowrap";

/**
 * Báo cáo học tập — dùng chung cho giảng viên (nội dung của mình) và admin (toàn nền tảng).
 * Mọi con số theo đúng một bộ định nghĩa ở backend; trang này chỉ hiển thị.
 */
export function LearningReport({ data, loading = false }: { data: LearningReportData | null; loading?: boolean }) {
  const s = data?.summary;
  const days = data?.days ?? 30;
  const stalledDays = data?.stalledDays ?? 14;
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <KpiStrip
        loading={loading}
        metrics={[
          { icon: Users, label: "Lượt ghi danh khóa học", value: s?.courseEnrollments ?? null },
          { icon: Hourglass, label: "Chưa bắt đầu", value: s?.notStarted ?? null },
          { icon: Users, label: "Đang học dở", value: s?.inProgress ?? null },
          { icon: Stalled, label: `Ngưng học (> ${stalledDays} ngày)`, value: s?.stalled ?? null },
          { icon: GraduationCap, label: `Hoàn thành (${s?.completionRate ?? 0}%)`, value: s?.completed ?? null },
          { icon: UserPlus, label: `Ghi danh mới ${days} ngày`, value: s?.newEnrollments ?? null },
          { icon: Certificate, label: `Chứng chỉ (+${s?.recentCertificates ?? 0} trong ${days} ngày)`, value: s?.certificates ?? null },
          { icon: Route, label: `Lộ trình hoàn thành / ${s?.roadmapEnrollments ?? 0} ghi danh`, value: s?.roadmapsCompleted ?? null },
          { icon: Shuffle, label: "Bắt đầu khóa bỏ qua thứ tự", value: s?.outOfOrderStarts ?? null },
        ]}
      />

      {data && (
        <>
          <section className="min-w-0">
            <h2 className="mb-2 text-sm font-semibold">Theo khóa học</h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[920px] text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Khóa học</th>
                    <th className={TH}>Ghi danh</th>
                    <th className={TH}>Chưa bắt đầu</th>
                    <th className={TH}>Học dở</th>
                    <th className={TH}>Ngưng học</th>
                    <th className={TH}>Hoàn thành</th>
                    <th className={TH}>Bỏ học</th>
                    <th className={TH}>Tiến độ TB</th>
                    <th className={TH} title="Trung vị số ngày từ lúc ghi danh tới lúc hoàn thành">Ngày để xong</th>
                    <th className={TH}>Chứng chỉ</th>
                    <th className={TH} title="Bắt đầu từ lộ trình khi còn khóa bắt buộc phía trước chưa xong">Bỏ qua thứ tự</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.courses.map((row) => (
                    <tr key={row.id}>
                      <td className="max-w-72 truncate px-3 py-2" title={row.title}>
                        {row.title}
                        {row.status !== "published" && (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            ({CONTENT_STATUS_LABELS[row.status as ContentStatus] ?? row.status})
                          </span>
                        )}
                      </td>
                      <td className={TD}>{row.enrolled}</td>
                      <td className={TD}>{row.notStarted}</td>
                      <td className={TD}>{row.inProgress}</td>
                      <td className={TD}>{row.stalled}</td>
                      <td className={TD}>
                        {row.completed} <span className="text-xs text-muted-foreground">{pct(row.completed, row.enrolled)}</span>
                      </td>
                      <td className={TD}>{row.dropped}</td>
                      <td className={TD}>{row.avgProgress}%</td>
                      <td className={TD}>{row.medianDaysToComplete ?? "—"}</td>
                      <td className={TD}>{row.certificates}</td>
                      <td className={TD}>{row.outOfOrder}</td>
                    </tr>
                  ))}
                  {data.courses.length === 0 && <EmptyRow span={11} />}
                </tbody>
              </table>
            </div>
          </section>

          <RoadmapTable rows={data.roadmaps} />
        </>
      )}
    </div>
  );
}

function RoadmapTable({ rows }: { rows: LearningReportData["roadmaps"] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="min-w-0">
      <h2 className="mb-2 text-sm font-semibold">Theo lộ trình</h2>
      <p className="mb-2 text-xs text-muted-foreground">
        Bấm một lộ trình để xem phễu: trong số người đã ghi danh lộ trình, bao nhiêu người bắt đầu và hoàn thành khóa ở từng vị trí.
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Lộ trình</th>
              <th className={TH}>Ghi danh</th>
              <th className={TH}>Đang học</th>
              <th className={TH}>Ngưng học</th>
              <th className={TH}>Hoàn thành</th>
              <th className={TH}>Tiến độ TB</th>
              <th className={TH}>Chứng chỉ</th>
              <th className={TH}>Bỏ qua thứ tự</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => {
              const expanded = open === row.id;
              return (
                <Fragment key={row.id}>
                  <tr>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => setOpen(expanded ? null : row.id)}
                        className="flex max-w-72 items-center gap-1 text-left hover:text-primary"
                      >
                        {expanded ? <CaretDown className="h-3.5 w-3.5 shrink-0" /> : <CaretRight className="h-3.5 w-3.5 shrink-0" />}
                        <span className="truncate" title={row.title}>
                          {row.title}
                        </span>
                      </button>
                    </td>
                    <td className={TD}>{row.enrolled}</td>
                    <td className={TD}>{row.inProgress + row.notStarted}</td>
                    <td className={TD}>{row.stalled}</td>
                    <td className={TD}>
                      {row.completed} <span className="text-xs text-muted-foreground">{pct(row.completed, row.enrolled)}</span>
                    </td>
                    <td className={TD}>{row.avgProgress}%</td>
                    <td className={TD}>{row.certificates}</td>
                    <td className={TD}>{row.outOfOrder}</td>
                  </tr>
                  {expanded && (
                    <tr>
                      <td colSpan={8} className="bg-muted/30 px-4 py-3">
                        <Funnel enrolled={row.enrolled} steps={row.funnel} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {rows.length === 0 && <EmptyRow span={8} />}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Thanh ngang theo vị trí khóa: phần đậm = hoàn thành, phần nhạt = mới bắt đầu. */
function Funnel({ enrolled, steps }: { enrolled: number; steps: LearningReportData["roadmaps"][number]["funnel"] }) {
  if (steps.length === 0) return <p className="text-xs text-muted-foreground">Lộ trình chưa có khóa học.</p>;
  const base = Math.max(enrolled, 1);
  return (
    <ol className="flex flex-col gap-2">
      {steps.map((step) => (
        <li key={step.position} className="grid grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto] items-center gap-3 text-xs">
          <span className="truncate" title={step.title}>
            {step.position}. {step.title}
            {step.isOptional && <span className="text-muted-foreground"> (tự chọn)</span>}
          </span>
          <span className="relative h-3 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <span className="absolute inset-y-0 left-0 rounded-full bg-primary/30" style={{ width: `${(step.started / base) * 100}%` }} />
            <span className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${(step.completed / base) * 100}%` }} />
          </span>
          <span className="tabular-nums text-muted-foreground">
            {step.completed}/{step.started} xong{step.outOfOrder > 0 ? ` · ${step.outOfOrder} bỏ qua thứ tự` : ""}
          </span>
        </li>
      ))}
    </ol>
  );
}

function EmptyRow({ span }: { span: number }) {
  return (
    <tr>
      <td colSpan={span} className="px-3 py-8 text-center text-sm text-muted-foreground">
        Chưa có nội dung nào được công khai.
      </td>
    </tr>
  );
}
