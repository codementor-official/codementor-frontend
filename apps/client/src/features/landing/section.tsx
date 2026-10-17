import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Khung chung của mọi section landing: cùng bề rộng, cùng nhịp dọc, cùng kiểu tiêu đề. */
export function LandingSection({
  id,
  eyebrow,
  title,
  description,
  action,
  tone = "surface",
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  tone?: "surface" | "muted";
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      data-tone={tone}
      // Hai section nền trắng liền nhau thì section sau bỏ padding trên — không thì khoảng trống bị cộng đôi.
      className={`px-4 py-10 sm:px-8 lg:py-12 ${tone === "muted" ? "border-y border-border bg-bg" : "[section[data-tone=surface]+&]:pt-0"}`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-text-muted uppercase">{eyebrow}</p>
            <h2 id={`${id}-title`} className="mt-2 text-2xl font-bold tracking-tight text-navy sm:text-3xl">
              {title}
            </h2>
            {description && <p className="mt-3 text-base leading-7 text-text-muted">{description}</p>}
          </div>
          {action && (
            <Link
              href={action.href}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-semibold text-navy hover:text-primary"
            >
              {action.label} <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
