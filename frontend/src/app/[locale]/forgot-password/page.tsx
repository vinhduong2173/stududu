"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTranslations } from "next-intl";

export default function ForgotPasswordPage() {
  const t = useTranslations("forgot");
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock API call for now (as per MVP plan)
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      console.log(`[Mock Email] Password reset requested for ${email}`);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="mb-6 rounded-xl bg-success/10 p-4 text-sm text-success">
              {t("success_message")}
            </div>
            <Link href="/login">
              <Button variant="ghost" className="w-full">
                {t("back_to_login")}
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              type="email"
              placeholder={t("email_placeholder")}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <Button type="submit" disabled={loading}>
              {loading ? t("sending") : t("submit")}
            </Button>

            <div className="mt-4 text-center">
              <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
                {t("back_to_login")}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
