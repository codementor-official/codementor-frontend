import { Separator } from "react-resizable-panels";

export function ResizeHandle({ orientation }: { orientation: "horizontal" | "vertical" }) {
  const isRow = orientation === "horizontal";
  return (
    <Separator
      className={`relative shrink-0 bg-border transition-colors hover:bg-primary ${
        isRow ? "w-px cursor-col-resize" : "h-px cursor-row-resize"
      }`}
    >
      <span
        className={`absolute bg-transparent ${
          isRow ? "top-0 bottom-0 -left-1.5 w-4" : "right-0 left-0 -top-1.5 h-4"
        }`}
      />
    </Separator>
  );
}
