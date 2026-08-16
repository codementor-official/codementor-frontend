/**
 * Turns a Vietnamese `DD/MM/YYYY HH:mm` timestamp into a string that sorts chronologically.
 *
 * Sorting the display string directly is wrong: "31/07/2026" compares above "02/08/2026"
 * because the day leads. Reversing the parts to `YYYY-MM-DD HH:mm` makes lexicographic
 * order match chronological order without constructing a Date per comparison.
 */
export function sortableDate(display: string): string {
  const [date, time = "00:00"] = display.trim().split(" ");
  const [day, month, year] = date.split("/");
  if (!day || !month || !year) return display;
  return `${year}-${month}-${day} ${time}`;
}
