import { ReactNode } from "react";

type Tone = "neutral" | "navy" | "primary" | "accent" | "success" | "danger" | "ai";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-border-soft text-text",
  navy: "bg-navy text-white",
  primary: "bg-primary text-white",
  accent: "bg-accent-tint text-accent",
  success: "bg-success-tint text-success",
  danger: "bg-danger-tint text-danger",
  ai: "bg-ai-tint text-ai",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export type Difficulty = "Cơ bản" | "Trung bình" | "Nâng cao";

const difficultyTone: Record<Difficulty, Tone> = {
  "Cơ bản": "neutral",
  "Trung bình": "primary",
  "Nâng cao": "navy",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <Badge tone={difficultyTone[difficulty]}>{difficulty}</Badge>;
}
