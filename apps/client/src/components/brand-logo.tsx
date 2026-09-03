import Image from "next/image";

type BrandLogoProps = {
  compact?: boolean;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
};

// Display windows in the original 1672×941 artwork; keep both source files intact.
// Navigation needs a readable wordmark, not the poster's small descriptive text.
const CROPS = {
  mark: { x: 108, y: 185, width: 468, height: 484 },
  wordmark: { x: 590, y: 287, width: 1024, height: 146 },
  full: { x: 108, y: 185, width: 1512, height: 496 },
} as const;

function LogoArtwork({
  crop,
  className,
  priority,
}: {
  crop: keyof typeof CROPS;
  className: string;
  priority: boolean;
}) {
  const { x, y, width, height } = CROPS[crop];
  const style = {
    width: `${(1672 / width) * 100}%`,
    left: `${(-x / width) * 100}%`,
    top: `${(-y / height) * 100}%`,
  };

  return (
    <span
      aria-hidden="true"
      className={`relative block overflow-hidden ${className}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <Image
        src="/logo-lightmode.png"
        alt=""
        width={1672}
        height={941}
        sizes="320px"
        priority={priority}
        className="absolute h-auto max-w-none dark:hidden"
        style={style}
      />
      <Image
        src="/logo-darkmode.png"
        alt=""
        width={1672}
        height={941}
        sizes="320px"
        priority={priority}
        className="absolute hidden h-auto max-w-none dark:block"
        style={style}
      />
    </span>
  );
}

export function BrandLogo({
  compact = false,
  size = "md",
  priority = false,
}: BrandLogoProps) {
  const box = compact
    ? "h-10 w-10"
    : size === "lg"
      ? "h-[76px] w-[220px]"
      : size === "sm"
        ? "h-9 w-[150px]"
        : "h-12 w-[188px]";

  return (
    // The supplied PNGs have opaque backgrounds. Blend those into the current
    // surface; CSS theme variants also select the right image before hydration.
    <span
      role="img"
      aria-label="CodeMentor"
      className={`flex shrink-0 items-center justify-center gap-2 mix-blend-multiply dark:mix-blend-screen ${box}`}
    >
      {size === "lg" && !compact ? (
        <LogoArtwork crop="full" className="w-full" priority={priority} />
      ) : (
        <>
          <LogoArtwork
            crop="mark"
            className={`shrink-0 ${compact ? "w-9" : size === "sm" ? "w-8" : "w-10"}`}
            priority={priority}
          />
          {!compact && (
            <LogoArtwork crop="wordmark" className="min-w-0 flex-1" priority={priority} />
          )}
        </>
      )}
    </span>
  );
}
