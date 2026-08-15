import { InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  rightSlot?: ReactNode;
  containerClassName?: string;
}

export function Input({
  icon,
  rightSlot,
  containerClassName = "",
  className = "",
  ...props
}: InputProps) {
  return (
    <div className={`relative ${containerClassName}`}>
      {icon && (
        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-text-faint [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
      )}
      <input
        className={`w-full rounded-md border border-border bg-surface py-2.5 text-sm text-navy outline-none placeholder:text-text-faint focus:border-navy ${icon ? "pl-9" : "pl-3.5"} ${rightSlot ? "pr-9" : "pr-3.5"} ${className}`}
        {...props}
      />
      {rightSlot && (
        <span className="absolute top-1/2 right-3 -translate-y-1/2 text-text-faint">
          {rightSlot}
        </span>
      )}
    </div>
  );
}
