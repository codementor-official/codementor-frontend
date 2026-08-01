"use client";

import { X } from "lucide-react";
import { RoadmapCard } from "./roadmap-card";
import type { RankedRoadmap } from "@/types/roadmap";

export function RoadmapQuickListModal({
  title,
  description,
  roadmaps,
  onClose,
}: {
  title: string;
  description: string;
  roadmaps: RankedRoadmap[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/55 p-6" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-surface p-6 shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-navy">{title}</h2>
            <p className="text-xs text-text-faint">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="shrink-0 rounded-md p-1.5 hover:bg-bg"
          >
            <X className="h-4 w-4 text-text-muted" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roadmaps.map((r) => (
            <RoadmapCard key={r.id} roadmap={r} />
          ))}
        </div>
      </div>
    </div>
  );
}
