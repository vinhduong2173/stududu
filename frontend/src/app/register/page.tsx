"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const res = await api<{ user: any; tokens: { accessToken: string; refreshToken: string } }>("/auth/register", {
        method: "POST",
        body: { email, password, displayName },
      });
      localStorage.setItem("accessToken", res.tokens.accessToken);
      localStorage.setItem("refreshToken", res.tokens.refreshToken);
      router.push("/onboarding");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Cột minh hoạ (chỉ hiện trên desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-secondary p-12 text-white flex-col justify-center">
        <h1 className="text-5xl font-bold mb-6">Luyện nói với người bản xứ thật.</h1>
        <p className="text-xl opacity-90">Bạn dạy tiếng của bạn, họ dạy lại tiếng bạn đang học.</p>
      </div>

      {/* Cột form đăng ký */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Tạo tài khoản</h1>
            <p className="mt-2 text-muted">Bắt đầu hành trình ngôn ngữ của bạn</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-error/10 p-4 text-sm text-error">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            <Input
              type="text"
              placeholder="Tên hiển thị"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            
            <Input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <div className="flex flex-col gap-1.5">
              <Input
                type="password"
                placeholder="Mật khẩu"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="text-xs text-muted ml-1">Tối thiểu 8 ký tự</span>
            </div>

            <Button type="submit" disabled={loading} className="mt-2 text-base">
              {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
            </Button>
          </form>

          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted">hoặc</span>
            </div>
          </div>

          <Button variant="ghost" disabled className="mt-8 w-full">
            Tiếp tục với Google (Sắp ra mắt)
          </Button>

          <div className="mt-8 text-center text-sm text-muted">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
