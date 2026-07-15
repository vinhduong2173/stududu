import * as React from "react";
import { Input } from "frontend";

export function Default() {
  return (
    <div style={{ width: 320 }}>
      <Input placeholder="Email" type="email" />
    </div>
  );
}

export function WithValue() {
  return (
    <div style={{ width: 320 }}>
      <Input defaultValue="Minh Tuấn" placeholder="Tên hiển thị" />
    </div>
  );
}

export function ErrorState() {
  return (
    <div style={{ width: 320 }}>
      <Input
        type="email"
        defaultValue="minh@"
        error="Email không hợp lệ"
        placeholder="Email"
      />
    </div>
  );
}

export function Password() {
  return (
    <div style={{ width: 320 }}>
      <Input type="password" defaultValue="matkhau123" placeholder="Mật khẩu" />
    </div>
  );
}
