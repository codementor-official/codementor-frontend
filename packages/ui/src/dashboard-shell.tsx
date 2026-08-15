import type { ReactNode } from "react";

export interface DashboardShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export function DashboardShell({ eyebrow, title, description, children }: DashboardShellProps) {
  return (
    <main className="cm-dashboard-shell">
      <section className="cm-dashboard-card" aria-labelledby="dashboard-title">
        <p className="cm-dashboard-eyebrow">{eyebrow}</p>
        <h1 id="dashboard-title">{title}</h1>
        <p>{description}</p>
        {children}
      </section>
    </main>
  );
}
