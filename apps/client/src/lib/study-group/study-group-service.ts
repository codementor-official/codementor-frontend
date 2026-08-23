/** Initials from a person's name — Vietnamese names put the given name last, so the
 * last two words are the meaningful ones ("Nguyễn Trần Gia Sĩ" -> "GS"). */
export function initialsFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (
    words
      .slice(-2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}
