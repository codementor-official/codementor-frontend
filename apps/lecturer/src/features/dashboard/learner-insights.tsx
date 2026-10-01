"use client";

import { useCallback, useState } from "react";
import { BadgeCheck, GraduationCap, Star, UserPlus, Users, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, DailyBarCard, KpiStrip, SegmentedTabs, useSummary } from "@codementor/ui";
import { api, type LecturerInsights } from "@/lib/api";

const RANGES = [
  { value: "7", label: "7 ngày" },
  { value: "30", label: "30 ngày" },
];

/**
 * Người học trên nội dung của giảng viên: số đang học, số xong, ghi danh, đánh giá, bài nộp,
 * doanh thu. Phần còn lại của trang chỉ đếm nội dung mình viết; đây là chỗ duy nhất trả lời
 * "có ai học không".
 *
 * Lỗi chỉ làm các ô về "—", không chặn phần nội dung bên dưới.
 */
export function LearnerInsights() {
  const [days, setDays] = useState<7 | 30>(30);
  const load = useCallback(() => api.courses.insights(days), [days]);
  const { data, loading } = useSummary(load);

  // Không có lượt nộp thì tỉ lệ đạt là "—" chứ không phải 0%: chưa ai nộp khác với nộp đều trượt.
  const acceptRate =
    data && data.submissions > 0 ? Math.round((data.acceptedSubmissions / data.submissions) * 100) : null;

  return (
    <section className="grid min-w-0 gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Users aria-hidden="true" className="size-4 text-muted-foreground" />
          Người học của bạn
        </h2>
        <SegmentedTabs
          onChange={(value) => setDays(value === "7" ? 7 : 30)}
          options={RANGES}
          value={String(days)}
        />
      </div>

      <KpiStrip
        loading={loading}
        metrics={[
          { icon: Users, label: "Đang học", value: data?.activeLearners ?? null },
          { icon: GraduationCap, label: "Đã học xong", value: data?.completedLearners ?? null },
          { icon: UserPlus, label: `Ghi danh mới (${days} ngày)`, value: data?.newEnrollments ?? null },
          { icon: Star, label: `Đánh giá TB (${data?.reviews ?? 0} lượt)`, value: data?.avgRating ?? null },
          { icon: BadgeCheck, label: `Tỉ lệ đạt % (${data?.submissions ?? 0} bài nộp)`, value: acceptRate },
          { icon: Wallet, label: `Doanh thu ${days} ngày (₫)`, value: data?.revenue ?? null },
        ]}
      />

      {data && (
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <DailyBarCard
            data={data.daily}
            describe={(point) => `${point.completions} bài học hoàn thành · ${point.enrollments} ghi danh mới`}
            title="Bài học được hoàn thành mỗi ngày"
            value="completions"
          />
          <TopCourses courses={data.topCourses} />
        </div>
      )}
    </section>
  );
}

function TopCourses({ courses }: { courses: LecturerInsights["topCourses"] }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <h2 className="text-sm font-semibold">Khoá học nhiều người học nhất</h2>
      </CardHeader>
      <CardContent className="pb-4">
        {courses.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Chưa có khoá học nào được đăng.</p>
        ) : (
          <ul className="grid gap-3">
            {courses.map((course) => (
              <li className="grid gap-1.5" key={course.id}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium">{course.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {course.learners} người · {course.completed} xong
                  </span>
                </div>
                {/* Thanh là tiến độ trung bình, không phải tỉ lệ hoàn thành. */}
                <div
                  aria-label={`Tiến độ trung bình ${course.avgProgress}%`}
                  className="h-1.5 overflow-hidden rounded-full bg-muted"
                  role="img"
                >
                  <div className="h-full rounded-full bg-primary" style={{ width: `${course.avgProgress}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
