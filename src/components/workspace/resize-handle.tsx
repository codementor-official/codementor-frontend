import { Separator } from "react-resizable-panels";

export function ResizeHandle({ orientation }: { orientation: "horizontal" | "vertical" }) {
  const isRow = orientation === "horizontal";
  return (
    <Separator
      className={`group relative shrink-0 bg-border transition-colors ${
        isRow ? "w-2 cursor-col-resize" : "h-2 cursor-row-resize"
      }`}
    >
      <span className={`absolute ${isRow ? "top-0 bottom-0 -left-1.5 w-4" : "-top-1.5 right-0 left-0 h-4"}`} />
      <span
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-400 transition-colors group-hover:bg-primary ${
          isRow ? "h-9 w-0.5" : "h-0.5 w-9"
        }`}
      />
    </Separator>
  );
}
