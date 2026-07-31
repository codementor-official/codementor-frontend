import { Separator } from "react-resizable-panels";
import { GripHorizontal, GripVertical } from "lucide-react";

export function ResizeHandle({ orientation }: { orientation: "horizontal" | "vertical" }) {
  const isRow = orientation === "horizontal";
  return (
    <Separator
      className={`group relative flex shrink-0 items-center justify-center bg-border-soft transition-colors hover:bg-primary/20 ${
        isRow ? "w-1.5 cursor-col-resize" : "h-1.5 cursor-row-resize"
      }`}
    >
      <span
        className={`flex items-center justify-center rounded-sm bg-border text-text-faint transition-colors group-hover:bg-primary group-hover:text-white ${
          isRow ? "h-9 w-3.5" : "h-3.5 w-9"
        }`}
      >
        {isRow ? <GripVertical className="h-3 w-3" /> : <GripHorizontal className="h-3 w-3" />}
      </span>
    </Separator>
  );
}
