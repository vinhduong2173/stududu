"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface LoginFormFieldsProps {
  t: any;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  remember: boolean;
  setRemember: (val: boolean) => void;
  loading: boolean;
  handleLogin: (e: React.FormEvent) => void;
}

export function LoginFormFields({
  t,
  email,
  setEmail,
  password,
  setPassword,
  remember,
  setRemember,
  loading,
  handleLogin,
}: LoginFormFieldsProps) {
  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4">
      {/* Email */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted ml-1">{t("login.email")}</label>
        <Input
          type="email"
          placeholder={t("login.email")}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted ml-1">{t("login.password")}</label>
        <Input
          type="password"
          placeholder={t("login.password")}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-xs sm:text-sm text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-[#0D766E] h-4 w-4 rounded"
            />
            <span>{t("login.remember")}</span>
          </label>
          <Link href="/forgot-password" className="text-xs sm:text-sm font-semibold text-primary hover:underline">
            {t("login.forgot")}
          </Link>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="sd-btn-gradient w-full mt-2 h-12 text-sm font-bold rounded-full shadow-card active:scale-[0.98] transition-all cursor-pointer"
      >
        {loading ? t("login.submitting") : t("login.submit")}
      </Button>
    </form>
  );
}
