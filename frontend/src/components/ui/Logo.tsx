import * as React from "react";
import Link from "next/link";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  href?: string;
}

export function LogoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top Blue/Teal shape (#227C9D) */}
      <path
        d="M 100 20 
           A 80 80 0 0 0 28 120 
           C 30 102 42 85 58 76 
           C 72 68 88 70 100 80 
           C 112 90 125 90 135 80
           C 142 72 145 62 140 52
           C 133 42 117 42 110 52
           C 105 60 108 68 115 72"
        stroke="#227C9D"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Bottom Red shape (#FE6D73) */}
      <path
        d="M 100 180 
           A 80 80 0 0 0 172 80 
           C 170 98 158 115 142 124 
           C 128 132 112 130 100 120 
           C 88 110 75 110 65 120
           C 58 128 55 138 60 148
           C 67 158 83 158 90 148
           C 95 140 92 132 85 128"
        stroke="#FE6D73"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots representing people/heads */}
      <circle cx="118" cy="52" r="10" fill="#227C9D" />
      <circle cx="82" cy="148" r="10" fill="#FE6D73" />
      
      {/* Top-Right Turquoise Accent (#17C3B2) */}
      <path
        d="M 143 37 A 80 80 0 0 1 176 80"
        stroke="#17C3B2"
        strokeWidth="16"
        strokeLinecap="round"
      />

      {/* Bottom-Left Yellow Accent (#FFCB77) */}
      <path
        d="M 57 163 A 80 80 0 0 1 24 120"
        stroke="#FFCB77"
        strokeWidth="16"
        strokeLinecap="round"
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
}: LogoProps) {
  const sizeClasses = {
    sm: { icon: "h-6 w-6", text: "text-lg", gap: "gap-2" },
    md: { icon: "h-8 w-8", text: "text-2xl", gap: "gap-2.5" },
    lg: { icon: "h-14 w-14", text: "text-4xl", gap: "gap-3.5" },
  }[size];

  const logoContent = (
    <div className={`inline-flex items-center ${sizeClasses.gap} ${className || ""}`}>
      <LogoIcon className={sizeClasses.icon} />
      
      {!iconOnly && (
        <div className="flex flex-col items-start leading-none">
          <span className={`font-bold tracking-tight ${sizeClasses.text}`}>
            <span style={{ color: "#227C9D" }}>s</span>
            <span style={{ color: "#227C9D" }}>t</span>
            <span style={{ color: "#17C3B2" }}>u</span>
            <span style={{ color: "#17C3B2" }}>d</span>
            <span style={{ color: "#FFCB77" }}>u</span>
            <span style={{ color: "#FE6D73" }}>d</span>
            <span style={{ color: "#FE6D73" }}>u</span>
          </span>
          {showTagline && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-[2px] w-4 rounded-full" style={{ backgroundColor: "#17C3B2" }} />
              <span className="text-[10px] text-muted font-medium tracking-wide">
                Speak global, connect local.
              </span>
              <span className="h-[2px] w-4 rounded-full" style={{ backgroundColor: "#FE6D73" }} />
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
