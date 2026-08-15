import { Separator } from "react-resizable-panels";

/* Three distinct values so the divider never reads as a continuation of a scrollbar that
 * happens to run alongside it: the scrollbar thumb is --color-border, this track is the
 * fainter --color-border-soft, and the grip is the stronger --color-text-faint. */
export function ResizeHandle({ orientation }: { orientation: "horizontal" | "vertical" }) {
  const isRow = orientation === "horizontal";
  return (
    <Separator
      className={`group relative shrink-0 bg-border-soft transition-colors ${
        isRow ? "w-2 cursor-col-resize" : "h-2 cursor-row-resize"
      }`}
    >
      <span className={`absolute ${isRow ? "top-0 bottom-0 -left-1.5 w-4" : "-top-1.5 right-0 left-0 h-4"}`} />
      <span
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text-faint transition-colors group-hover:bg-primary ${
          isRow ? "h-9 w-0.5" : "h-0.5 w-9"
        }`}
      />
    </Separator>
  );
}
