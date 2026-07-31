import { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import Link from "next/link";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md";

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  outline: "border border-border bg-surface text-navy hover:bg-bg",
  ghost: "text-navy hover:bg-bg",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
};

function buttonClasses(variant: Variant, size: Size, className: string) {
  return `inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: undefined;
}

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  href: string;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  href,
  ...props
}: ButtonProps | ButtonLinkProps) {
  if (href) {
    return (
      <Link
        href={href}
        className={buttonClasses(variant, size, className)}
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
      />
    );
  }
  return (
    <button
      className={buttonClasses(variant, size, className)}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    />
  );
}
