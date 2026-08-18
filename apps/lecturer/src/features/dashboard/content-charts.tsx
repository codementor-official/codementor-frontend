"use client";

import { ChartNoAxesCombined, PieChart as PieIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

/** Thứ tự theo vòng đời kiểm duyệt, không theo bảng chữ cái — đọc từ trái sang là đúng luồng. */
const STATUS_ORDER = [
  { key: "draft", label: "Bản nháp", fill: "var(--chart-2)" },
  { key: "pending_review", label: "Chờ duyệt", fill: "var(--chart-3)" },
  { key: "changes_requested", label: "Cần sửa", fill: "var(--chart-4)" },
  { key: "rejected", label: "Bị từ chối", fill: "var(--destructive)" },
  { key: "published", label: "Đã đăng", fill: "var(--chart-1)" },
  { key: "archived", label: "Lưu trữ", fill: "var(--chart-5)" },
] as const;

/**
 * Nội dung đang nằm ở đâu trong vòng kiểm duyệt.
 *
 * Bỏ hẳn những trạng thái không có mục nào thay vì vẽ cột bằng 0: với một giảng viên mới,
 * bốn trong sáu cột sẽ rỗng và biểu đồ trông như hỏng.
 */
export function StatusChart({ items }: { items: ChartItem[] }) {
  const data = STATUS_ORDER.map((status) => ({
    name: status.label,
    fill: status.fill,
    value: items.filter((item) => item.status === status.key).length,
  })).filter((row) => row.value > 0);

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <span className="mr-3 flex size-8 items-center justify-center rounded-lg border bg-background">
          <PieIcon aria-hidden="true" className="size-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold">Theo trạng thái</h2>
          <p className="text-xs text-muted-foreground">Toàn bộ nội dung bạn sở hữu</p>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Bạn chưa có nội dung nào.</p>
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={data} layout="vertical" margin={{ bottom: 0, left: 8, right: 12, top: 0 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                {/* Số nguyên: một giảng viên có 3 khoá học, thang tự động sẽ chia ra 1,5. */}
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
                  width={86}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "var(--muted)" }}
                  formatter={(value) => [Number(value), "Mục"]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {data.map((row) => (
                    <Cell fill={row.fill} key={row.name} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** "2026-08" → "T8/26". */
function monthLabel(month: string): string {
  const [year, index] = month.split("-");
  return `T${Number(index)}/${year?.slice(2) ?? ""}`;
}

/**
 * Nhịp soạn thảo 6 tháng gần nhất, tách theo loại nội dung.
 *
 * Đếm theo `updatedAt`, nên mỗi mục xuất hiện ĐÚNG MỘT LẦN, ở tháng nó được sửa gần nhất.
 * Đây không phải "đã tạo bao nhiêu trong tháng" — danh sách không trả `createdAt` cho cả
 * bốn loại, và đoán bằng `updatedAt` rồi gọi nó là ngày tạo thì sai. Tiêu đề nói đúng thứ
 * đang đếm: lần sửa gần nhất.
 */
export function ActivityChart({ items }: { items: ChartItem[] }) {
  const kinds = [...new Set(items.map((item) => item.kindLabel))];
  const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

  const months: string[] = [];
  const now = new Date();
  for (let back = 5; back >= 0; back -= 1) {
    const point = new Date(now.getFullYear(), now.getMonth() - back, 1);
    months.push(`${point.getFullYear()}-${String(point.getMonth() + 1).padStart(2, "0")}`);
  }

  const data = months.map((month) => {
    const row: Record<string, string | number> = { label: monthLabel(month) };
    for (const kind of kinds) {
      row[kind] = items.filter(
        (item) => item.kindLabel === kind && item.updatedAt.slice(0, 7) === month,
      ).length;
    }
    return row;
  });

  const empty = data.every((row) => kinds.every((kind) => row[kind] === 0));

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <span className="mr-3 flex size-8 items-center justify-center rounded-lg border bg-background">
          <ChartNoAxesCombined aria-hidden="true" className="size-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold">Nhịp soạn thảo</h2>
          <p className="text-xs text-muted-foreground">
            Số mục có lần sửa gần nhất rơi vào tháng đó, 6 tháng qua
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {empty ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Chưa có hoạt động nào trong 6 tháng qua.
          </p>
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={data} margin={{ bottom: 0, left: -20, right: 4, top: 4 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="label"
                  fontSize={11}
                  stroke="var(--muted-foreground)"
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="var(--muted-foreground)"
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                {kinds.map((kind, index) => (
                  <Bar
                    dataKey={kind}
                    fill={palette[index % palette.length]}
                    key={kind}
                    radius={[3, 3, 0, 0]}
                    stackId="content"
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
