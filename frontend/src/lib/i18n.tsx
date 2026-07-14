"use client";

import * as React from "react";

/** i18n UI chrome (vi/en) — CHỈ dịch nút/nhãn/thông báo hệ thống.
 *  KHÔNG dịch nội dung user tạo (bio, tin nhắn, từ đã lưu, definition…).
 *  Locale lưu ở localStorage (không cần bảng mới), mặc định theo trình duyệt. */

export type Locale = "vi" | "en";

const DICTIONARIES: Record<Locale, Record<string, string>> = {
  vi: {
    "nav.discover": "Khám phá",
    "nav.messages": "Tin nhắn",
    "nav.vocabulary": "Từ vựng",
    "nav.community": "Cộng đồng",
    "nav.profile": "Hồ sơ",
    "menu.profile": "Hồ sơ",
    "menu.settings": "Cài đặt",
    "menu.admin": "Trang quản trị",
    "menu.logout": "Đăng xuất",
    "settings.title": "Cài đặt",
    "settings.language": "Ngôn ngữ giao diện",
    "settings.language.hint": "Chỉ áp dụng cho giao diện — nội dung của thành viên giữ nguyên ngôn ngữ gốc.",
    "settings.password": "Đổi mật khẩu",
    "settings.shareActivity": "Chia sẻ hoạt động",
    "settings.blocked": "Danh sách đã chặn",
    "common.save": "Lưu thay đổi",
    "common.cancel": "Hủy",
    "common.loading": "Đang tải...",
  },
  en: {
    "nav.discover": "Discover",
    "nav.messages": "Messages",
    "nav.vocabulary": "Vocabulary",
    "nav.community": "Community",
    "nav.profile": "Profile",
    "menu.profile": "Profile",
    "menu.settings": "Settings",
    "menu.admin": "Admin panel",
    "menu.logout": "Log out",
    "settings.title": "Settings",
    "settings.language": "Interface language",
    "settings.language.hint": "UI chrome only — user-generated content stays in its original language.",
    "settings.password": "Change password",
    "settings.shareActivity": "Share activity",
    "settings.blocked": "Blocked users",
    "common.save": "Save changes",
    "common.cancel": "Cancel",
    "common.loading": "Loading...",
  },
};

const LocaleContext = React.createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}>({ locale: "vi", setLocale: () => undefined, t: (k) => k });

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("vi");

  React.useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    if (stored === "vi" || stored === "en") {
      setLocaleState(stored);
    } else if (typeof navigator !== "undefined" && !navigator.language.startsWith("vi")) {
      setLocaleState("en"); // mặc định theo browser
    }
  }, []);

  const setLocale = React.useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
  }, []);

  const t = React.useCallback(
    (key: string) => DICTIONARIES[locale][key] ?? DICTIONARIES.vi[key] ?? key,
    [locale],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return React.useContext(LocaleContext);
}
