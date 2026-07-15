import * as React from "react";
import { Chip } from "frontend";

export function Variants() {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Chip>Tiếng Việt (Mẹ đẻ)</Chip>
      <Chip variant="secondary">English (Lvl 3)</Chip>
      <Chip variant="outline">Du lịch</Chip>
      <Chip variant="success">Đã xử lý</Chip>
      <Chip variant="active">Âm nhạc</Chip>
    </div>
  );
}

export function InterestPicker() {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", maxWidth: 360 }}>
      <Chip active variant="outline">Du lịch</Chip>
      <Chip variant="outline">Phim</Chip>
      <Chip active variant="outline">Âm nhạc</Chip>
      <Chip variant="outline">Ẩm thực</Chip>
      <Chip variant="outline">Công nghệ</Chip>
      <Chip active variant="outline">Đọc sách</Chip>
    </div>
  );
}
