"use client";

import { useState } from "react";
import { BookOpenIcon as BookOpen } from "@phosphor-icons/react/ssr";

export function CourseCover({
  src,
  title,
  className = "size-11",
}: {
  src?: string | null;
  title: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground ${className}`}
    >
      {src && !failed ? (
        // Remote object-storage URLs are resolved at runtime, so Next/Image cannot know
        // their host list at build time. The error fallback keeps old records usable.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={`Ảnh bìa ${title}`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
          src={src}
        />
      ) : (
        <BookOpen aria-hidden="true" className="size-[42%]" />
      )}
    </span>
  );
}
