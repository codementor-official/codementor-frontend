"use client";

import Link from "next/link";
import { BookOpen, Braces, Route } from "lucide-react";
import { PageHeader } from "@/components/page/page-header";
import { useAuth } from "@/providers/auth-provider";

/**
 * Deliberately not a metrics wall. There is nothing to count until a lecturer owns
 * content, and a dashboard full of zeroes teaches people to skip the page.
 */
const shortcuts = [
  { href: "/roadmaps", icon: Route, label: "Lộ trình" },
  { href: "/courses", icon: BookOpen, label: "Khóa học" },
  { href: "/exercises", icon: Braces, label: "Bài code" },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader
        description={`Đăng nhập với ${user?.email ?? ""}.`}
        title={`Chào ${user?.displayName ?? ""}`}
      />

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map(({ href, icon: Icon, label }) => (
          <li key={href}>
            <Link
              className="flex h-20 flex-col justify-center gap-2 rounded-xl border bg-card px-4 text-card-foreground transition-colors hover:bg-muted"
              href={href}
            >
              <Icon aria-hidden="true" className="size-4 text-muted-foreground" strokeWidth={1.8} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
