"use client";

import type { CSSProperties, ReactNode } from "react";
import { DragOverlay, useDndContext } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * The three pieces a drag needs to be readable, shared by the curriculum tree and the
 * roadmap course picker.
 *
 * `@dnd-kit` moves items but draws nothing: on its own you get a half-faded row and no
 * clue where a drop will land. What was missing is a line at the target edge, a copy of
 * the row under the cursor, and a visible state on an empty container.
 *
 * Lives here rather than in @codementor/ui because lecturer is the only application that
 * drags anything — putting it in the package would make web and admin carry three
 * @dnd-kit dependencies to render nothing.
 */

/** Where the dragged row would land relative to the row being hovered. */
export type DropEdge = "top" | "bottom" | null;

export function useSortableRow({
  id,
  data,
  disabled,
}: {
  id: string;
  /** Travels with the drag — the tree uses it to know which chapter a lesson came from. */
  data?: Record<string, unknown>;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    activeIndex,
    overIndex,
  } = useSortable({ id, data, disabled });

  // `activeIndex` is -1 when the dragged item belongs to a different SortableContext —
  // a lesson being pulled into another chapter. There is no "before or after" to compute
  // then, so the line goes above the row the cursor is on.
  const dropEdge: DropEdge = !isOver || isDragging
    ? null
    : activeIndex === -1 || overIndex <= activeIndex
      ? "top"
      : "bottom";

  return {
    ref: setNodeRef,
    style: { transform: CSS.Transform.toString(transform), transition } as CSSProperties,
    handleProps: { ...attributes, ...listeners },
    isDragging,
    dropEdge,
    /** Faded and outlined, so the row reads as "in flight" rather than merely dimmed. */
    className: isDragging ? "opacity-40 outline-1 outline-dashed outline-border" : "",
  };
}

/** The 2px line marking the exact slot a drop will fill. */
export function DropIndicator({ edge }: { edge: DropEdge }) {
  if (!edge) return null;
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 z-10 h-0.5 rounded-full bg-primary ${
        edge === "top" ? "-top-px" : "-bottom-px"
      }`}
    />
  );
}

/**
 * A copy of the row that follows the cursor. Rendered through a portal by `@dnd-kit`, so
 * it escapes the scroll container and any `overflow: hidden` on the way up.
 */
export function SortableOverlay({ children }: { children: (activeId: string) => ReactNode }) {
  const { active } = useDndContext();
  return (
    <DragOverlay dropAnimation={{ duration: 160, easing: "cubic-bezier(0.4, 0, 0.2, 1)" }}>
      {active ? (
        <div className="rounded-md border border-primary bg-card shadow-[0_12px_32px_rgba(0,0,0,0.28)]">
          {children(String(active.id))}
        </div>
      ) : null}
    </DragOverlay>
  );
}

/** Container highlight while a drop into it is possible — used by an empty chapter. */
export function dropZoneClasses(isOver: boolean): string {
  return isOver
    ? "border-primary bg-primary/5 border-dashed"
    : "border-transparent";
}
