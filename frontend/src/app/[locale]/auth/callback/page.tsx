"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/api";

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (!accessToken || !refreshToken) {
      setError("Thiếu thông tin xác thực từ Google.");
      return;
    }

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    api<{ languages: any[]; role: string }>("/users/me", { token: accessToken })
      .then((me) => {
        const supportedLocales = ["en", "vi", "fr", "es", "zh"];
        const nativeLangItem = me.languages?.find((l: any) => l.role === "native" || l.role === "fluent");
        const userLangCode = nativeLangItem?.language?.code?.toLowerCase() || "";
        const targetLocale = supportedLocales.includes(userLangCode) ? userLangCode : "en";

        document.cookie = `NEXT_LOCALE=${targetLocale}; path=/; max-age=31536000`;

        if (me.role === "admin") {
          router.push("/admin", { locale: targetLocale });
        } else {
          router.push(me.languages.length === 0 ? "/onboarding" : "/discover", { locale: targetLocale });
        }
      })
      .catch((err) => {
        console.error("Error fetching user profile after Google login:", err);
        document.cookie = "NEXT_LOCALE=en; path=/; max-age=31536000";
        router.push("/login", { locale: "en" });
      });
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground p-4">
        <div className="rounded-2xl bg-error/10 p-6 text-center text-error max-w-md w-full border border-error/20">
          <p className="font-semibold">{error}</p>
          <button
            onClick={() => {
              document.cookie = "NEXT_LOCALE=en; path=/; max-age=31536000";
              router.push("/login", { locale: "en" });
            }}
            className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Quay lại trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm font-medium text-muted">Đang xử lý đăng nhập Google...</p>
    </div>
  );
}
