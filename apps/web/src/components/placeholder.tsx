export function Placeholder({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-dashed border-border bg-bg p-4 text-sm text-text-faint ${className}`}
    >
      {label}
    </div>
  );
}
