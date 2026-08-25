"use client";

import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Backwards-compatible trigger used by Explore and Roadmap cards. Personalization now
 * has one canonical editor inside Profile, so these entry points navigate there instead
 * of opening another localStorage-backed form.
 */
export function PersonalizationSettingsTrigger({
  label = "Thiết lập gợi ý cá nhân hóa",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <Button href="/profile?tab=personalization" variant="outline" size="sm" className={className}>
      <Settings2 className="h-3.5 w-3.5" /> {label}
    </Button>
  );
}
