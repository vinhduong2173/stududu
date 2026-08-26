"use client";

import * as React from "react";
import { PhoneCall, Shield, MessageSquare, Ban } from "lucide-react";
import { useTranslations } from "next-intl";

export function PrivacyCommunications() {
  const t = useTranslations("privacy");

  const items = [
    {
      icon: PhoneCall,
      text: t("call_privacy_item_1"),
    },
    {
      icon: MessageSquare,
      text: t("call_privacy_item_2"),
    },
    {
      icon: Ban,
      text: t("call_privacy_item_3"),
    },
  ];

  return (
    <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border shadow-xs space-y-4">
      <h2 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
        <Shield className="w-5 h-5" /> {t("section_3_title")}
      </h2>
      <ul className="space-y-3">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <li
              key={idx}
              className="p-3.5 rounded-2xl bg-surface-2/60 border border-border/60 flex items-start gap-3 text-xs sm:text-sm text-muted leading-relaxed"
            >
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4" />
              </div>
              <span className="pt-1">{item.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
