"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function Home() {
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("accessToken")) {
      router.push("/discover");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-8 py-6">
        <Logo size="md" showTagline={true} href="/" />
        <nav className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">Đăng nhập</Button>
          </Link>
          <Link href="/register">
            <Button>Đăng ký</Button>
          </Link>
        </nav>
      </header>
      
      <main className="flex flex-1 flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 max-w-4xl tracking-tight">
          Luyện nói ngoại ngữ với <br className="hidden md:block"/> 
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            người bản xứ thật
          </span>
        </h1>
        <p className="text-lg md:text-xl text-muted mb-10 max-w-2xl">
          Tìm đối tác trao đổi ngôn ngữ hoàn hảo của bạn. Bạn dạy ngôn ngữ của bạn, họ dạy lại ngôn ngữ bạn đang học. Hoàn toàn miễn phí, dựa trên sự tương hỗ.
        </p>
        <div className="flex gap-4">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">Bắt đầu ngay</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="text-lg px-8">Đăng nhập</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
