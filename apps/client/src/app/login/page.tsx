import { AuthCard } from "@/components/auth-card";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  // `reason=suspended`: vừa bị đăng xuất vì tài khoản bị khoá giữa phiên.
  const { reason } = await searchParams;
  return <AuthCard mode="login" suspended={reason === "suspended"} />;
}
