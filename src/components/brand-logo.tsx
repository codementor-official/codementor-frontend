import Image from "next/image";

type BrandLogoProps = {
  compact?: boolean;
  size?: "sm" | "md";
  priority?: boolean;
};

export function BrandLogo({ compact = false, size = "md", priority = false }: BrandLogoProps) {
  if (compact) {
    return <span className="relative block h-10 w-10 overflow-hidden" aria-label="CodeMentor">
      <Image src="/logo.png" alt="CodeMentor" width={460} height={159} priority={priority} className="absolute top-0 left-0 h-auto w-[130px] max-w-none" />
    </span>;
  }

  const dimensions = size === "sm" ? "h-9 w-[150px]" : "h-12 w-[188px]";
  const imageWidth = size === "sm" ? "w-[150px]" : "w-[188px]";

  return <span className={`relative block overflow-hidden ${dimensions}`} aria-label="CodeMentor">
    <Image src="/logo.png" alt="CodeMentor" width={460} height={159} priority={priority} className={`absolute top-0 left-0 h-auto max-w-none ${imageWidth}`} />
  </span>;
}
