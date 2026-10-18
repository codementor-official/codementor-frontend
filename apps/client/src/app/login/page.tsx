import { AuthCard } from "@/components/auth-card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; handoff?: string; until?: string }>;
}) {
  // `reason=suspended`: vừa bị đăng xuất vì tài khoản bị khoá giữa phiên.
  // `handoff=failed`: admin bấm "Mở nội dung" nhưng chuyển phiên hỏng — đăng nhập tay rồi về `next`.
  // `until`: ISO lúc mở khoá, "none" = không thời hạn; giá trị lạ coi như chưa biết.
  const { reason, handoff, until } = await searchParams;
  const suspendedUntil = until === "none" ? null : until && !Number.isNaN(Date.parse(until)) ? until : undefined;
  return (
    <AuthCard
      mode="login"
      suspended={reason === "suspended"}
      suspendedUntil={suspendedUntil}
      handoffFailed={handoff === "failed"}
    />
  );
}
