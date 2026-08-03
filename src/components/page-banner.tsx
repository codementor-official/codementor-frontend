import Image from "next/image";
import { Sparkles } from "lucide-react";
import { ReactNode } from "react";

type BannerVariant = "default" | "dashboard" | "explore" | "paths" | "workspace" | "practice";

/** A contextual hero that gives browse pages a clear sense of place without sacrificing CTA clarity. */
export function PageBanner({
  eyebrow,
  title,
  description,
  actions,
  illustrationSrc = "/icon-header.PNG",
  variant = "default",
  highlights = [],
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  illustrationSrc?: string;
  variant?: BannerVariant;
  highlights?: Array<{ value: string; label: string }>;
}) {
  return (
    <section data-variant={variant} className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-surface px-5 py-6 shadow-card sm:px-7 sm:py-7">
      <div className="relative grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-3 inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-primary uppercase">
              <Sparkles className="h-3 w-3" /> {eyebrow}
            </div>
          )}
          <h1 className="max-w-3xl text-2xl leading-tight font-bold tracking-tight text-navy sm:text-3xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">{description}</p>

          {actions && <div className="mt-5 flex flex-wrap gap-2.5 [&_a]:rounded-full [&_button]:rounded-full">{actions}</div>}

          {highlights.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
              {highlights.map((highlight) => (
                <div key={highlight.label} className="min-w-28 rounded-lg border border-border bg-surface px-3 py-2">
                  <div className="text-sm font-bold text-navy">{highlight.value}</div>
                  <div className="mt-0.5 text-[10px] font-medium text-text-faint">{highlight.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative hidden min-h-48 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface p-4 lg:flex">
          <Image src={illustrationSrc} alt="" width={596} height={377} priority className="relative h-44 w-full object-contain" />
        </div>
      </div>
    </section>
  );
}
