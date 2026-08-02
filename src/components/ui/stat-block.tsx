export function StatBlock({
  value,
  label,
  tone = "default",
  className = "",
}: {
  value: string;
  label: string;
  tone?: "default" | "onDark";
  className?: string;
}) {
  return (
    <div className={className}>
      <div className={`text-2xl font-bold ${tone === "onDark" ? "text-primary" : "text-navy"}`}>{value}</div>
      <div className={`text-xs ${tone === "onDark" ? "text-zinc-400" : "text-text-muted"}`}>{label}</div>
    </div>
  );
}
