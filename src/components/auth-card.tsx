import Link from "next/link";

export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 p-8 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-bold text-zinc-900">
          {mode === "login" ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
        </h1>

        <div className="mb-6 flex justify-center gap-6 border-b border-zinc-200 text-sm font-medium">
          <Link
            href="/login"
            className={`border-b-2 pb-3 ${mode === "login" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500"}`}
          >
            Đăng nhập
          </Link>
          <Link
            href="/signup"
            className={`border-b-2 pb-3 ${mode === "signup" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500"}`}
          >
            Đăng ký
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Email"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
          {mode === "signup" && (
            <input
              type="password"
              placeholder="Xác nhận mật khẩu"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          )}
          <button className="rounded-lg bg-orange-600 py-2 text-sm font-semibold text-white">
            {mode === "login" ? "Đăng nhập" : "Đăng ký"}
          </button>
        </div>
      </div>
    </div>
  );
}
