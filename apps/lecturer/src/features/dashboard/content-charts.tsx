"use client";

import { BookOpen, Layers } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader } from "@codementor/ui";

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
};

export interface ChartItem {
  status: string;
  updatedAt: string;
  kindLabel: string;
}

/**
 * Thứ tự theo vòng đời kiểm duyệt, không theo bảng chữ cái: đọc từ trái sang phải là đi
 * đúng đường một nội dung phải đi, từ bản nháp tới lúc công khai.
 */
const STATUSES = [
  { key: "draft", label: "Bản nháp", fill: "var(--chart-5)" },
  { key: "changes_requested", label: "Cần sửa", fill: "var(--warning)" },
  { key: "rejected", label: "Bị từ chối", fill: "var(--destructive)" },
  { key: "pending_review", label: "Chờ duyệt", fill: "var(--chart-2)" },
  { key: "published", label: "Đã đăng", fill: "var(--success)" },
  { key: "archived", label: "Lưu trữ", fill: "var(--chart-4)" },
] as const;

/**
 * Mỗi loại nội dung một thanh, chia theo trạng thái.
 *
 * Bản trước gộp cả bốn loại vào một biểu đồ đếm theo trạng thái, và với một giảng viên chỉ
 * có nội dung đã đăng thì nó ra đúng một khối đen to đùng — đúng số liệu nhưng không nói
 * thêm được gì. Thanh chồng theo loại thì ở mọi lượng dữ liệu vẫn trả lời được câu hỏi
 * giảng viên thực sự hỏi: loại nào của tôi đang kẹt, và kẹt ở khâu nào.
 */
export function StatusByKindChart({ items }: { items: ChartItem[] }) {
  const kinds = [...new Set(items.map((item) => item.kindLabel))];
  const data = kinds.map((kind) => {
    const row: Record<string, string | number> = { name: kind };
    for (const status of STATUSES) {
      row[status.label] = items.filter(
        (item) => item.kindLabel === kind && item.status === status.key,
      ).length;
    }
    return row;
  });

  // Chỉ vẽ trạng thái thực sự có mục. Giữ cả sáu thì chú giải dài gấp đôi biểu đồ, và năm
  // trong số đó luôn bằng 0 với phần lớn giảng viên.
  const present = STATUSES.filter((status) =>
    items.some((item) => item.status === status.key),
  );

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <span className="mr-3 flex size-8 items-center justify-center rounded-lg border bg-background">
          <Layers aria-hidden="true" className="size-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold">Nội dung theo trạng thái</h2>
          <p className="text-xs text-muted-foreground">Từng loại đang kẹt ở khâu nào</p>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Bạn chưa có nội dung nào.
          </p>
        ) : (
          <div className="h-[268px] w-full">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart
                barSize={22}
                data={data}
                layout="vertical"
                margin={{ bottom: 0, left: 8, right: 12, top: 0 }}
              >
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                {/* Số nguyên: với 3 khoá học, thang tự động chia ra 1,5 khoá học. */}
                <XAxis
                  allowDecimals={false}
                  axisLine={false}
                  fontSize={10}
                  stroke="var(--muted-foreground)"
                  tickLine={false}
                  type="number"
                />
                <YAxis
                  axisLine={false}
                  dataKey="name"
                  fontSize={11}
                  stroke="var(--muted-foreground)"
                  tickLine={false}
                  type="category"
                  width={74}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                {present.map((status, index) => (
                  <Bar
                    dataKey={status.label}
                    fill={status.fill}
                    key={status.key}
                    // Bo góc chỉ ở đoạn cuối cùng của thanh chồng, không bo từng khúc.
                    radius={index === present.length - 1 ? [0, 4, 4, 0] : undefined}
                    stackId="status"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export interface CourseSize {
  title: string;
  lessons: number;
  chapters: number;
}

/**
 * Số bài học của từng khoá học, khoá mỏng nhất lên trước.
 *
 * Chỗ này thay cho biểu đồ "nhịp soạn thảo theo tháng" trước đó. Cái kia đếm `updatedAt`
 * theo 12 tháng, mà nền tảng mới chạy nên toàn bộ nội dung đều được sửa trong cùng một
 * tháng: mười một cột bằng 0 và một cột ở tận cùng bên phải. Đúng số liệu, nhưng không trả
 * lời được câu hỏi nào, và sẽ còn như vậy suốt nhiều tháng nữa.
 *
 * Số bài học mỗi khoá thì trả lời ngay một câu có thật: khoá nào của tôi đang mỏng. Sắp
 * tăng dần để những khoá cần bổ sung nằm ngay trên cùng thay vì phải dò.
 */
export function CourseSizeChart({ courses }: { courses: CourseSize[] }) {
  // Nhiều hơn tám thanh thì chữ chồng lên nhau; tám khoá mỏng nhất là phần đáng nhìn.
  const data = [...courses].sort((a, b) => a.lessons - b.lessons).slice(0, 8);

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <span className="mr-3 flex size-8 items-center justify-center rounded-lg border bg-background">
          <BookOpen aria-hidden="true" className="size-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold">Quy mô khoá học</h2>
          <p className="text-xs text-muted-foreground">Số bài học mỗi khoá, mỏng nhất lên trước</p>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Bạn chưa có khoá học nào.
          </p>
        ) : (
          <div className="h-[268px] w-full">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart
                barSize={18}
                data={data}
                layout="vertical"
                margin={{ bottom: 0, left: 8, right: 16, top: 0 }}
              >
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis
                  allowDecimals={false}
                  axisLine={false}
                  fontSize={10}
                  stroke="var(--muted-foreground)"
                  tickLine={false}
                  type="number"
                />
                <YAxis
                  axisLine={false}
                  dataKey="title"
                  fontSize={11}
                  stroke="var(--muted-foreground)"
                  tickLine={false}
                  type="category"
                  width={120}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "var(--muted)" }}
                  formatter={(value, _name, entry) => [
                    `${Number(value)} bài học · ${(entry?.payload as CourseSize | undefined)?.chapters ?? 0} chương`,
                    "Quy mô",
                  ]}
                />
                <Bar dataKey="lessons" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
