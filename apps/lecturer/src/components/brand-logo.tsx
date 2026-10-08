import Image from "next/image";

/**
 * CodeMentor mark, optionally followed by this console's name. The name is split navy/orange
 * like the client's "Code|Mentor" wordmark, in the mark's own colours rather than theme tokens.
 * Transparent PNGs; CSS picks the theme variant so there is no flash before hydration.
 */
export function BrandLogo({ size = 40, showName = false }: { size?: number; showName?: boolean }) {
  return (
    <span aria-label="CodeMentor Lecturer" className="flex shrink-0 items-center gap-2.5" role="img">
      <span className="relative block shrink-0" style={{ height: size, width: size }}>
        <Image alt="" className="dark:hidden" fill priority sizes={`${size}px`} src="/brand-mark.png" />
        <Image alt="" className="hidden dark:block" fill priority sizes={`${size}px`} src="/brand-mark-dark.png" />
      </span>
      {showName && (
        <span className="font-extrabold leading-none tracking-tight" style={{ fontSize: Math.round(size * 0.6) }}>
          <span className="text-[#022761] dark:text-white">Lec</span>
          <span className="text-[#fd6e01]">turer</span>
        </span>
      )}
    </span>
  );
}
