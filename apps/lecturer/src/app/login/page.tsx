import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  // `reason=suspended`: vừa bị đăng xuất vì tài khoản bị khoá giữa phiên.
  const { reason } = await searchParams;
  return <LoginForm suspended={reason === "suspended"} />;
}
