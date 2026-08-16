import Image from "next/image";

type BrandLogoProps = {
  compact?: boolean;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
};

/**
 * Nguồn ảnh là 460×159. `sm`/`md` cố tình cắt bớt đáy để giấu dòng tagline khi logo
 * đứng trong thanh bên chật chội; `lg` giữ đúng tỉ lệ 460:159 nên hiện trọn logo —
 * dùng cho trang đăng nhập/đăng ký, nơi logo là mỏ neo thị giác chứ không phải chi tiết
 * trang trí. Đổi chiều rộng thì phải đổi chiều cao theo, nếu không logo lại bị cắt.
 */
const SIZES = {
  sm: { box: "h-9 w-[150px]", image: "w-[150px]" },
  md: { box: "h-12 w-[188px]", image: "w-[188px]" },
  lg: { box: "h-[76px] w-[220px]", image: "w-[220px]" },
} as const;

export function BrandLogo({ compact = false, size = "md", priority = false }: BrandLogoProps) {
  if (compact) {
    return <span className="relative block h-10 w-10 overflow-hidden" aria-label="CodeMentor">
      <Image src="/logo.png" alt="CodeMentor" width={460} height={159} priority={priority} className="absolute top-0 left-0 h-auto w-[130px] max-w-none" />
    </span>;
  }

  const { box, image } = SIZES[size];

  return <span className={`relative block overflow-hidden ${box}`} aria-label="CodeMentor">
    <Image src="/logo.png" alt="CodeMentor" width={460} height={159} priority={priority} className={`absolute top-0 left-0 h-auto max-w-none ${image}`} />
  </span>;
}
