import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: "border border-primary bg-primary text-primary-foreground hover:opacity-90",
  outline: "border bg-background text-foreground hover:bg-muted",
  ghost: "border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
};

export function Button({ className = "", type = "button", variant = "default", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      type={type}
      {...props}
    />
  );
}
