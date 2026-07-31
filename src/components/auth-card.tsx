"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, GraduationCap, Lock, Mail } from "lucide-react";

export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-1 items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-card">
        <h1 className="mb-6 text-center text-xl font-bold text-navy">
          {mode === "login" ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
        </h1>

        <div className="mb-6 flex justify-center gap-6 border-b border-border text-sm font-medium">
          <Link
            href="/login"
            className={`border-b-2 pb-3 ${
              mode === "login" ? "border-navy text-navy" : "border-transparent text-text-muted"
            }`}
          >
            Đăng nhập
          </Link>
          <Link
            href="/signup"
            className={`border-b-2 pb-3 ${
              mode === "signup" ? "border-navy text-navy" : "border-transparent text-text-muted"
            }`}
          >
            Đăng ký
          </Link>
        </div>

        <div className="mb-5 flex flex-col gap-2.5">
          <button className="flex items-center gap-2.5 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-navy">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-tint text-[11px] font-bold text-accent">
              G
            </span>
            {mode === "login" ? "Đăng nhập với Google" : "Đăng ký với Google"}
          </button>
          {mode === "login" && (
            <button className="flex items-center gap-2.5 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-navy">
              <GraduationCap className="h-4.5 w-4.5 text-text-muted" />
              Đăng nhập với email trường
            </button>
          )}
        </div>

        <div className="mb-5 flex items-center gap-2.5 text-xs font-medium text-text-faint">
          <div className="h-px flex-1 bg-border" />
          hoặc
          <div className="h-px flex-1 bg-border" />
        </div>

        <form className="flex flex-col gap-3.5">
          {mode === "signup" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">
                Họ và tên
              </label>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                className="w-full rounded-full border border-border px-3.5 py-2.5 text-sm outline-none focus:border-navy"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Email</label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-text-faint" />
              <input
                type="text"
                placeholder="ban@student.iuh.edu.vn"
                className="w-full rounded-full border border-border py-2.5 pr-3.5 pl-10 text-sm outline-none focus:border-navy"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-text-faint" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full rounded-full border border-border py-2.5 pr-10 pl-10 text-sm outline-none focus:border-navy"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute top-1/2 right-3.5 -translate-y-1/2 text-text-faint"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-text-faint" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full rounded-full border border-border py-2.5 pr-3.5 pl-10 text-sm outline-none focus:border-navy"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="mt-1.5 rounded-full bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            {mode === "login" ? "Đăng nhập" : "Đăng ký"}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-text-muted">
          {mode === "login" ? (
            <>
              Chưa có tài khoản?{" "}
              <Link href="/signup" className="font-semibold text-primary">
                Đăng ký
              </Link>
            </>
          ) : (
            <>
              Đã có tài khoản?{" "}
              <Link href="/login" className="font-semibold text-primary">
                Đăng nhập
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
