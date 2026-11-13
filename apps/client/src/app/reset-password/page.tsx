import type { Metadata } from "next";
import { ResetPasswordCard } from "@/features/auth/password-reset";

// The token is in the URL: never send it on as a Referer.
export const metadata: Metadata = { title: "Đặt mật khẩu mới", referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <ResetPasswordCard token={token?.slice(0, 200) ?? ""} />;
}
