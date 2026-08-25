"use client";

import * as React from "react";
import { Check, Dot } from "lucide-react";
import { getPasswordCriteria } from "@/lib/password";
import { cn } from "@/lib/utils";

interface PasswordRequirementsProps {
  password?: string;
  t: (key: string) => string;
}

export function PasswordRequirements({ password = "", t }: PasswordRequirementsProps) {
  if (!password) {
    return (
      <p className="text-xs text-muted ml-1">
        {t("register.password_hint")}
      </p>
    );
  }

  const criteria = getPasswordCriteria(password);

  const items = [
    { key: "req_length", label: t("register.req_length"), met: criteria.hasMinLength },
    { key: "req_upper", label: t("register.req_upper"), met: criteria.hasUppercase },
    { key: "req_lower", label: t("register.req_lower"), met: criteria.hasLowercase },
    { key: "req_number", label: t("register.req_number"), met: criteria.hasNumber },
    { key: "req_special", label: t("register.req_special"), met: criteria.hasSpecialChar },
  ];

  return (
    <div className="mt-1.5 p-2.5 rounded-xl bg-surface border border-border/80 text-xs space-y-1.5 transition-all">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {items.map((item) => (
          <div
            key={item.key}
            className={cn(
              "flex items-center gap-1.5 font-medium transition-colors",
              item.met ? "text-emerald-600 dark:text-emerald-400" : "text-muted"
            )}
          >
            {item.met ? (
              <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
            ) : (
              <Dot className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="text-[11px] leading-tight">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
