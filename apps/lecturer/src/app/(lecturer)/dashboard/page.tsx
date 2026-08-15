"use client";

import { Button } from "@codementor/ui";
import { useAuth } from "@/providers/auth-provider";

export default function DashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <main className="min-h-screen bg-background p-6">
      <h1 className="text-xl font-semibold">Bảng điều khiển</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Đăng nhập với {user?.email} — vai trò {user?.role}.
      </p>
      <Button className="mt-5" onClick={signOut} type="button" variant="outline">
        Đăng xuất
      </Button>
    </main>
  );
}
