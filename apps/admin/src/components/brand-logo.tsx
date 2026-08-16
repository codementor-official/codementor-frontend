import Image from "next/image";

/**
 * Crops `/logo.png` (460x159, full wordmark) down to just the mark at the left edge —
 * same ratio apps/client uses for its compact variant, so the mark reads identically
 * across every CodeMentor surface.
 */
export function BrandLogo({ size = 40 }: { size?: number }) {
  const cropWidth = Math.round((size / 40) * 130);
  return (
    <span
      aria-label="CodeMentor"
      className="relative block shrink-0 overflow-hidden"
      style={{ height: size, width: size }}
    >
      <Image
        alt="CodeMentor"
        className="absolute left-0 top-0 h-auto max-w-none"
        height={159}
        priority
        src="/logo.png"
        style={{ width: cropWidth }}
        width={460}
      />
    </span>
  );
}
