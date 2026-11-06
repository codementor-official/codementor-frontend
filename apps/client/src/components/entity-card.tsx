import { ReactNode } from "react";
import Link from "next/link";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import type { Difficulty } from "@/components/ui/badge";
import { TagRow } from "@/components/ui/tag-row";

export interface EntityCardStat {
  label: string;
  value: string | number;
}

export interface EntityCardProps {
  /** Chữ đặt giữa ô khi KHÔNG có ảnh bìa. Có ảnh bìa thì không vẽ gì đè lên ảnh. */
  tile?: string;
  /** Taller tile for browse-grid contexts (roadmaps/courses); shorter for compact tiles. `lg` gives the thumbnail top billing. */
  tileHeight?: "sm" | "md" | "lg";
  /** `horizontal`: thumbnail on the left, content on the right — for list-style contexts (roadmap course rows). Stacks when its container is narrow. Ignores `tileHeight`, `cta`, `action`; `footer` (e.g. the price) renders under the body. */
  layout?: "vertical" | "horizontal";
  eyebrow?: string;
  coverImage?: string;
  coverFit?: "cover" | "contain";
  coverPosition?: "top" | "center" | "bottom";
  kind?: { icon: PhosphorIcon; label: string };
  title: string;
  description: string;
  difficulty?: Difficulty;
  badge?: ReactNode;
  /** Nhãn phủ trên ảnh, ví dụ Miễn phí hoặc ưu đãi -20%. */
  coverBadges?: ReactNode;
  tags?: string[];
  /** Right-of-title or footer metadata, e.g. { label: "học viên", value: "1.2k" }. */
  stats?: EntityCardStat[];
  /** Free-form note block (e.g. roadmap "matched reason"), rendered above the footer. */
  note?: string;
  /** Bordered footer row (e.g. participants/updated meta), pinned to the bottom of the card. */
  footer?: ReactNode;
  /** Standalone CTA link pinned to the bottom, independent of whole-card `href` (e.g. roadmap "Xem chi tiết"). */
  cta?: { label: string; href: string };
  /** Interactive control pinned to the bottom (e.g. enrol / continue). Safe to combine with `href`. */
  action?: ReactNode;
  /** When set, the entire card becomes a link (e.g. course tiles). Don't combine with `cta`. */
  href?: string;
}

export function EntityCard({
  tile,
  tileHeight = "md",
  layout = "vertical",
  eyebrow,
  coverImage,
  coverFit = "cover",
  coverPosition = "center",
  kind,
  title,
  description,
  difficulty,
  badge,
  coverBadges,
  tags = [],
  stats = [],
  note,
  footer,
  cta,
  action,
  href,
}: EntityCardProps) {
  const horizontal = layout === "horizontal";

  const tileBlock = (
    <div
      // Không có ảnh bìa thì là một ô tint, không phải khối màu đặc: `bg-navy` đảo thành gần
      // trắng trong dark mode và cả hàng thẻ thành dải trắng chói.
      className={`relative flex shrink-0 items-center justify-center font-mono font-bold ${
        coverImage ? "bg-border-soft" : "bg-border-soft text-navy"
      } ${
        horizontal
          ? // Khung theo tỉ lệ ảnh, KHÔNG kéo cao bằng thẻ: `object-cover` trên một ô cao
            // bằng thẻ mà chỉ rộng ~1/6 sẽ cắt phăng hai bên tấm ảnh ngang, nhìn như bị
            // phóng to. Giữ 16:9 thì phần cắt gần như bằng không.
            //
            // Căn giữa theo chiều dọc (thẻ dùng `items-center`), không dán lên mép trên:
            // thẻ cao hơn ảnh khi phần thân có nhiều hàng, và ảnh treo lủng lẳng ở trên với
            // khoảng trắng bên dưới đọc như lỗi dựng chứ không như bố cục.
            //
            // Rộng theo KHUNG CHỨA chứ không theo viewport: cột khóa học của lộ trình nằm cạnh
            // sidebar và rail phải, nên ở màn 800px nó chỉ còn ~350px — ảnh 288px cố định từng
            // bóp phần chữ thành vài ký tự mỗi dòng. Khung hẹp thì ảnh lên trên, chữ xuống dưới.
            "aspect-video w-full shrink-0 overflow-hidden rounded-md @lg:w-56 @3xl:w-72"
          : tileHeight === "sm"
            ? "h-16 text-base"
            : tileHeight === "lg"
              ? "h-40 text-lg"
              : "h-20 text-lg"
      }`}
    >
      {coverImage && (
        // Ảnh bìa đến từ S3/nguồn do giảng viên nhập nên hostname không thể biết ở build time.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImage}
          alt=""
          loading="lazy"
          className={`absolute inset-0 h-full w-full ${coverFit === "contain" ? "object-contain" : "object-cover"} ${
            coverPosition === "top"
              ? "object-top"
              : coverPosition === "bottom"
                ? "object-bottom"
                : "object-center"
          }`}
        />
      )}
      {eyebrow && (
        <span className="absolute top-2 left-2 z-10 rounded-sm bg-surface/90 px-1.5 py-0.5 text-2xs font-bold tracking-wide text-navy uppercase">
          {eyebrow}
        </span>
      )}
      {coverBadges && (
        <span className="absolute top-3 left-3 z-20 max-w-[calc(100%_-_1.5rem)]">{coverBadges}</span>
      )}
      {!horizontal && !coverImage && tile}
    </div>
  );

  const bodyBlock = (
    <div
      className={`flex min-w-0 flex-1 flex-col gap-2 ${horizontal ? "py-1" : "p-4"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={`font-semibold text-navy ${horizontal ? "text-base" : "text-sm"}`}
        >
          {title}
        </h3>
        {badge}
      </div>
      <p
        className={`text-text-muted ${horizontal ? "line-clamp-2 text-sm leading-relaxed" : "line-clamp-2 text-xs leading-relaxed"}`}
      >
        {description}
      </p>
      <TagRow difficulty={difficulty} tags={tags} />
      {(kind || stats.length > 0) && (
        // Loại nội dung đứng cùng hàng số liệu, không treo thành nhãn viết hoa trên tiêu đề.
        // Từng mục `nowrap`: thẻ hẹp thì cả mục xuống dòng, không vỡ "2 thành / viên".
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-faint">
          {kind && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <kind.icon aria-hidden="true" className="h-3 w-3" />
              {kind.label}
            </span>
          )}
          {stats.map((s) => (
            <span key={s.label || String(s.value)} className="whitespace-nowrap">
              {s.value}
              {s.label ? ` ${s.label}` : ""}
            </span>
          ))}
        </div>
      )}
      {note && (
        <p className="rounded-md bg-border-soft px-2.5 py-2 text-2xs leading-relaxed text-text">
          {note}
        </p>
      )}
      {horizontal && footer && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-soft pt-2.5 text-xs text-text-faint">
          {footer}
        </div>
      )}
      {!horizontal &&
        (footer || cta || action) && (
          // Một khối ghim đáy cho cả giá/tiến độ và CTA: ghim từng phần riêng thì các thẻ cùng
          // hàng không còn kết thúc ở cùng một đường.
          <div className="mt-auto flex flex-col gap-2.5 pt-1">
            {footer && (
              <div className="flex min-h-12 items-center justify-between border-t border-border-soft pt-2.5 text-xs text-text-faint">
                {footer}
              </div>
            )}
            {cta && (
              <Link
                href={cta.href}
                className="relative z-10 rounded-md bg-navy px-3.5 py-2 text-center text-xs font-semibold text-on-ink hover:bg-navy/90"
              >
                {cta.label}
              </Link>
            )}
            {action && <div className="relative z-10">{action}</div>}
          </div>
        )}
    </div>
  );

  const card = (
    <Card
      interactive={Boolean(href)}
      className={`relative h-full overflow-hidden ${
        horizontal ? "flex flex-col gap-3 p-3 @lg:flex-row @lg:items-center @lg:gap-4" : "flex flex-col"
      }`}
    >
      {/* A stretched overlay link rather than a wrapper around the card: `action` holds real
       * buttons, and a <button> inside an <a> is invalid markup that eats its own clicks.
       * Inside the Card so `interactive`'s hover still fires. */}
      {href && (
        <Link href={href} className="absolute inset-0 z-0" aria-label={title} />
      )}
      {tileBlock}
      {bodyBlock}
    </Card>
  );
  // Ngữ cảnh container cho các biến thể `@lg:` ở trên — chỉ thẻ ngang cần đo khung chứa.
  return horizontal ? <div className="@container h-full">{card}</div> : card;
}
