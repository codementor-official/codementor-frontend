"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, Eye, EyeOff, Sparkles } from "lucide-react";
import { Button, Input } from "@codementor/ui";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/providers/auth-provider";

export default function LoginPage() {
  const { status, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await signIn(email, password);
      router.replace("/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Đăng nhập thất bại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-5 sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{
        backgroundImage: "radial-gradient(circle at 12% 10%, color-mix(in srgb, var(--primary) 9%, transparent), transparent 34rem), radial-gradient(circle at 90% 90%, color-mix(in srgb, var(--foreground) 5%, transparent), transparent 30rem)",
      }} />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border bg-card shadow-xl lg:grid-cols-[1fr_1fr]">
        <div className="hidden min-h-[570px] flex-col justify-between bg-primary/5 p-10 lg:flex">
          <div className="flex items-center gap-3"><BrandLogo size={42} /><span className="text-lg font-bold">CodeMentor Lecturer</span></div>
          <div>
            <div className="mb-7 flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><BookOpenCheck className="size-8" aria-hidden="true" /></div>
            <h2 className="max-w-sm text-3xl font-bold tracking-tight">Nơi ý tưởng trở thành bài học.</h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">Soạn khóa học, xây dựng bài tập và đồng hành cùng học viên trong một không gian làm việc liền mạch.</p>
          </div>
          <p className="text-xs text-muted-foreground">Dành cho giảng viên và quản trị viên CodeMentor.</p>
        </div>
        <div className="flex min-h-[570px] flex-col justify-center p-7 sm:p-12">
          <div className="mb-9 lg:hidden"><BrandLogo size={42} /></div>
          <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-primary"><Sparkles className="size-3.5" /> Không gian giảng viên</span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Chào mừng trở lại</h1>
          <p className="mt-2 text-sm text-muted-foreground">Đăng nhập bằng tài khoản CodeMentor được cấp quyền Giảng viên.</p>
          <form className="mt-8 space-y-5" onSubmit={(event) => void submit(event)}>
            <div className="space-y-2"><label className="text-sm font-medium" htmlFor="lecturer-email">Email hoặc tên đăng nhập</label><Input id="lecturer-email" autoComplete="username" autoFocus placeholder="codementor@gmail.com" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={pending} /></div>
            <div className="space-y-2"><label className="text-sm font-medium" htmlFor="lecturer-password">Mật khẩu</label><Input id="lecturer-password" autoComplete="current-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required disabled={pending} rightSlot={<button type="button" className="text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>} /></div>
            {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <Button className="w-full" type="submit" disabled={status === "loading" || pending}>{pending ? "Đang đăng nhập…" : "Vào trang giảng viên"}</Button>
          </form>
          <p className="mt-8 text-center text-xs leading-5 text-muted-foreground">Phiên đăng nhập được bảo vệ; mật khẩu không được lưu trên trình duyệt.</p>
        </div>
      </div>
    </main>
  );
}
