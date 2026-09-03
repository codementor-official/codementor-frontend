"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CatalogueError } from "@/components/ui/catalogue-state";

export function RecommendationNotice({ personalized }: { personalized: boolean }) {
  return <p className="mb-3 text-xs text-text-muted">
    {personalized
      ? "Xếp theo sở thích và tiến độ học tập đã lưu của bạn."
      : "Đang xếp theo mức phổ biến, không dùng hồ sơ cá nhân để chấm điểm."}{" "}
    <Link href="/profile?tab=personalization" className="font-semibold text-primary hover:underline">Điều chỉnh cá nhân hóa</Link>
  </p>;
}

export function RecommendationError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="space-y-3"><CatalogueError message={message} /><Button size="sm" variant="outline" onClick={onRetry}>Thử lại đề xuất</Button></div>;
}
