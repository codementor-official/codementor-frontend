"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StackIcon from "tech-stack-icons";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-1 items-center justify-center bg-bg p-5">
      <Card className="w-full max-w-sm p-7">
        <h1 className="mb-5 text-center text-xl font-bold text-navy">
          {mode === "login" ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
        </h1>

        <div className="mb-5 flex justify-center gap-6 border-b border-border text-sm font-medium">
          <Link
            href="/login"
            className={`border-b-2 pb-2.5 ${
              mode === "login" ? "border-navy text-navy" : "border-transparent text-text-muted"
            }`}
          >
            Đăng nhập
          </Link>
          <Link
            href="/signup"
            className={`border-b-2 pb-2.5 ${
              mode === "signup" ? "border-navy text-navy" : "border-transparent text-text-muted"
            }`}
          >
            Đăng ký
          </Link>
        </div>

        <div className="mb-4 flex flex-col gap-2">
          <Button variant="outline" className="w-full justify-start">
            <span className="h-5 w-5 shrink-0">
              <StackIcon name="google" />
            </span>
            {mode === "login" ? "Đăng nhập với Google" : "Đăng ký với Google"}
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <span className="h-5 w-5 shrink-0">
              <StackIcon name="github" />
            </span>
            {mode === "login" ? "Đăng nhập với GitHub" : "Đăng ký với GitHub"}
          </Button>
        </div>

        <div className="mb-4 flex items-center gap-2.5 text-xs font-medium text-text-faint">
          <div className="h-px flex-1 bg-border" />
          hoặc
          <div className="h-px flex-1 bg-border" />
        </div>

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            router.push("/dashboard");
          }}
        >
          {mode === "signup" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">
                Họ và tên
              </label>
              <Input type="text" placeholder="Nguyễn Văn A" />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Email</label>
            <Input
              type="text"
              placeholder="ban@student.iuh.edu.vn"
              icon={<Mail />}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Mật khẩu</label>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              icon={<Lock />}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">
                Xác nhận mật khẩu
              </label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                icon={<Lock />}
              />
            </div>
          )}

          <Button type="submit" className="mt-1 w-full">
            {mode === "login" ? "Đăng nhập" : "Đăng ký"}
          </Button>
        </form>

        <div className="mt-4 text-center text-xs text-text-muted">
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
      </Card>
    </div>
  );
}
