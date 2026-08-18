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
  Lightbulb,
  Loader2,
  Route,
} from "lucide-react";
import { PageHeader, StatusBadge } from "@codementor/ui";
import { PageBody } from "@/components/page/page-body";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import { CourseSizeChart, StatusByKindChart } from "@/features/dashboard/content-charts";

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

/** Hai trạng thái quản trị viên trả nội dung về — giảng viên phải sửa rồi gửi lại. */
const RETURNED = new Set(["changes_requested", "rejected"]);

/** Bản nháp im lâu hơn ngần này ngày thì coi như bị bỏ quên. */
const STALE_DAYS = 14;

interface Item {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  kind: KindKey;
  /** `users.id` của người tạo. Hai loại gọi nó là `createdBy`, hai loại gọi `authorId`. */
  ownerId: string | null;
  /** Khoá học: số bài học và số chương. Lộ trình: số khoá học. Bài viết: tên chủ đề. */
  lessonCount?: number;
  chapterCount?: number;
  courseCount?: number;
  tagName?: string | null;
}

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

/**
 * Bảng điều khiển của giảng viên.
 *
 * Thứ tự các khối là thứ tự câu hỏi một giảng viên hỏi khi mở máy lên: có gì bị trả về
 * không, có gì đang chờ người khác không, có gì tôi làm dở mà quên không, rồi mới tới tổng
 * quan và biểu đồ. Số liệu xếp cuối vì nó trả lời câu hỏi ít khẩn cấp nhất.
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

  // Lọc theo người đang đăng nhập chứ không tin danh sách trả về là đã lọc sẵn.
  // `/articles/manage` trả TOÀN BỘ bài cho tài khoản admin — một admin mở trang giảng viên
  // sẽ thấy "Nội dung của bạn: 11 bài viết" trong khi họ viết đúng một bài.
  const mine = (items ?? []).filter((item) => item.ownerId === null || item.ownerId === user?.id);
  const chartItems = mine.map((item) => ({
    status: item.status,
    updatedAt: item.updatedAt,
    kindLabel: labelOf(item.kind),
  }));
  const courseSizes = mine
    .filter((item) => item.kind === "courses")
    .map((item) => ({
      title: item.title,
      lessons: item.lessonCount ?? 0,
      chapters: item.chapterCount ?? 0,
    }));

  return (
    <PageBody>
      <PageHeader
        description={`Đăng nhập với ${user?.email ?? ""}.`}
        icon={LayoutDashboard}
        title={`Chào ${user?.displayName ?? ""}`}
      />

      {unavailable.length > 0 && (
        <p
          className="mb-4 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm"
          role="alert"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
          <span>
            Chưa đọc được {unavailable.map((key) => labelOf(key).toLowerCase()).join(", ")}. Những
            phần khác bên dưới vẫn đúng; con số của phần thiếu hiện là dấu gạch chứ không phải 0.
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
          <Returned items={mine} />
          <PendingReview items={mine} />
          <Suggestions items={mine} />
          <StatusOverview items={mine} unavailable={unavailable} />
          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            <StatusByKindChart items={chartItems} />
            <CourseSizeChart courses={courseSizes} />
          </div>
        </div>
      )}
    </PageBody>
  );
}

/**
 * Nội dung quản trị viên đã trả về.
 *
 * Tiêu đề cũ là "Cần xử lý", còn lúc rỗng thì ghi "Không có nội dung nào bị trả về" — hai
 * câu không ăn nhập nhau, và không câu nào cho biết mục này chứa thứ gì. Giờ tiêu đề nói
 * thẳng nguồn gốc của những dòng sẽ xuất hiện ở đây, có một câu mô tả bên dưới, và câu lúc
 * rỗng nói rõ tình trạng hiện tại là bình thường chứ không phải thiếu dữ liệu.
 */
function Returned({ items }: { items: Item[] }) {
  const rows = items
    .filter((item) => RETURNED.has(item.status))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <Section
      count={rows.length}
      description="Quản trị viên đã xem và gửi lại kèm lý do. Mở ra đọc lý do, sửa, rồi gửi duyệt lần nữa."
      icon={AlertCircle}
      title="Cần bạn sửa lại"
      tone="warning"
    >
      {rows.length === 0 ? (
        <Note>
          Không có mục nào bị gửi lại. Nội dung của bạn đang là bản nháp, đang chờ duyệt, hoặc đã
          đăng.
        </Note>
      ) : (
        <ul className="grid gap-2">
          {rows.map((item) => (
            <ItemRow item={item} key={`${item.kind}-${item.id}`} />
          ))}
        </ul>
      )}
    </Section>
  );
}

/** Đang nằm ở hàng chờ của quản trị viên — giảng viên không phải làm gì, chỉ cần biết. */
function PendingReview({ items }: { items: Item[] }) {
  const rows = items
    .filter((item) => item.status === "pending_review")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  if (rows.length === 0) return null;

  return (
    <Section
      count={rows.length}
      description="Đã gửi đi và đang đợi quản trị viên. Bạn không cần làm gì thêm."
      icon={Clock3}
      title="Đang chờ duyệt"
    >
      <ul className="grid gap-2">
        {rows.map((item) => (
          <ItemRow item={item} key={`${item.kind}-${item.id}`} />
        ))}
      </ul>
    </Section>
  );
}

interface Suggestion {
  id: string;
  text: string;
  href: string;
}

/**
 * Những chỗ nội dung chưa hoàn chỉnh, suy ra từ chính dữ liệu danh sách đã tải về.
 *
 * Đây là phần một giảng viên khó tự thấy nhất: một khoá học không có bài học nào vẫn nằm
 * yên trong danh sách, trông y hệt khoá học đầy đủ; một bài viết quên gắn chủ đề thì không
 * bao giờ lọt vào bộ lọc chủ đề bên trang người học. Không có lỗi nào báo cả — chỉ là nội
 * dung im lặng không hoạt động như người viết tưởng.
 */
function Suggestions({ items }: { items: Item[] }) {
  const staleBefore = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;
  const suggestions: Suggestion[] = [];
  const hrefOf = (kind: KindKey) => KINDS.find((entry) => entry.key === kind)?.href ?? "/";

  for (const item of items) {
    if (item.kind === "courses" && item.lessonCount === 0) {
      suggestions.push({
        id: `empty-course-${item.id}`,
        text: `Khoá học "${item.title}" chưa có bài học nào`,
        href: hrefOf("courses"),
      });
    }
    if (item.kind === "roadmaps" && item.courseCount === 0) {
      suggestions.push({
        id: `empty-roadmap-${item.id}`,
        text: `Lộ trình "${item.title}" chưa gắn khoá học nào`,
        href: hrefOf("roadmaps"),
      });
    }
    // Chip lọc chủ đề bên trang người học dựng từ `tag_id`. Bài không gắn chủ đề vẫn hiện
    // trong danh sách chung nhưng không lọc ra được, và không báo lỗi ở đâu.
    if (item.kind === "articles" && item.status === "published" && !item.tagName) {
      suggestions.push({
        id: `untagged-${item.id}`,
        text: `Bài viết "${item.title}" chưa gắn chủ đề nên không lọc được bên trang người học`,
        href: hrefOf("articles"),
      });
    }
    if (item.status === "draft" && new Date(item.updatedAt).getTime() < staleBefore) {
      suggestions.push({
        id: `stale-${item.kind}-${item.id}`,
        text: `Bản nháp "${item.title}" chưa đụng tới hơn ${STALE_DAYS} ngày`,
        href: hrefOf(item.kind),
      });
    }
  }

  if (suggestions.length === 0) return null;

  return (
    <Section
      count={suggestions.length}
      description="Những chỗ nội dung chưa chạy đúng như bạn tưởng, không có thông báo lỗi nào."
      icon={Lightbulb}
      title="Gợi ý hoàn thiện"
    >
      <ul className="grid gap-2">
        {suggestions.map((suggestion) => (
          <li key={suggestion.id}>
            <Link
              className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted"
              href={suggestion.href}
            >
              <Lightbulb aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">{suggestion.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function StatusOverview({ items, unavailable }: { items: Item[]; unavailable: KindKey[] }) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold">Nội dung của bạn</h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {KINDS.map(({ key, label, href, icon: Icon }) => {
          const owned = items.filter((item) => item.kind === key);
          const published = owned.filter((item) => item.status === "published").length;
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
                  {missing ? "—" : owned.length}
                </span>
                <span className="text-xs text-muted-foreground">
                  {missing
                    ? "chưa đọc được"
                    : `${published} đã đăng · ${owned.length - published} chưa`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Section({
  title,
  description,
  icon: Icon,
  count,
  tone = "muted",
  children,
}: {
  title: string;
  description?: string;
  icon: typeof AlertCircle;
  count: number;
  tone?: "warning" | "muted";
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Icon
            aria-hidden="true"
            className={tone === "warning" ? "size-4 text-warning" : "size-4 text-muted-foreground"}
          />
          {title}
          {count > 0 && (
            <span
              className={
                tone === "warning"
                  ? "rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning"
                  : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
              }
            >
              {count}
            </span>
          )}
        </h2>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 rounded-xl border bg-card px-4 py-6 text-sm text-muted-foreground">
      <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-success" />
      {children}
    </p>
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
        <span className="shrink-0 text-xs text-muted-foreground">{kind?.label}</span>
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
  row: {
    id: string;
    title: string;
    status: string;
    updatedAt: string;
    createdBy?: string | null;
    authorId?: string | null;
    totalLessons?: number;
    totalChapters?: number;
    courseCount?: number;
    tagName?: string | null;
  },
  kind: KindKey,
): Item {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    updatedAt: row.updatedAt,
    kind,
    // Khoá học và lộ trình dùng `createdBy`, bài code và bài viết dùng `authorId`. Gộp lại
    // một tên ở đây để phần lọc bên dưới không phải biết loại nào gọi là gì.
    ownerId: row.createdBy ?? row.authorId ?? null,
    lessonCount: row.totalLessons,
    chapterCount: row.totalChapters,
    courseCount: row.courseCount,
    tagName: row.tagName,
  };
}
