import * as React from "react";
import { Button } from "frontend";
import { Heart, Send } from "lucide-react";

export function Variants() {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <Button>Đăng ký</Button>
      <Button variant="secondary">
        <Heart className="w-4 h-4 mr-2 fill-current" /> Thích
      </Button>
      <Button variant="ghost">Hủy</Button>
      <Button variant="link">Quên mật khẩu?</Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <Button size="sm">Nhỏ</Button>
      <Button size="default">Mặc định</Button>
      <Button size="lg">Lớn</Button>
      <Button size="icon" aria-label="Gửi">
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
}

export function States() {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <Button disabled>Đang xử lý...</Button>
      <Button variant="secondary" disabled>
        Đã thích
      </Button>
      <Button className="w-full" style={{ minWidth: 240 }}>
        Hoàn tất & Khám phá
      </Button>
    </div>
  );
}
