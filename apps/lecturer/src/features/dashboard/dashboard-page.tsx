"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  Braces,
  CheckCircle2,
  Clock3,
  FileText,
  LayoutDashboard,
  Loader2,
  Route,
} from "lucide-react";
import { PageHeader, StatusBadge } from "@codementor/ui";
import { PageBody } from "@/components/page/page-body";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";

/** Bốn loại nội dung một giảng viên sở hữu, cùng đường dẫn tới màn quản lý của nó. */
const KINDS = [
  { key: "courses", label: "Khoá học", href: "/courses", icon: BookOpen },
  { key: "roadmaps", label: "Lộ trình", href: "/roadmaps", icon: Route },
  { key: "exercises", label: "Bài code", href: "/exercises", icon: Braces },
  { key: "articles", label: "Bài viết", href: "/articles", icon: FileText },
] as const;

type KindKey = (typeof KINDS)[number]["key"];

const STATUS_LABELS: Record<string, string> = {
  draft: "Bản nháp",
  pending_review: "Chờ duyệt",
  changes_requested: "Cần sửa",
  rejected: "Bị từ chối",
  published: "Đã đăng",
  archived: "Lưu trữ",
};

const STATUS_TONES: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  draft: "neutral",
  pending_review: "warning",
  changes_requested: "warning",
  rejected: "danger",
  published: "success",
  archived: "neutral",
};

/** Hai trạng thái đòi giảng viên phải làm gì đó — phần còn lại chỉ là thông tin. */
const NEEDS_ACTION = new Set(["changes_requested", "rejected"]);

interface Item {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  kind: KindKey;
}

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

/**
 * Bảng điều khiển của giảng viên.
 *
 * Bản trước chỉ có ba ô liên kết, kèm chú thích rằng đây "cố ý không phải một tường số
 * liệu vì chưa có gì để đếm". Giờ đã có: bốn loại nội dung, mỗi loại một máy trạng thái
 * kiểm duyệt thật.
 *
 * Vì thế trang đặt "Cần xử lý" lên đầu chứ không đặt số liệu. Một con số nói cho giảng
 * viên biết họ có bao nhiêu khoá học; một bài bị trả về nói cho họ biết phải làm gì tiếp —
 * và trước đây không có chỗ nào trên toàn bộ ứng dụng nói ra điều đó ngoài việc tự mở
 * từng danh sách một.
 *
 * Đếm bằng cách tải 100 mục mỗi loại rồi gộp ở client. Trần đó là có thật: một giảng viên
 * vượt 100 mục trong một loại sẽ thấy số liệu thiếu mà không có cảnh báo nào. Đổi lại,
 * chưa phải thêm bốn endpoint đếm ở hai service cho một màn hình vừa mới có người dùng.
 */
export function LecturerDashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[] | null>(null);
  const [unavailable, setUnavailable] = useState<KindKey[]>([]);

  useEffect(() => {
    let cancelled = false;
    const params = { limit: 100 };
    // allSettled chứ không phải all: bốn loại nội dung nằm ở hai service khác nhau, và một
    // service chết không được làm biến mất ba phần còn lại. Với all, exercise-service tắt
    // là cả trang chỉ còn một dòng lỗi — khoá học, lộ trình, bài viết đều trả về 200 nhưng
    // không còn chỗ nào vẽ chúng.
    void Promise.allSettled([
      api.courses.mine(params),
      api.roadmaps.mine(params),
      api.exercises.mine(params),
      api.articles.mine(params),
    ]).then((results) => {
      if (cancelled) return;
      const collected: Item[] = [];
      const missing: KindKey[] = [];
      results.forEach((result, index) => {
        const kind = KINDS[index]!.key;
        if (result.status === "fulfilled") {
          collected.push(...result.value.items.map((row) => toItem(row, kind)));
        } else {
          missing.push(kind);
        }
      });
      setItems(collected);
      setUnavailable(missing);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageBody>
      <PageHeader
        description={`Đăng nhập với ${user?.email ?? ""}.`}
        icon={LayoutDashboard}
        title={`Chào ${user?.displayName ?? ""}`}
      />

      {unavailable.length > 0 && (
        <p
          className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm"
          role="alert"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
          <span>
            Chưa đọc được{" "}
            {unavailable.map((key) => labelOf(key).toLowerCase()).join(", ")}. Những phần khác
            bên dưới vẫn đúng; con số của phần thiếu hiện là dấu gạch chứ không phải 0.
          </span>
        </p>
      )}

      {items === null ? (
        <p className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Đang tải nội dung của bạn…
        </p>
      ) : (
        <div className="grid gap-6">
          <NeedsAction items={items} />
          <PendingReview items={items} />
          <StatusOverview items={items} unavailable={unavailable} />
        </div>
      )}
    </PageBody>
  );
}

function NeedsAction({ items }: { items: Item[] }) {
  const rows = items
    .filter((item) => NEEDS_ACTION.has(item.status))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
        <AlertCircle aria-hidden="true" className="size-4 text-warning" />
        Cần xử lý
        {rows.length > 0 && (
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
            {rows.length}
          </span>
        )}
      </h2>
      {rows.length === 0 ? (
        <p className="flex items-center gap-2 rounded-xl border bg-card px-4 py-6 text-sm text-muted-foreground">
          <CheckCircle2 aria-hidden="true" className="size-4 text-success" />
          Không có nội dung nào bị trả về.
        </p>
      ) : (
        <ul className="grid gap-2">
          {rows.map((item) => (
            <ItemRow item={item} key={`${item.kind}-${item.id}`} />
          ))}
        </ul>
      )}
    </section>
  );
}

function PendingReview({ items }: { items: Item[] }) {
  const rows = items
    .filter((item) => item.status === "pending_review")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  if (rows.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
        <Clock3 aria-hidden="true" className="size-4 text-muted-foreground" />
        Đang chờ quản trị viên duyệt
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {rows.length}
        </span>
      </h2>
      <ul className="grid gap-2">
        {rows.map((item) => (
          <ItemRow item={item} key={`${item.kind}-${item.id}`} />
        ))}
      </ul>
    </section>
  );
}

function StatusOverview({
  items,
  unavailable,
}: {
  items: Item[];
  unavailable: KindKey[];
}) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold">Nội dung của bạn</h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {KINDS.map(({ key, label, href, icon: Icon }) => {
          const mine = items.filter((item) => item.kind === key);
          const published = mine.filter((item) => item.status === "published").length;
          // Không đọc được thì hiện dấu gạch, không hiện 0: "0 khoá học" là một khẳng định,
          // và khẳng định sai chỗ này khiến người dùng tưởng mình vừa mất hết nội dung.
          const missing = unavailable.includes(key);
          return (
            <li key={key}>
              <Link
                className="flex flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:bg-muted"
                href={href}
              >
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
                  {label}
                </span>
                <span className="text-2xl font-semibold tracking-tight">
                  {missing ? "—" : mine.length}
                </span>
                <span className="text-xs text-muted-foreground">
                  {missing ? "chưa đọc được" : `${published} đã đăng · ${mine.length - published} chưa`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ItemRow({ item }: { item: Item }) {
  const kind = KINDS.find((entry) => entry.key === item.kind);
  const Icon = kind?.icon ?? FileText;
  return (
    <li>
      <Link
        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-muted"
        href={kind?.href ?? "/"}
      >
        <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</span>
        <StatusBadge tone={STATUS_TONES[item.status] ?? "neutral"}>
          {STATUS_LABELS[item.status] ?? item.status}
        </StatusBadge>
        <span className="shrink-0 text-xs text-muted-foreground">
          {dateFormat.format(new Date(item.updatedAt))}
        </span>
      </Link>
    </li>
  );
}

function labelOf(key: KindKey): string {
  return KINDS.find((entry) => entry.key === key)?.label ?? key;
}

function toItem(
  row: { id: string; title: string; status: string; updatedAt: string },
  kind: KindKey,
): Item {
  return { id: row.id, title: row.title, status: row.status, updatedAt: row.updatedAt, kind };
}

