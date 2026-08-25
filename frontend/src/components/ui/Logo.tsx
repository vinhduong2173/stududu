import * as React from "react";
import { Link } from "@/i18n/routing";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  href?: string;
  variant?: "dark" | "white";
}

export function LogoIcon({
  className = "h-8 w-8",
  globeColor = "#0284c7",
  sColor = "currentColor",
}: {
  className?: string;
  globeColor?: string;
  sColor?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} object-contain`}
    >
      {/* Earth / Globe Grid (Ocean Blue) */}
      <g stroke={globeColor}>
        <circle cx="100" cy="100" r="76" strokeWidth="12" fill="none" />
        <ellipse cx="100" cy="100" rx="36" ry="76" strokeWidth="9" fill="none" />
        <path d="M 28 68 Q 100 90 172 68" strokeWidth="9" fill="none" />
        <path d="M 28 132 Q 100 110 172 132" strokeWidth="9" fill="none" />
        <line x1="24" y1="100" x2="176" y2="100" strokeWidth="9" />
      </g>
      {/* Stylized S Curve (Original Color) */}
      <path
        d="M 148 42 C 95 18 42 52 48 95 C 54 138 152 110 144 156 C 134 194 58 188 42 156"
        stroke={sColor}
        strokeWidth="24"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({
  className,
  iconOnly = false,
  size = "md",
  showTagline = false,
  href = "/discover",
  variant = "dark",
}: LogoProps) {
  const sizeClasses = {
    sm: { icon: "h-6 w-6", text: "text-xl", gap: "gap-2" },
    md: { icon: "h-8 w-8", text: "text-2xl sm:text-3xl", gap: "gap-2.5" },
    lg: { icon: "h-12 w-12", text: "text-4xl", gap: "gap-3.5" },
  }[size];

  const isWhite = variant === "white";

  const textColorClass = isWhite ? "text-white" : "text-[#1b4332]";
  const taglineLineClass = isWhite ? "bg-white/60" : "bg-[#1b4332]";
  const taglineTextClass = isWhite ? "text-white/80" : "text-muted";
  const globeColor = isWhite ? "#38bdf8" : "#0284c7";

  const logoContent = (
    <div className={`inline-flex items-center ${sizeClasses.gap} ${textColorClass} ${className || ""}`}>
      <LogoIcon className={`${sizeClasses.icon} shrink-0`} globeColor={globeColor} sColor="currentColor" />
      {!iconOnly && (
        <div className="flex flex-col items-start leading-none">
          <span className={`font-display font-extrabold tracking-tight ${sizeClasses.text} ${textColorClass}`}>
            stududu
          </span>
          {showTagline && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`h-[2px] w-4 rounded-full ${taglineLineClass}`} />
              <span className={`text-[10px] font-medium tracking-wide ${taglineTextClass}`}>
                Speak global, connect local.
              </span>
              <span className={`h-[2px] w-4 rounded-full ${taglineLineClass}`} />
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
