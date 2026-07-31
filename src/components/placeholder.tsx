export function Placeholder({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-400 ${className}`}
    >
      {label}
    </div>
  );
}
