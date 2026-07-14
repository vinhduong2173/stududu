"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Ghi nhớ đăng nhập — tự điền email + mật khẩu lần sau
  React.useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");
    if (savedEmail) {
      setEmail(savedEmail);
      setPassword(savedPassword ?? "");
      setRemember(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api<{ user: any; tokens: { accessToken: string; refreshToken: string } }>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      localStorage.setItem("accessToken", res.tokens.accessToken);
      localStorage.setItem("refreshToken", res.tokens.refreshToken);
      if (remember) {
        localStorage.setItem("rememberedEmail", email);
        localStorage.setItem("rememberedPassword", password);
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
      }
      // Chưa khai ngôn ngữ → vào onboarding; còn lại vào Khám phá
      const me = await api<{ languages: unknown[] }>("/users/me", { token: res.tokens.accessToken });
      router.push(me.languages.length === 0 ? "/onboarding" : "/discover");
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Đăng nhập</h1>
          <p className="mt-2 text-sm text-muted">Chào mừng bạn trở lại stududu</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-error/10 p-4 text-sm text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <Input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          
          <div className="flex flex-col gap-2">
            <Input
              type="password"
              placeholder="Mật khẩu"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="accent-primary h-4 w-4"
                />
                Ghi nhớ đăng nhập
              </label>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-muted">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
