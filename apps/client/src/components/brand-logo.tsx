import Image from "next/image";

type BrandLogoProps = {
  compact?: boolean;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
};

const SIZES = {
  sm: { mark: 32, text: "text-lg" },
  md: { mark: 40, text: "text-xl" },
  lg: { mark: 64, text: "text-3xl" },
} as const;

/** Square mark, transparent PNGs. CSS picks the theme variant so there is no flash before hydration. */
function BrandMark({ size, priority }: { size: number; priority: boolean }) {
  return (
    <span className="relative block shrink-0" style={{ height: size, width: size }}>
      <Image alt="" className="dark:hidden" fill priority={priority} sizes={`${size}px`} src="/brand-mark.png" />
      <Image alt="" className="hidden dark:block" fill priority={priority} sizes={`${size}px`} src="/brand-mark-dark.png" />
    </span>
  );
}

export function BrandLogo({
  compact = false,
  size = "md",
  priority = false,
}: BrandLogoProps) {
  const { mark, text } = SIZES[size];

  return (
    <span role="img" aria-label="CodeMentor" className="flex shrink-0 items-center gap-2.5">
      <BrandMark size={compact ? 36 : mark} priority={priority} />
      {!compact && (
        <span className="min-w-0">
          {/* Colours are the mark's own navy/orange, not theme tokens: the wordmark must
              match the artwork, and the client's `navy` token is really near-black ink. */}
          <span className={`block font-extrabold leading-none tracking-tight ${text}`}>
            <span className="text-[#022761] dark:text-white">Code</span>
            <span className="text-[#fd6e01]">Mentor</span>
          </span>
          {size === "lg" && (
            <span className="mt-2 block text-2xs font-bold tracking-wider text-text-muted uppercase">
              Học tốt hơn – Lập trình tự tin hơn
            </span>
          )}
        </span>
      )}
    </span>
  );
}
