import * as React from "react";
import { Link } from "@/i18n/routing";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  href?: string;
}

export function LogoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <img
      src="/icon.svg"
      alt="stududu"
      className={`${className} object-contain`}
    />
  );
}

export function Logo({
  className,
  iconOnly = false,
  size = "md",
  showTagline = false,
  href = "/discover",
}: LogoProps) {
  const sizeClasses = {
    sm: { height: "h-6 sm:h-7", icon: "h-6 w-6", gap: "gap-2" },
    md: { height: "h-8 sm:h-9", icon: "h-8 w-8", gap: "gap-2.5" },
    lg: { height: "h-12 sm:h-14", icon: "h-12 w-12", gap: "gap-3.5" },
  }[size];

  const logoContent = (
    <div className={`inline-flex items-center ${sizeClasses.gap} ${className || ""}`}>
      {iconOnly ? (
        <LogoIcon className={sizeClasses.icon} />
      ) : (
        <div className="flex flex-col items-start leading-none">
          <img
            src="/stududu-logo.png"
            alt="stududu"
            className={`${sizeClasses.height} w-auto object-contain`}
          />
          {showTagline && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-[2px] w-4 rounded-full bg-[#1b4332]" />
              <span className="text-[10px] text-muted font-medium tracking-wide">
                Speak global, connect local.
              </span>
              <span className="h-[2px] w-4 rounded-full bg-[#1b4332]" />
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{logoContent}</Link>;
  }

  return logoContent;
}
