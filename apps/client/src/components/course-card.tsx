import { BookOpen, CheckCircle2, Lock } from "lucide-react";
import { EntityCard } from "@/components/entity-card";
import { Badge } from "@/components/ui/badge";
import { levelToDifficulty } from "@/lib/catalogue/level";
import { placeholderCoverUrl } from "@/lib/placeholder-image";

/**
 * Mọi thứ một thẻ khóa học hiển thị. Mỗi nơi gọi tự ánh xạ DTO của mình về đây thay vì
 * tự chọn field để vẽ — đó là cách trang danh mục và trang khám phá từng hiện cùng một
 * khóa học với hai bộ thông tin khác nhau.
 */
export interface CourseCardData {
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

const tileVariantMap = {
  navy: "ink",
  accent: "accent",
  primary: "primary",
} as const;

/** Hai chữ cái đầu — dự phòng khi khóa học chưa có ảnh bìa. */
function tileFor(title: string): string {
  const words = title.trim().split(/\s+/);
  return (words[0]?.[0] ?? "?").concat(words[1]?.[0] ?? "").toUpperCase();
}

export interface CourseCardProps {
  course: CourseCardData;
  /** `horizontal`: thumbnail trái, nội dung phải — dùng cho danh sách khóa trong lộ trình. */
  layout?: "vertical" | "horizontal";
  tileVariant?: keyof typeof tileVariantMap;
  /** Mặc định `/courses/{id}`; `null` để tắt link (khóa chưa mở trong lộ trình). */
  href?: string | null;
  /** Trạng thái học của người đang xem. `undefined` = chưa ghi danh hoặc không biết. */
  state?: "completed" | "locked";
  /** 0..100 tiến độ THẬT của người học trong khóa này. */
  progressPercent?: number;
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
  tileVariant = "navy",
  href,
  state,
  progressPercent,
  tags = [],
  note,
}: CourseCardProps) {
  return (
    <EntityCard
      layout={layout}
      tile={tileFor(course.title)}
      tileVariant={tileVariantMap[tileVariant]}
      tileHeight="lg"
      coverImage={
        course.coverImageUrl || placeholderCoverUrl(course.slug ?? course.title)
      }
      kind={{ icon: BookOpen, label: course.authorName ?? "CodeMentor" }}
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
        ) : state === "completed" ? (
          <Badge tone="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" /> Hoàn thành
          </Badge>
        ) : undefined
      }
      note={note}
      progress={progressPercent}
      href={href === null ? undefined : (href ?? `/courses/${course.id}`)}
    />
  );
}
