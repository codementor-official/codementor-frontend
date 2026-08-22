import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: "border border-primary bg-primary text-primary-foreground hover:opacity-90",
  outline: "border bg-background text-foreground hover:bg-muted",
  ghost: "border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
  // Xoá là thao tác không lùi lại được. Nó từng mang biến thể `ghost` — trông y hệt một
  // liên kết phụ, nằm lẫn giữa các nút khác.
  danger:
    "border border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-2.5 text-xs",
  md: "h-9 px-3 text-sm",
};

/**
 * Các class mà `Button` vẽ ra, dùng lại cho chỗ hiếm hoi cần TRÔNG GIỐNG một nút mà không
 * PHẢI là một `<button>` — ví dụ `<Link>` điều hướng sang trang khác. Luôn khớp với `Button`
 * vì `Button` gọi thẳng hàm này, không phải hai bảng class riêng dễ trôi dần.
 */
export function buttonClassName(
  variant: ButtonVariant = "default",
  size: ButtonSize = "md",
  className = "",
): string {
  return `inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
}

export function Button({
  className = "",
  type = "button",
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  return <button className={buttonClassName(variant, size, className)} type={type} {...props} />;
}
