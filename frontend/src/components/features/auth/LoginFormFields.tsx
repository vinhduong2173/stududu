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

      <Button type="submit" disabled={loading} className="sd-btn-gradient mt-2 h-14 text-base">
        {loading ? t("login.submitting") : t("login.submit")}
      </Button>
    </form>
  );
}
