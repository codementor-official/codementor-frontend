import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function DashboardSection({ title, description, href, action = 'Xem tất cả', children }: {
  title: string; description?: string; href?: string; action?: string; children: ReactNode;
}) {
  return <section className="min-w-0">
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-base font-bold text-navy">{title}</h2>
      {href && <Link href={href} className="text-xs font-semibold text-primary hover:underline">{action} →</Link>}
    </div>
    {description && <p className="mb-3 text-xs text-text-muted">{description}</p>}
    {children}
  </section>;
}

export function DashboardEmpty({ text, href, action }: { text: string; href?: string; action?: string }) {
  return <Card className="border-dashed p-6 text-center">
    <p className="text-sm text-text-muted">{text}</p>
    {href && <Button href={href} size="sm" variant="outline" className="mt-3">{action ?? 'Khám phá'}</Button>}
  </Card>;
}

export function DashboardUnavailable({ onRetry }: { onRetry: () => void }) {
  return <Card className="border-dashed p-5" role="status"><p className="text-sm text-text-muted">Phần này chưa tải được. Bạn vẫn có thể sử dụng các phần còn lại.</p><Button size="sm" variant="outline" className="mt-3" onClick={onRetry}>Thử lại</Button></Card>;
}
