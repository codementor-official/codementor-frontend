/* Two-letter initials need the circle wide enough that the neighbour's overlap
 * doesn't clip the second letter — hence 28px minimum, not 24px. */
const sizeClasses = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-8 w-8 text-2xs",
} as const;

export interface AvatarGroupItem {
  id: string;
  /** Two-letter initials — the mock has no photos, so initials are the avatar. */
  initials: string;
  name: string;
}

/**
 * Overlapping avatar stack with a "+N" overflow chip, in the shape shadcn's
 * AvatarGroup uses. The ring is what separates neighbours, so it must match the
 * surface the group sits on.
 */
export function AvatarGroup({
  items,
  total,
  max = 4,
  size = "md",
  ringClassName = "ring-surface",
}: {
  items: AvatarGroupItem[];
  /** Full member count; anything past `max` becomes the overflow chip. */
  total: number;
  max?: number;
  size?: keyof typeof sizeClasses;
  /** Match the card/row background so the overlap reads as separation, not a halo. */
  ringClassName?: string;
}) {
  const shown = items.slice(0, max);
  const overflow = total - shown.length;

  return (
    <div className="flex items-center -space-x-1">
      {shown.map((item) => (
        <span
          key={item.id}
          title={item.name}
          className={`flex shrink-0 items-center justify-center rounded-full bg-navy font-semibold text-white ring-2 ${sizeClasses[size]} ${ringClassName}`}
        >
          {item.initials}
        </span>
      ))}
      {overflow > 0 && (
        <span
          className={`flex shrink-0 items-center justify-center rounded-full bg-border-soft font-semibold text-text-muted ring-2 ${sizeClasses[size]} ${ringClassName}`}
        >
          {/* "99+" past the cap, so a large group doesn't read as exactly 99 more. */}
          {overflow > 99 ? "99+" : `+${overflow}`}
        </span>
      )}
    </div>
  );
}
