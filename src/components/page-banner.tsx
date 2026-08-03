import Image from "next/image";
import { ReactNode } from "react";

/**
 * Kaggle-style page header: big title, supporting copy and CTAs on the left, an
 * illustration on the right. Shared by Tổng quan / Khám phá / Lộ trình học so all three
 * browse pages open the same way. Use `PageHeader` instead for dense inner pages that
 * only need a title row.
 */
export function PageBanner({
  eyebrow,
  title,
  description,
  actions,
  illustrationSrc = "/icon-header.PNG",
}: {
  /** Small uppercase line above the title, e.g. "Chào mừng trở lại, Gia Sĩ". */
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  /** Decorative local artwork. Supply a page-specific image when the page has one. */
  illustrationSrc?: string;
}) {
  return (
    <section className="relative mb-6 overflow-hidden rounded-xl bg-surface p-7">
      <div className="relative z-10 max-w-xl">
        {eyebrow && (
          <div className="mb-2 text-[11px] font-bold tracking-widest text-primary uppercase">{eyebrow}</div>
        )}
        <h1 className="mb-2 text-[26px] leading-tight font-bold text-navy sm:text-3xl">{title}</h1>
        <p className="mb-4 text-sm leading-relaxed text-text-muted">{description}</p>
        {/* Pill CTAs are a property of this banner, not of each caller — enforced here so
         * `Button`'s default rounded-md doesn't have to be overridden per call site. */}
        {actions && (
          <div className="flex flex-wrap gap-2.5 [&_a]:rounded-full [&_button]:rounded-full">{actions}</div>
        )}
      </div>
      <Image
        src={illustrationSrc}
        alt=""
        width={596}
        height={377}
        priority
        className="pointer-events-none absolute top-1/2 right-8 hidden h-44 w-auto -translate-y-1/2 lg:block"
      />
    </section>
  );
}
