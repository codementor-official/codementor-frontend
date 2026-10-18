import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string; until?: string }> }) {
  // `reason=suspended`: vừa bị đăng xuất vì tài khoản bị khoá giữa phiên. `until`: ISO lúc mở
  // khoá, "none" = không thời hạn; giá trị lạ coi như chưa biết.
  const { reason, until } = await searchParams;
  const suspendedUntil = until === "none" ? null : until && !Number.isNaN(Date.parse(until)) ? until : undefined;
  return <LoginForm suspended={reason === "suspended"} suspendedUntil={suspendedUntil} />;
}
