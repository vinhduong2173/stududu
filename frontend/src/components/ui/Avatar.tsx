import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  fallback?: string;
  online?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-base",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
  "2xl": "h-28 w-28 sm:h-32 sm:w-32 text-3xl",
};

const dotClasses = {
  sm: "h-2.5 w-2.5 border-2",
  md: "h-3.5 w-3.5 border-2",
  lg: "h-4 w-4 border-2",
  xl: "h-5 w-5 border-4",
  "2xl": "h-6 w-6 border-4",
};

export function Avatar({
  src,
  fallback,
  online,
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [src]);

  const showImage = Boolean(src) && !imgError;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 select-none rounded-full items-center justify-center",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "relative flex h-full w-full shrink-0 overflow-hidden rounded-full items-center justify-center",
        )}
      >
        {showImage ? (
          <img
            src={src!}
            alt={fallback || "Avatar"}
            onError={() => setImgError(true)}
            className="aspect-square h-full w-full object-cover"
          />
        ) : (
          <img
            src="/images/default-avatar.jpg"
            alt={fallback || "Avatar"}
            className="aspect-square h-full w-full object-cover"
          />
        )}
      </div>

      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 flex items-center justify-center rounded-full border-2 border-surface",
            dotClasses[size],
          )}
        >
          {online ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-full w-full bg-emerald-500" />
            </>
          ) : (
            <span className="inline-flex rounded-full h-full w-full bg-muted/60" />
          )}
        </span>
      )}
    </div>
  );
}
