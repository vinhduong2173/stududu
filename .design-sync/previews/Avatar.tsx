import * as React from "react";
import { Avatar } from "frontend";

export function Sizes() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
      <Avatar fallback="M" size="sm" />
      <Avatar fallback="T" size="md" />
      <Avatar fallback="H" size="lg" />
      <Avatar fallback="S" size="xl" />
    </div>
  );
}

export function OnlineStatus() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Avatar fallback="M" size="lg" online />
      <Avatar fallback="S" size="lg" online={false} />
    </div>
  );
}
