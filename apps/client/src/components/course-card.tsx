import { BookOpenIcon as BookOpen, LockIcon as Lock, SealCheckIcon as SealCheck } from "@phosphor-icons/react/ssr";
import { EntityCard } from "@/components/entity-card";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import { levelToDifficulty } from "@/lib/catalogue/level";
import { COURSE_COVER_FALLBACK } from "@/lib/cover-fallback";
import { CoursePrice, CoursePriceBadges } from "@codementor/ui";

/**
 * Mọi thứ một thẻ khóa học hiển thị. Mỗi nơi gọi tự ánh xạ DTO của mình về đây thay vì
 * tự chọn field để vẽ — đó là cách trang danh mục và trang khám phá từng hiện cùng một
 * khóa học với hai bộ thông tin khác nhau.
 */
export interface CourseCardData {
  priceVnd?: number;
  listPriceVnd?: number;
  discountPercent?: number;
  promotion?: { label: string } | null;
  id: string;
  slug?: string | null;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  authorName?: string | null;
  /** `none`/`basic`/`intermediate`/`experienced`. */
  level?: string | null;
  totalChapters?: number | null;
  totalLessons?: number | null;
  durationHours?: number | null;
}

export interface CourseCardProps {
  course: CourseCardData;
  /** `horizontal`: thumbnail trái, nội dung phải — dùng cho danh sách khóa trong lộ trình. */
  layout?: "vertical" | "horizontal";
  /** Mặc định `/courses/{id}`; `null` để tắt link (khóa chưa mở trong lộ trình). */
  href?: string | null;
  /** Trạng thái học của người đang xem. `undefined` = chưa ghi danh hoặc không biết. */
  state?: "completed" | "locked";
  /** 0..100 tiến độ THẬT của người học trong khóa này. */
  progressPercent?: number;
  /** Người xem đã có quyền học: giá không còn là thông tin cho họ, nên ẩn đi. */
  owned?: boolean;
  /** Thẻ phụ theo ngữ cảnh, ví dụ "Tự chọn" trong lộ trình. */
  tags?: string[];
  /** Lý do khóa học được đề xuất. */
  note?: string;
}

/**
 * Thẻ khóa học duy nhất của app. Bố cục có hai kiểu (dọc cho lưới, ngang cho danh sách
 * trong lộ trình) nhưng thông tin thì một: ảnh bìa, tác giả, tiêu đề, mô tả, trình độ,
 * số chương/bài/giờ.
 */
export function CourseCard({
  course,
  layout = "vertical",
  href,
  state,
  progressPercent,
  owned = false,
  tags = [],
  note,
}: CourseCardProps) {
  const done = state === "completed" || (progressPercent ?? 0) >= 100;
  const unpaid = (course.priceVnd ?? 0) > 0 && !owned;
  // Ô cuối thẻ chỉ một thứ. Khóa có phí chưa mua thì giá luôn thắng: người đã bắt đầu lộ
  // trình vẫn phải thấy mình còn cần mua khóa nào.
  const footer = unpaid ? (
    <Price course={course} />
  ) : progressPercent !== undefined || done ? (
    <ProgressRing value={done ? 100 : (progressPercent ?? 0)} />
  ) : owned ? (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy">
      <SealCheck aria-hidden="true" weight="fill" className="h-4 w-4 text-success" /> Đã sở hữu
    </span>
  ) : course.priceVnd !== undefined ? (
    <Price course={course} />
  ) : undefined;

  return (
    <EntityCard
      layout={layout}
      tileHeight="lg"
      coverImage={course.coverImageUrl || COURSE_COVER_FALLBACK}
      kind={{ icon: BookOpen, label: course.authorName ?? "CodeMentor" }}
      coverBadges={owned || course.priceVnd === undefined ? undefined : (
        <CoursePriceBadges
          priceVnd={course.priceVnd}
          discountPercent={course.discountPercent}
          promotionLabel={course.promotion?.label}
        />
      )}
      title={course.title}
      description={course.description ?? "Chưa có mô tả cho khóa học này."}
      difficulty={levelToDifficulty(course.level ?? "basic")}
      tags={tags}
      // Ba con số này là bộ nhận dạng của một khóa học. Bỏ bớt ở một màn hình là buộc
      // người học phải mở khóa học ra mới so sánh được với khóa ở màn hình khác.
      stats={[
        ...(course.totalChapters != null
          ? [{ label: "chương", value: course.totalChapters }]
          : []),
        ...(course.totalLessons != null
          ? [{ label: "bài học", value: course.totalLessons }]
          : []),
        ...(course.durationHours != null
          ? [{ label: "giờ", value: course.durationHours }]
          : []),
      ]}
      badge={
        state === "locked" ? (
          <Badge tone="neutral" className="gap-1">
            <Lock className="h-3 w-3" /> Đang khóa
          </Badge>
        ) : undefined
      }
      note={note}
      footer={footer}
      href={href === null ? undefined : (href ?? `/courses/${course.id}`)}
    />
  );
}

/** Giá là thông tin quyết định mua, nên in to; giá gốc gạch ngang đứng cạnh. */
function Price({ course }: { course: CourseCardData }) {
  // Theme chỉ có hai màu (ink + cam), `text-success` ra màu ink — nên "Miễn phí" nổi bằng
  // nhãn nền cam nhạt thay vì một màu xanh ngoài hệ.
  if (!course.priceVnd) {
    return (
      <span className="rounded-md bg-primary-tint px-2.5 py-1 text-sm font-bold text-primary">
        Miễn phí
      </span>
    );
  }
  return (
    <CoursePrice
      className="text-lg tabular-nums [&>span]:text-xs"
      priceVnd={course.priceVnd ?? 0}
      listPriceVnd={course.listPriceVnd}
    />
  );
}
