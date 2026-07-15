import * as React from "react";
import { Logo } from "frontend";

export function Default() {
  return <Logo size="md" href="" />;
}

export function WithTagline() {
  return <Logo size="lg" showTagline href="" />;
}

export function IconOnly() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Logo iconOnly size="sm" href="" />
      <Logo iconOnly size="md" href="" />
      <Logo iconOnly size="lg" href="" />
    </div>
  );
}
