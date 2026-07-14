import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "stududu — Luyện nói tiếng nước ngoài",
  description: "Web trao đổi ngôn ngữ và luyện nói 1:1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${playfairDisplay.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
