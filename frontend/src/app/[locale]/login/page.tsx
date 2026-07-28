"use client";

import * as React from "react";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";

export default function LoginPage() {
  const t = useTranslations();
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

  const handleGoogleClick = () => {
    alert(t("login.google_notice"));
  };

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
      const me = await api<{ languages: unknown[], role: string }>("/users/me", { token: res.tokens.accessToken });
      if (me.role === 'admin') {
        router.push("/admin");
      } else {
        router.push(me.languages.length === 0 ? "/onboarding" : "/discover");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t("common.error_generic"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">{t("login.title")}</h1>
          <p className="mt-2 text-sm text-muted">{t("login.welcome")}</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-error/10 p-4 text-sm text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <Input
            type="email"
            placeholder={t("login.email")}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          
          <div className="flex flex-col gap-2">
            <Input
              type="password"
              placeholder={t("login.password")}
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
                {t("login.remember")}
              </label>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                {t("login.forgot")}
              </Link>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? t("login.submitting") : t("login.submit")}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-surface px-4 text-muted">{t("common.or")}</span>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={handleGoogleClick}
          className="w-full flex items-center justify-center gap-3 py-6 rounded-xl border border-border hover:bg-muted/10 transition-all font-medium text-foreground"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {t("login.google")}
        </Button>

        <div className="mt-8 text-center text-sm text-muted">
          {t("login.no_account")}{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            {t("login.register_link")}
          </Link>
        </div>
      </div>
    </div>
  );
}
