// Shim next/link cho design-sync bundle (ngoài Next runtime).
// Link render thành <a> thuần — component thật không đổi, chỉ môi trường đổi.
import * as React from "react";

export type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | { pathname?: string };
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  legacyBehavior?: boolean;
};

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, prefetch, replace, scroll, shallow, legacyBehavior, children, ...rest }: LinkProps,
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  const url = typeof href === "string" ? href : (href?.pathname ?? "#");
  return (
    <a ref={ref} href={url} {...rest}>
      {children}
    </a>
  );
});

export default Link;
