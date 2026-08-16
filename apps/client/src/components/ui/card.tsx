import { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds hover/focus affordance for cards that are themselves clickable (e.g. wrapped in a Link). */
  interactive?: boolean;
}

export function Card({ className = "", interactive = false, ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-surface shadow-card ${
        interactive ? "transition-colors hover:border-navy/20" : ""
      } ${className}`}
      {...props}
    />
  );
}
