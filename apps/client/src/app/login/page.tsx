import { AuthCard } from "@/components/auth-card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; handoff?: string }>;
}) {
  // `reason=suspended`: vừa bị đăng xuất vì tài khoản bị khoá giữa phiên.
  // `handoff=failed`: admin bấm "Mở nội dung" nhưng chuyển phiên hỏng — đăng nhập tay rồi về `next`.
  const { reason, handoff } = await searchParams;
  return <AuthCard mode="login" suspended={reason === "suspended"} handoffFailed={handoff === "failed"} />;
}
