import { SparkleIcon as Sparkles } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** Stands in for a paid group tool. Only the owner is pointed at the plans; they are the one who pays. */
export function FeatureLockedCard({ title, body, owner }: { title: string; body: string; owner: boolean }) {
  return (
    <Card className="flex flex-col items-center gap-3 border-dashed p-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-border-soft">
        <Sparkles className="h-5 w-5 text-text-muted" aria-hidden />
      </span>
      <div>
        <h2 className="text-sm font-bold text-navy">{title}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-text-muted">{body}</p>
      </div>
      {owner ? (
        <Button size="sm" href="/workspace/pricing">
          Xem các gói từ Plus
        </Button>
      ) : (
        <p className="text-xs text-text-faint">Chủ nhóm nâng cấp gói để mở tính năng này cho cả nhóm.</p>
      )}
    </Card>
  );
}
