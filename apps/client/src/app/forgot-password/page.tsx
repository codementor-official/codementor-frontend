import type { Metadata } from "next";
import { ForgotPasswordCard } from "@/features/auth/password-reset";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return <ForgotPasswordCard initialEmail={email?.slice(0, 254) ?? ""} />;
}
