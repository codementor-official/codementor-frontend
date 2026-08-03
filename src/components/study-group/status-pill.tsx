/**
 * One pill, two halves, one colour. Work status on the left, review outcome on the
 * right, split by a hairline — replaces two independently-coloured badges that made
 * every row look like a traffic light.
 */
export function SplitStatusPill({ left, right }: { left: string; right: string }) {
  return (
    <span className="inline-flex shrink-0 items-center overflow-hidden rounded-sm border border-border bg-bg text-xs font-semibold whitespace-nowrap text-navy">
      <span className="px-2.5 py-1">{left}</span>
      <span aria-hidden className="h-5 w-px bg-border" />
      <span className="px-2.5 py-1 text-text-muted">{right}</span>
    </span>
  );
}
