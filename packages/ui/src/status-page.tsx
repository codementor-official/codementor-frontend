import type { ReactNode } from "react";

/**
 * Full-screen 404 / error page shared by all three applications. Without it Next falls back
 * to its own English "404: This page could not be found." and a blank screen on a crash.
 */
export function StatusPage({
  code,
  title,
  description,
  children,
}: {
  code: string;
  title: string;
  description: string;
  /** Actions: a link home, a retry button. */
  children?: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background p-6 text-center text-foreground">
      <p className="font-mono text-sm font-semibold text-primary">{code}</p>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {children && <div className="mt-3 flex flex-wrap justify-center gap-2">{children}</div>}
    </main>
  );
}
